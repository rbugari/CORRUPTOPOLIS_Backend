require('dotenv').config();
const express = require('express');
const { connectDB, sequelize } = require('./config/db');
const cors = require('cors');

// Import models to ensure they are defined before syncing
require('./models/User');
require('./models/GameConfig');
require('./models/GameInteraction');
require('./models/GameLevel');
require('./models/LLMConfig');
require('./models/LLMInteractionHistory');
require('./models/LLMCategoryGenerationHistory');
require('./models/LLMCardGenerationHistory');
require('./models/UserGameState');

const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/game');
const aiRoutes = require('./routes/ai');
const historyRoutes = require('./routes/history');
const uploadRoutes = require('./routes/upload');
const sttRoutes = require('./routes/stt');
const monetizationRoutes = require('./routes/monetization');
const monetizationController = require('./controllers/monetizationController');

const { loadGameConfig } = require('./config/gameConfig');
const aiService = require('./services/aiService');

const app = express();
// Added a comment to force Railway rebuild

// Init Middleware
app.use(express.static('public'));

// Stripe webhook needs the raw body, so it must come before express.json
app.post('/api/monetization/stripe-webhook', express.raw({type: 'application/json'}), monetizationController.handleStripeWebhook);

app.use(express.json({ extended: false }));
app.use(cors({ origin: '*', methods: 'GET,POST,PUT,DELETE', allowedHeaders: 'Content-Type,Authorization' }));

app.get('/', (req, res) => res.send('API Running'));

// Define Routes
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/stt', sttRoutes);
app.use('/api/monetization', monetizationRoutes);


const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    
    await loadGameConfig();
    await aiService.initialize();
    app.listen(PORT, () => console.log(`Servidor backend listo para operar en el puerto ${PORT}`));
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();