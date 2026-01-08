const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { pool, testConnection } = require('./config/database');
require('dotenv').config();
const { verifyToken } = require('./middleware/auth');
const auth2FARoutes = require('./routes/auth-2fa');

// --- IMPORTACIONES DEL BOT DE WHATSAPP ---
const { Client, LocalAuth, Location } = require('whatsapp-web.js'); // Quitamos MessageMedia si no se usa globalmente, o agrégalo si lo necesitas
const qrcodeTerminal = require('qrcode-terminal'); // Renombrado para no confundir
const { OpenAI } = require('openai');
// Asegúrate de que estas rutas sean correctas relativo a server.js
const { 
    obtenerHorasOcupadas, 
    agendarCitaEnBaseDatos,
    obtenerInfoPaciente,
    obtenerHistorialCitas,
    obtenerCitasPaciente,
    cancelarCita,
    reagendarCita,
    obtenerAgendaDia,     
    obtenerResumenDia
} = require('./services/db');
const { transcribirAudio } = require('./services/voice');

// ==========================================
// CONFIGURACIÓN DEL BOT (VARIABLES GLOBALES)
// ==========================================
let globalQR = null;
let isBotConnected = false;
const historialConversaciones = {};
const userPenalties = {}; // Almacena: { 'telefono': { advertencias: 0, fin_castigo: 0, ultima_falta: 0 } }
const GROSERIAS = /estupido|idiota|imbecil|pendeja|pendejo|pndj|stupid|idiot|fuckyou|fuck you|tu puta madre|tpm|hijo de perra|hdp|hijo de puta|hijo de tu putisima madre|culo|puta|mierda|puto|chinga|verga|tonto|inutil|baboso|zorra|maldita|maldito|bobo|pito/i;
const mensajesDelBot = new Set();

// UBICACIÓN DEL CONSULTORIO
const UBICACION = {
    lat: 19.278551, 
    lng: -98.948540,
    address: "Av Tezozomoc Manzana 48 Lote 12, Alfredo Baranda, 56610 Valle de Chalco Solidaridad, Méx."
};

// Inicializar OpenAI
if (!process.env.OPENAI_API_KEY) {
    console.warn("⚠️ ADVERTENCIA: No se encontró OPENAI_API_KEY. El bot no responderá con IA.");
}
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser'
    }
});

// ==========================================
// CONFIGURACIÓN EXPRESS
// ==========================================
const app = express();
const PORT = process.env.PORT || 5000;

// ... (El resto de tu configuración de Directorios y Multer se mantiene igual) ...
const createUploadDirectories = () => {
    const directories = ['uploads', 'uploads/avatars', 'uploads/radiografias', 'uploads/estudios', 'uploads/documentos'];
    directories.forEach(dir => {
        const fullPath = path.join(__dirname, dir);
        if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
    });
};
createUploadDirectories();

// ... (Tu configuración de Multer para avatares sigue igual) ...
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads/avatars')),
  filename: (req, file, cb) => cb(null, `user-${req.params.id}-${Date.now()}${path.extname(file.originalname)}`)
});
const avatarUpload = multer({ storage: avatarStorage, limits: { fileSize: 5 * 1024 * 1024 } });

