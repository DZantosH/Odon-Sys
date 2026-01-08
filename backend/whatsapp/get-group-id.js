const { Client, LocalAuth } = require('whatsapp-web.js');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { args: ['--no-sandbox'] }
});

client.on('ready', async () => {
    console.log('Bot conectado');
    const chats = await client.getChats();
    
    console.log('\n📋 GRUPOS DISPONIBLES:\n');
    chats.forEach(chat => {
        if (chat.isGroup) {
            console.log(`Nombre: ${chat.name}`);
            console.log(`ID: ${chat.id._serialized}`);
            console.log('---');
        }
    });
    
    process.exit(0);
});

client.initialize();
