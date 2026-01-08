process.env.TZ = 'America/Mexico_City';

const { Client, LocalAuth, MessageMedia, Location } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { OpenAI } = require('openai');
const path = require('path');
const { 
    obtenerHorasOcupadas, 
    agendarCitaEnBaseDatos,
    obtenerInfoPaciente,
    obtenerHistorialCitas,
    obtenerCitasPaciente,
    cancelarCita,
    reagendarCita
} = require('./services/db');
const { transcribirAudio } = require('./services/voice');

// --- CONFIGURACIÓN ---
// Cargar .env desde la ruta correcta
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Verificar API Key
if (!process.env.OPENAI_API_KEY) {
    console.error("❌ ERROR CRÍTICO: No se encontró la OPENAI_API_KEY en el archivo .env");
    console.error("Por favor crea el archivo .env en: " + path.join(__dirname, '.env'));
    process.exit(1);
}

const openai = new OpenAI({ 
    apiKey: process.env.OPENAI_API_KEY
});

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
            '--disable-gpu',
            '--single-process'
        ]
    }
});

// Memoria de conversación
const historialConversaciones = {};

// UBICACIÓN DEL CONSULTORIO
const UBICACION = {
    lat: 19.278551, 
    lng: -98.948540,
    address: "Av Tezozomoc Manzana 48 Lote 12, Alfredo Baranda, 56610 Valle de Chalco Solidaridad, Méx."
};

// --- FUNCIÓN MATEMÁTICA PARA CALCULAR HUECOS LIBRES ---
function calcularHorariosLibres(horasOcupadas) {
    const horariosPosibles = [
        "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
        "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
        "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
        "18:00", "18:30", "19:00"
    ];

    // Normalizar horas ocupadas (HH:MM)
    const ocupadasSimple = horasOcupadas.map(h => h.substring(0, 5));
    
    // Filtrar horarios disponibles
    return horariosPosibles.filter(hora => !ocupadasSimple.includes(hora));
}

