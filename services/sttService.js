const WebSocket = require('ws');
const ffmpeg = require('fluent-ffmpeg');

function transcribe(audioBuffer, language) {
  return new Promise((resolve, reject) => {
    const voskServerUrl = 'ws://localhost:2700';
    const ws = new WebSocket(voskServerUrl);

    ws.on('open', () => {
      // Send configuration to Vosk server
      ws.send(JSON.stringify({ config: { sample_rate: 16000, language: language } }));

      // Convert audio to the required format and stream to Vosk
      const ffmpegProcess = ffmpeg(audioBuffer)
        .toFormat('s16le')
        .audioChannels(1)
        .audioFrequency(16000)
        .on('error', (err) => {
          reject(new Error('FFmpeg error: ' + err.message));
        })
        .pipe();

      ffmpegProcess.on('data', (chunk) => {
        ws.send(chunk);
      });

      ffmpegProcess.on('end', () => {
        ws.send('{"eof" : 1}');
      });
    });

    let final_transcript = '';
    ws.on('message', (message) => {
      const response = JSON.parse(message);
      if (response.text) {
        final_transcript += response.text + ' ';
      }
    });

    ws.on('close', () => {
      resolve(final_transcript.trim());
    });

    ws.on('error', (error) => {
      reject(new Error('WebSocket error: ' + error.message));
    });
  });
}

module.exports = { transcribe };
