
const sttService = require('../services/sttService');

exports.transcribeAudio = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({ message: 'No audio file uploaded.' });
    }

    const audioBuffer = req.file.buffer;
    const language = req.body.lang || 'es'; // default to Spanish

    const transcription = await sttService.transcribe(audioBuffer, language);

    res.status(200).send({ transcription });
  } catch (error) {
    console.error('Error during transcription:', error);
    res.status(500).send({ message: 'Error processing audio file.', error: error.message });
  }
};