// --- HERRAMIENTAS PARA LA IA ---
const tools = [
    {
        type: "function",
        function: {
            name: "consultar_horarios",
            description: "Verifica disponibilidad para una fecha. Retorna la lista exacta de horarios libres.",
            parameters: {
                type: "object",
                properties: {
                    fecha: { type: "string", description: "Fecha en formato YYYY-MM-DD" }
                },
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
        function: {
            name: "enviar_ubicacion",
            description: "Envía el mapa con la ubicación del consultorio."
        }
    },
    {
        type: "function",
        function: {
            name: "consultar_mis_citas",
            description: "Muestra las citas programadas del paciente (solo citas futuras activas).",
            parameters: {
                type: "object",
                properties: {
                    telefono: { type: "string", description: "Teléfono del paciente (con @c.us)" }
                },
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

// --- LÓGICA DEL BOT ---

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('Escanea el QR para iniciar sesión');
});

client.on('ready', () => console.log('🤖 Ana (Bot Dental) está lista y conectada'));

client.on('message', async (message) => {
    // Ignorar grupos y mensajes propios
    if (message.from.includes('@g.us') || message.fromMe) return;

    const chatId = message.from;
    console.log(`Mensaje recibido de ${chatId}`);

    let textoUsuario = message.body;

    // 1. MANEJO DE AUDIOS
    if (message.hasMedia) {
        try {
            const media = await message.downloadMedia();
            if (media.mimetype.includes('audio') || media.mimetype.includes('ogg')) {
                console.log("🎤 Audio detectado, transcribiendo...");
                const transcripcion = await transcribirAudio(media);
                if (transcripcion) {
                    textoUsuario = `[AUDIO DEL USUARIO]: ${transcripcion}`;
                    await client.sendMessage(chatId, `_Escuché: "${transcripcion}"_ 👂`);
                } else {
                    await client.sendMessage(chatId, "No pude entender el audio, ¿podrías escribirlo? 😅");
                    return;
                }
            }
        } catch (e) {
            console.error("Error procesando audio:", e);
        }
    }

    // 2. INICIALIZAR MEMORIA Y PERSONALIDAD
    if (!historialConversaciones[chatId]) {
        const hoy = new Date();
        const fechaActual = hoy.toLocaleDateString('es-MX', { 
            timeZone: 'America/Mexico_City',
            year: 'numeric',
            month: '2-digit', 
            day: '2-digit' 
        }).split('/').reverse().join('-'); // Formato YYYY-MM-DD
        
        const horaActual = hoy.toLocaleString('es-MX', { 
            timeZone: 'America/Mexico_City', 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long',
            year: 'numeric',
            hour: 'numeric', 
            minute: 'numeric' 
        });

        // ✅ VERIFICAR SI EL PACIENTE YA EXISTE
        const infoPaciente = await obtenerInfoPaciente(chatId);
        
        let saludoPersonalizado = "";
        let contextoPaciente = "";
        
        if (infoPaciente.existe) {
            saludoPersonalizado = `El paciente se llama ${infoPaciente.nombreCompleto} y ya está registrado en el sistema.`;
            
            // Obtener historial de citas
            const historial = await obtenerHistorialCitas(infoPaciente.id, 3);
            if (historial.length > 0) {
                contextoPaciente = `\n\nHISTORIAL DE CITAS PREVIAS:\n`;
                historial.forEach(cita => {
                    contextoPaciente += `- ${cita.fecha_cita}: ${cita.tipo_cita} (${cita.estado})\n`;
                });
            }
        } else {
            saludoPersonalizado = `Este es un paciente NUEVO. Aún no está registrado en el sistema.`;
        }

        historialConversaciones[chatId] = [
            { role: "system", content: `
                Actúas como 'Ana', la asistente del consultorio dental "Odon-Sys". 🦷✨
                
                INFORMACIÓN DEL PACIENTE:
                ${saludoPersonalizado}
                ${contextoPaciente}
                
                INSTRUCCIONES SEGÚN EL TIPO DE PACIENTE:
                ${infoPaciente.existe ? 
                    `- Este paciente YA está registrado como "${infoPaciente.nombreCompleto}"
                     - Salúdalo por su nombre de forma natural: "¡Hola ${infoPaciente.nombre}! 😊"
                     - NO le pidas su nombre otra vez
                     - Si menciona que es su primera vez, corrígelo amablemente recordándole sus citas previas` 
                    : 
                    `- Este es un paciente NUEVO
                     - Preséntate amablemente
                     - Pídele su nombre completo para registrarlo
                     - Una vez que te lo dé, úsalo en la conversación`
                }
                
                TU OBJETIVO PRINCIPAL: Agendar citas eficientemente.
                
                FECHA Y HORA ACTUAL:
                - HOY ES: ${fechaActual} (${horaActual})
                - Cuando el usuario pida citas, SIEMPRE usa fechas a partir de HOY o futuras.
                - NUNCA uses años pasados. El año actual es ${hoy.getFullYear()}.
                
                MANEJO DE HORARIOS:
                - Consultorio: 9:00 AM a 7:00 PM (09:00 a 19:00 en formato 24hrs)
                - Si dicen "6", "6:00" → PREGUNTA si es AM o PM
                - "6 de la tarde", "6 pm" → 18:00:00
                - "10 de la mañana", "10 am" → 10:00:00
                - CONFIRMA en AMBOS formatos: "6:00 PM (18:00 hrs) ✅"
                
                CONVERSIÓN PM:
                1 PM=13:00, 2 PM=14:00, 3 PM=15:00, 4 PM=16:00, 
                5 PM=17:00, 6 PM=18:00, 7 PM=19:00
                
                AL AGENDAR:
                - 'hora' siempre en formato 24hrs: "HH:mm:ss"
                - Si es paciente nuevo, usa el nombre que te proporcionó
                - Si es paciente registrado, usa "${infoPaciente.nombreCompleto || 'el nombre del sistema'}"

                GESTIÓN DE CITAS:
                - Cuando el paciente diga "quiero cancelar mi cita", usa consultar_mis_citas para ver sus citas
                - Muestra las citas encontradas con su ID y pide confirmación antes de cancelar
                - Para cancelar: usa cancelar_cita con el ID de la cita
                - Para reagendar: primero consulta_horarios para ver disponibilidad, luego reagendar_cita
                - Siempre confirma la acción antes de ejecutarla
                - Al mostrar citas, indica el ID entre paréntesis: "Cita del 7 de dic a las 6:30 PM (ID: 62)"

                EJEMPLOS DE GESTIÓN:
                Usuario: "Quiero cancelar mi cita"
                1. Llama consultar_mis_citas
                2. Muestra: "Tienes cita el 7 de dic a las 6:30 PM (ID: 62). ¿Quieres cancelarla?"
                3. Si confirma → cancelar_cita(cita_id: 62)

                Usuario: "Quiero cambiar mi cita para el lunes"
                1. Llama consultar_mis_citas (ver cita actual)
                2. Llama consultar_horarios (ver disponibilidad del lunes)
                3. Pregunta qué hora prefiere
                4. Llama reagendar_cita con el ID de la cita actual

                PERSONALIDAD:
                - Amable, profesional, toque mexicano
                - Usa emojis para calidez
                - Respuestas cortas y directas
                - Confirma citas en formato legible
            `}
        ];
    }
    
    // Agregar lo que dijo el usuario al historial
    historialConversaciones[chatId].push({ role: "user", content: textoUsuario });

    // 3. CEREBRO IA (LOOP DE HERRAMIENTAS)
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: historialConversaciones[chatId],
            tools: tools,
            tool_choice: "auto"
        });

        const respuestaIA = completion.choices[0].message;

        // ¿La IA quiere usar una herramienta?
        if (respuestaIA.tool_calls) {
            historialConversaciones[chatId].push(respuestaIA);

            for (const toolCall of respuestaIA.tool_calls) {
                const funcion = toolCall.function.name;
                const args = JSON.parse(toolCall.function.arguments);
                let resultadoTool = "";

                console.log(`🔧 Ejecutando herramienta: ${funcion}`);

                if (funcion === 'consultar_horarios') {
                    const horasOcupadas = await obtenerHorasOcupadas(args.fecha);
                    const libres = calcularHorariosLibres(horasOcupadas);
                    
                    console.log(`📅 Fecha: ${args.fecha} | Ocupadas: ${horasOcupadas.length} | Libres: ${libres.length}`);

                    if (libres.length > 0) {
                        resultadoTool = JSON.stringify({ 
                            status: "disponible",
                            mensaje: "Sí hay citas disponibles. Esta es la lista de horarios libres:",
                            HORARIOS_DISPONIBLES: libres 
                        });
                    } else {
                        resultadoTool = JSON.stringify({ 
                            status: "lleno",
                            mensaje: "El día está completamente lleno.",
                            HORARIOS_DISPONIBLES: [] 
                        });
                    }
                } 
                else if (funcion === 'agendar_cita') {
                    const exito = await agendarCitaEnBaseDatos({ 
                        ...args, 
                        telefono: chatId.replace('@c.us', '') 
                    });
                    resultadoTool = exito 
                        ? "Cita guardada exitosamente en BD." 
                        : "Error técnico al guardar en BD.";
                }
                else if (funcion === 'enviar_ubicacion') {
                    const loc = new Location(UBICACION.lat, UBICACION.lng, UBICACION.address);
                    await client.sendMessage(chatId, loc);
                    resultadoTool = "Mapa enviado.";
                }
                else if (funcion === 'consultar_mis_citas') {
                    const citas = await obtenerCitasPaciente(chatId);
                    
                    if (citas.length > 0) {
                        resultadoTool = JSON.stringify({
                            status: "ok",
                            mensaje: `El paciente tiene ${citas.length} cita(s) programada(s)`,
                            citas: citas.map(c => ({
                                id: c.id,
                                fecha: c.fecha_cita,
                                hora: c.hora_cita,
                                tipo: c.tipo_cita,
                                estado: c.estado
                            }))
                        });
                    } else {
                        resultadoTool = JSON.stringify({
                            status: "sin_citas",
                            mensaje: "El paciente no tiene citas programadas",
                            citas: []
                        });
                    }
                }
                else if (funcion === 'cancelar_cita') {
                    const exito = await cancelarCita(args.cita_id, args.motivo || 'Cancelado por el paciente');
                    resultadoTool = exito 
                        ? `Cita ${args.cita_id} cancelada exitosamente` 
                        : `No se pudo cancelar la cita ${args.cita_id}`;
                }
                else if (funcion === 'reagendar_cita') {
                    const exito = await reagendarCita(args.cita_id, args.nueva_fecha, args.nueva_hora);
                    resultadoTool = exito 
                        ? `Cita ${args.cita_id} reagendada a ${args.nueva_fecha} ${args.nueva_hora}` 
                        : `No se pudo reagendar la cita ${args.cita_id}`;
                }

                // Devolver el resultado técnico a la IA
                historialConversaciones[chatId].push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: resultadoTool
                });
            }

            // Segunda llamada a OpenAI para que interprete el resultado y conteste bonito
            const completionFinal = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: historialConversaciones[chatId]
            });
            
            const textoFinal = completionFinal.choices[0].message.content;
            await client.sendMessage(chatId, textoFinal);
            historialConversaciones[chatId].push({ role: "assistant", content: textoFinal });

        } else {
            // Respuesta normal (charla) sin herramientas
            const textoFinal = respuestaIA.content;
            await client.sendMessage(chatId, textoFinal);
            historialConversaciones[chatId].push({ role: "assistant", content: textoFinal });
        }

    } catch (error) {
        console.error("Error OpenAI:", error);
    }
});

client.initialize();