// Middlewares Express
app.use(cors({
    origin: [
        'http://167.86.87.123', 
        'http://localhost:3000', 
        'http://localhost:3001'  // <--- ¡AGREGA ESTA LÍNEA! (Es el puerto del HK)
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==========================================
// LÓGICA DEL BOT (EVENTOS)
// ==========================================

client.on('qr', (qr) => {
    console.log('📱 QR DE WHATSAPP GENERADO');
    qrcodeTerminal.generate(qr, { small: true }); // Mostrar en terminal también por si acaso
    globalQR = qr; // <--- AQUÍ GUARDAMOS EL QR PARA EL FRONTEND
    isBotConnected = false;
});

client.on('ready', () => {
    console.log('🤖 Ana (Bot Dental) está lista y conectada');
    globalQR = null; // Limpiamos el QR
    isBotConnected = true;
});

client.on('authenticated', () => {
    console.log('✅ Bot Autenticado');
    isBotConnected = true;
    globalQR = null;
});

client.on('disconnected', (reason) => {
    console.log('❌ Bot desconectado:', reason);
    isBotConnected = false;
    globalQR = null;
    // Opcional: Reiniciar cliente automáticamente
    client.initialize();
});

// Lógica de Mensajes (Copiada de tu index.js)
// Lógica de Mensajes (Copiada de tu index.js)
// Lógica de Mensajes (Copiada de tu index.js)
// ==========================================
// 🧠 LÓGICA DEL CEREBRO (OPENAI + TOOLS)
// ==========================================

// 1. Función auxiliar para calcular huecos (MEJORADA)
function calcularHorariosLibres(horasOcupadas, fechaSolicitada) {
    const horariosPosibles = [
        "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
        "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
        "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
        "18:00", "18:30", "19:00"
    ];
    
    // Normalizar horas ocupadas (HH:MM)
    const ocupadasSimple = horasOcupadas.map(h => h.substring(0, 5));
    let disponibles = horariosPosibles.filter(hora => !ocupadasSimple.includes(hora));

    // 🔥 LÓGICA NUEVA: Filtrar horas pasadas si es HOY
    const ahora = new Date();
    const fechaHoy = ahora.toLocaleDateString('es-MX', { 
        timeZone: 'America/Mexico_City', 
        year: 'numeric', month: '2-digit', day: '2-digit' 
    }).split('/').reverse().join('-'); // Formato YYYY-MM-DD

    if (fechaSolicitada === fechaHoy) {
        // Obtener hora actual en formato HH:MM
        const horaActual = ahora.toLocaleTimeString('es-MX', { 
            timeZone: 'America/Mexico_City', 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        // Dejar solo las horas MAYORES a la actual
        disponibles = disponibles.filter(hora => hora > horaActual);
    }

    return disponibles;
}

// 2. Definición de Herramientas para la IA
const tools = [
    {
        type: "function",
        function: {
            name: "consultar_horarios",
            description: "Verifica disponibilidad para una fecha. Retorna la lista exacta de horarios libres.",
            parameters: {
                type: "object",
                properties: { fecha: { type: "string", description: "Fecha en formato YYYY-MM-DD" } },
                required: ["fecha"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "agendar_cita",
            description: "Guarda una cita confirmada en la base de datos.",
            parameters: {
                type: "object",
                properties: {
                    fecha: { type: "string", description: "YYYY-MM-DD" },
                    hora: { type: "string", description: "HH:mm:ss" },
                    nombre: { type: "string", description: "Nombre del paciente" },
                    motivo: { type: "string", description: "Motivo de la consulta" }
                },
                required: ["fecha", "hora", "nombre"]
            }
        }
    },
    {
        type: "function",
        function: { name: "enviar_ubicacion", description: "Envía el mapa con la ubicación del consultorio." }
    },
    {
        type: "function",
        function: {
            name: "consultar_mis_citas",
            description: "Muestra las citas programadas del paciente (solo citas futuras activas).",
            parameters: {
                type: "object",
                properties: { telefono: { type: "string", description: "Teléfono del paciente (con @c.us)" } },
                required: ["telefono"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "cancelar_cita",
            description: "Cancela una cita existente del paciente.",
            parameters: {
                type: "object",
                properties: {
                    cita_id: { type: "integer", description: "ID de la cita a cancelar" },
                    motivo: { type: "string", description: "Razón de la cancelación" }
                },
                required: ["cita_id"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "reagendar_cita",
            description: "Cambia la fecha y/u hora de una cita existente.",
            parameters: {
                type: "object",
                properties: {
                    cita_id: { type: "integer", description: "ID de la cita a reagendar" },
                    nueva_fecha: { type: "string", description: "Nueva fecha YYYY-MM-DD" },
                    nueva_hora: { type: "string", description: "Nueva hora HH:mm:ss" }
                },
                required: ["cita_id", "nueva_fecha", "nueva_hora"]
            }
        }
    }
];

// ==========================================
// 🛠️ HERRAMIENTAS DE ADMIN (PARA EL GRUPO)
// ==========================================
const adminTools = [
    {
        type: "function",
        function: {
            name: "ver_agenda_dia",
            description: "Muestra TODAS las citas programadas para una fecha específica. Útil para que el doctor vea su día.",
            parameters: {
                type: "object",
                properties: { fecha: { type: "string", description: "Fecha YYYY-MM-DD" } },
                required: ["fecha"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "resumen_operativo",
            description: "Muestra un conteo rápido de citas y estado del consultorio.",
            parameters: {
                type: "object",
                properties: { fecha: { type: "string", description: "Fecha YYYY-MM-DD" } },
                required: ["fecha"]
            }
        }
    }
];

// 3. EVENTO PRINCIPAL DE MENSAJES
client.on('message_create', async (message) => {   
    
    // 🔥 1. DETECTOR DE ECO
    // Si el mensaje es algo que YO (el bot) acabo de decir, lo ignoro.
    if (mensajesDelBot.has(message.body)) {
        console.log(`🙊 Ignorando mi propio mensaje (Eco): ${message.body.substring(0, 20)}...`);
        mensajesDelBot.delete(message.body);
        return;
    }

    const chatId = message.fromMe ? message.to : message.from;
    const esGrupo = chatId.includes('@g.us');
    const now = Date.now();

    // 2. FILTRO DE PRIVACIDAD
    // Si es privado Y soy yo -> Ignorar.
    if (!esGrupo && message.fromMe) return;

    console.log(`📩 (${esGrupo ? 'GRUPO' : 'PRIVADO'}) ${message.fromMe ? 'YO' : 'OTRO'}: ${message.body}`);

    // =======================================================
    // 🏥 MODO DOCTOR (SOLO EN GRUPOS)
    // =======================================================
    if (esGrupo) {
        
        if (!historialConversaciones[chatId]) {
             const hoy = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');
             historialConversaciones[chatId] = [{ 
                role: "system", 
                content: `Eres el Asistente Administrativo de Odon-Sys.
                Responde al Doctor de forma BREVE y EJECUTIVA.
                FECHA: ${hoy}.
                Si no hay nada que reportar, di simplemente "Sin novedades".`
            }];
        }

        historialConversaciones[chatId].push({ role: "user", content: message.body });

        try {
            await new Promise(r => setTimeout(r, 1000)); 

            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: historialConversaciones[chatId],
                tools: adminTools,
                tool_choice: "auto"
            });

            const respuestaIA = completion.choices[0].message;

            if (respuestaIA.tool_calls) {
                historialConversaciones[chatId].push(respuestaIA); 

                for (const toolCall of respuestaIA.tool_calls) {
                    const args = JSON.parse(toolCall.function.arguments);
                    let resultado = "";
                    console.log(`🔧 Admin Tool: ${toolCall.function.name}`);

                    if (toolCall.function.name === 'ver_agenda_dia') {
                        const citas = await obtenerAgendaDia(args.fecha); 
                        if(citas.length === 0) resultado = "Agenda vacía.";
                        else resultado = JSON.stringify(citas.map(c => `${c.hora_cita.substring(0,5)} - ${c.nombre} ${c.apellido_paterno} (${c.tipo_cita})`));
                    }
                    else if (toolCall.function.name === 'resumen_operativo') {
                        const resumen = await obtenerResumenDia(args.fecha);
                        resultado = JSON.stringify(resumen);
                    }

                    historialConversaciones[chatId].push({ role: "tool", tool_call_id: toolCall.id, content: resultado });
                }

                const final = await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: historialConversaciones[chatId]
                });
                
                // 🔥 GUARDAR EN MEMORIA (ANTI-ECO)
                const textoFinal = final.choices[0].message.content;
                mensajesDelBot.add(textoFinal); 
                await client.sendMessage(chatId, textoFinal);

            } else {
                const ultimoMensajeIA = historialConversaciones[chatId][historialConversaciones[chatId].length - 2];
                if (ultimoMensajeIA && ultimoMensajeIA.content === message.body) return;

                // 🔥 GUARDAR EN MEMORIA (ANTI-ECO)
                const textoFinal = respuestaIA.content;
                mensajesDelBot.add(textoFinal);
                await client.sendMessage(chatId, textoFinal);
            }
        } catch (e) { console.error("Error grupo:", e); }
        
        return; // ⛔ AQUÍ TERMINA EL MODO GRUPO
    }

    // =======================================================
    // 🦷 MODO PACIENTE (Privado)
    // =======================================================
    
    // AQUÍ SÍ bloqueamos 'fromMe'.
    if (message.fromMe) return;

    // 🛡️ SISTEMA ANTI-GROSERÍAS
    if (userPenalties[chatId] && userPenalties[chatId].fin_castigo > now) {
        console.log(`🚫 Usuario ${chatId} ignorado (Castigo activo).`);
        return;
    }

    if (GROSERIAS.test(message.body)) {
        if (!userPenalties[chatId]) userPenalties[chatId] = { advertencias: 0, fin_castigo: 0, ultima_falta: 0 };
        if (now - userPenalties[chatId].ultima_falta > 24 * 60 * 60 * 1000) userPenalties[chatId].advertencias = 0;
        
        userPenalties[chatId].advertencias++;
        userPenalties[chatId].ultima_falta = now;
        
        const faltas = userPenalties[chatId].advertencias;
        const minutos = faltas === 1 ? 2 : (faltas === 2 ? 5 : 30);
        
        userPenalties[chatId].fin_castigo = now + (minutos * 60 * 1000);
        await client.sendMessage(chatId, `⚠️ Lenguaje inapropiado detectado. No responderé por ${minutos} minutos.`);
        return;
    }

    console.log(`📩 Mensaje recibido de ${chatId}: ${message.body}`);

    // A) MANEJO DE AUDIOS
    let textoUsuario = message.body; 

    if (message.hasMedia) {
        try {
            const media = await message.downloadMedia();
            if (media.mimetype.includes('audio') || media.mimetype.includes('ogg')) {
                console.log("🎤 Audio detectado, intentando transcribir...");
                const transcripcion = await transcribirAudio(media);
                
                if (transcripcion) {
                    console.log(`🗣️ Transcripción: "${transcripcion}"`);
                    textoUsuario = `[AUDIO DEL USUARIO]: ${transcripcion}`;
                } else {
                    await client.sendMessage(chatId, "Tuve problemas para escuchar ese audio 😅 ¿Podrías escribirlo?");
                    return; 
                }
            }
        } catch (e) {
            console.error("Error procesando audio:", e);
        }
    }

    // B) INICIALIZAR MEMORIA PACIENTE
    if (!historialConversaciones[chatId]) {
        const objFecha = new Date();
        const fechaActual = objFecha.toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-'); 
        const horaActual = objFecha.toLocaleTimeString('es-MX', { timeZone: 'America/Mexico_City', hour: '2-digit', minute: '2-digit' });

        const infoPaciente = await obtenerInfoPaciente(chatId);
        
        let contextoPaciente = infoPaciente.existe 
            ? `Paciente registrado: ${infoPaciente.nombreCompleto}.` 
            : `Paciente NUEVO.`;

        if (infoPaciente.existe) {
            const historial = await obtenerHistorialCitas(infoPaciente.id, 3);
            if (historial.length > 0) contextoPaciente += `\nHistorial: ` + historial.map(c => `${c.fecha_cita} (${c.tipo_cita})`).join(', ');
        }

        historialConversaciones[chatId] = [
            { role: "system", content: `
                Eres 'Ana', la asistente virtual EXCLUSIVA del consultorio dental "Odon-Sys". 🦷
                TIEMPO ACTUAL: ${fechaActual} ${horaActual}
                CONTEXTO: ${contextoPaciente}
                
                ⛔ REGLAS:
                1. CERO TEMAS GENERALES.
                2. NO inventes motivos, PREGUNTA.
                3. Pide nombre si es nuevo.
                4. Usa emojis amables.
            `}
        ];
    }
    
    historialConversaciones[chatId].push({ role: "user", content: textoUsuario });

    // C) CEREBRO IA PACIENTE
    if (!openai) return;

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: historialConversaciones[chatId],
            tools: tools, // 👈 TOOLS NORMALES
            tool_choice: "auto"
        });

        const respuestaIA = completion.choices[0].message;

        if (respuestaIA.tool_calls) {
            historialConversaciones[chatId].push(respuestaIA);

            for (const toolCall of respuestaIA.tool_calls) {
                const funcion = toolCall.function.name;
                const args = JSON.parse(toolCall.function.arguments);
                let resultadoTool = "";

                console.log(`🔧 Tool: ${funcion}`, args);

                if (funcion === 'consultar_horarios') {
                    const horasOcupadas = await obtenerHorasOcupadas(args.fecha);
                    const libres = calcularHorariosLibres(horasOcupadas, args.fecha);
                    resultadoTool = JSON.stringify({ 
                        status: libres.length > 0 ? "disponible" : "lleno",
                        HORARIOS_DISPONIBLES: libres 
                    });
                } 
                else if (funcion === 'agendar_cita') {
                    if (!args.motivo || args.motivo.toLowerCase().includes('muela') && !textoUsuario.includes('muela')) {
                         args.motivo = "Consulta General"; 
                    }
                    const exito = await agendarCitaEnBaseDatos({ ...args, telefono: chatId.replace('@c.us', '') });
                    resultadoTool = exito ? "Éxito." : "Error BD.";
                }
                else if (funcion === 'enviar_ubicacion') {
                    const loc = new Location(UBICACION.lat, UBICACION.lng, UBICACION.address);
                    await client.sendMessage(chatId, loc);
                    resultadoTool = "Mapa enviado.";
                }
                else if (funcion === 'consultar_mis_citas') {
                    const citas = await obtenerCitasPaciente(chatId);
                    resultadoTool = JSON.stringify({ status: "ok", citas: citas });
                }
                else if (funcion === 'cancelar_cita') {
                    const exito = await cancelarCita(args.cita_id, args.motivo);
                    resultadoTool = exito ? "Cancelada." : "Error.";
                }
                else if (funcion === 'reagendar_cita') {
                    const exito = await reagendarCita(args.cita_id, args.nueva_fecha, args.nueva_hora);
                    resultadoTool = exito ? "Reagendada." : "Error.";
                }

                historialConversaciones[chatId].push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: resultadoTool
                });
            }

            const completionFinal = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: historialConversaciones[chatId]
            });
            
            const textoFinal = completionFinal.choices[0].message.content;
            await client.sendMessage(chatId, textoFinal);
            historialConversaciones[chatId].push({ role: "assistant", content: textoFinal });

        } else {
            const textoFinal = respuestaIA.content;
            await client.sendMessage(chatId, textoFinal);
            historialConversaciones[chatId].push({ role: "assistant", content: textoFinal });
        }

    } catch (error) { console.error("Error OpenAI:", error); }
});

// RUTAS API PARA EL FRONTEND (BOT CONTROL)
// 1. Obtener estado del bot
app.get('/api/admin/bot/status', (req, res) => {
    // Puedes agregar verifyToken aquí si quieres protegerlo
    if (isBotConnected) {
        res.json({ status: 'connected', qr_code: null });
    } else if (globalQR) {
        res.json({ status: 'qr', qr_code: globalQR });
    } else {
        res.json({ status: 'loading', qr_code: null }); // 'loading' o 'disconnected'
    }
});

// 2. Cerrar sesión del bot
app.post('/api/admin/bot/logout', async (req, res) => {
    try {
        await client.logout();
        isBotConnected = false;
        globalQR = null;
        
        // Reiniciamos para que genere nuevo QR inmediatamente
        setTimeout(() => {
            client.initialize();
        }, 1000);
        
        res.json({ message: 'Sesión cerrada. Generando nuevo QR...' });
    } catch (e) {
        console.error(e);
        // A veces falla si ya estaba desconectado, forzamos reinicio
        client.initialize();
        res.status(200).json({ message: 'Re-inicializando cliente...' });
    }
});


// ==========================================
// RUTAS STANDARD DEL SISTEMA
// ==========================================
const { verificarHorarioAcceso } = require('./middleware/horarioAcceso');
const authRoutes = require('./routes/auth');
const usuariosRoutes = require('./routes/usuarios');
const pacientesRoutes = require('./routes/pacientes');
const citasRoutes = require('./routes/citas');
const adminRoutes = require('./routes/admin');
const finanzasRoutes = require('./routes/finanzas');

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes); // Agregar verifyToken si es necesario
app.use('/api/pacientes', pacientesRoutes);
app.use('/api/citas', citasRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/finanzas', finanzasRoutes);
// ... montar resto de rutas ...


// ==========================================
// INICIO DEL SERVIDOR
// ==========================================
const startServer = async () => {
    try {
        const dbConnected = await testConnection();
        if (!dbConnected) {
            console.error('❌ Error fatal: Sin conexión a DB');
            process.exit(1);
        }

        // 1. INICIAR SERVIDOR EXPRESS
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Servidor Web corriendo en puerto ${PORT}`);
        });

        // 2. INICIAR BOT DE WHATSAPP
        console.log('🔄 Iniciando cliente de WhatsApp...');
        client.initialize();

    } catch (error) {
        console.error('Error al iniciar:', error);
    }
};

startServer();
