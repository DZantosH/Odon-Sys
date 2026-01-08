const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

ffmpeg.setFfmpegPath(ffmpegPath);

// Configura tu API Key aquí o pásala desde index
const apiKey = process.env.OPENAI_API_KEY; 

async function transcribirAudio(media) {
    try {
        // 1. Guardar el archivo temporalmente
        const buffer = Buffer.from(media.data, 'base64');
        const tempPath = path.join(__dirname, `../temp_audio_${Date.now()}.ogg`);
        const mp3Path = tempPath.replace('.ogg', '.mp3');
        
        fs.writeFileSync(tempPath, buffer);

        // 2. Convertir OGG (WhatsApp) a MP3 (OpenAI lo prefiere)
        await new Promise((resolve, reject) => {
            ffmpeg(tempPath)
                .toFormat('mp3')
                .on('end', resolve)
                .on('error', reject)
                .save(mp3Path);
        });

        // 3. Enviar a Whisper
        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(mp3Path),
            model: "whisper-1",
        });

        // 4. Limpiar basura
        fs.unlinkSync(tempPath);
        fs.unlinkSync(mp3Path);

        return transcription.text;

    } catch (error) {
        console.error("Error transcribiendo:", error);
        return null;
    }
}

module.exports = { transcribirAudio };
