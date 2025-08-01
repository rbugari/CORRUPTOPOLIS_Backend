const User = require('../models/User');
const UserGameState = require('../models/UserGameState'); // Importar UserGameState
const GameLevel = require('../models/GameLevel');     // Importar GameLevel
const GameConfig = require('../models/GameConfig');
const { sequelize } = require('../config/db');

const stripeSecretKey = process.env.NODE_ENV === 'production' 
    ? process.env.STRIPE_SECRET_KEY_LIVE 
    : process.env.STRIPE_SECRET_KEY_TEST;

const stripe = require('stripe')(stripeSecretKey);

// Helper function to get config value
const getConfigValue = async (key) => {
  const config = await GameConfig.findOne({ where: { config_key: key } });
  return config ? config.config_value : null;
};

exports.createPremiumCheckoutSession = async (req, res) => {
  console.log('Attempting to create Stripe checkout session...');
  try {
    const userId = req.user.id;
    console.log(`User ID: ${userId}`);

    const premiumPrice = await getConfigValue('PRECIO_PREMIUM_PASS');
    console.log(`Premium Price from DB: ${premiumPrice}`);

    const frontendUrl = process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL_PROD : process.env.FRONTEND_URL_DEV;
    console.log(`Frontend URL: ${frontendUrl}`);

    if (!premiumPrice || !frontendUrl) {
      console.error('Missing premium price or frontend URL in config.');
      return res.status(500).json({ message: 'Error de configuración del servidor.' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Pase Premium - Corruptopolis',
            },
            unit_amount: parseFloat(premiumPrice) * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${frontendUrl}/game?payment_success=true`,
      cancel_url: `${frontendUrl}/premium-access?payment_cancelled=true`,
      client_reference_id: userId,
    });

    console.log('Stripe session created successfully.');
    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating Stripe checkout session:', error);
    res.status(500).json({ message: 'Error al crear la sesión de pago.' });
  }
};

exports.simulatePremiumPurchase = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming user ID is available from authentication middleware
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.premium) {
      return res.status(400).json({ message: 'Premium already purchased.' });
    }

    user.premium = true;
    // Check if both payments are made
    
    await user.save();

    res.status(200).json({ message: 'Premium pass simulated successfully.', user });
  } catch (error) {
    console.error('Error simulating premium purchase:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.simulateScandalRescuePurchase = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.rescatePago) {
      return res.status(400).json({ message: 'Scandal rescue already purchased for this incident.' });
    }

    user.rescatePago = true;
    // Check if both payments are made
    const precioRescateEscandalo = parseFloat(await getConfigValue('PRECIO_RESCATE_ESCANDALO'));
    const precioTotalDesbloqueo = parseFloat(await getConfigValue('PRECIO_TOTAL_DESBLOQUEO'));

    if (user.premium && precioRescateEscandalo >= precioTotalDesbloqueo) {
    }
    await user.save();
    res.status(200).json({ message: 'Scandal rescue simulated successfully.', user });
  } catch (error) {
    console.error('Error simulating scandal rescue purchase:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.rewardAd = async (req, res) => {
  try {
    const userId = req.user.id;
    let gameState = await UserGameState.findOne({ where: { user_id: userId } });
    const user = await User.findByPk(userId);

    if (!gameState || !user) {
      return res.status(404).json({ message: 'User or game state not found.' });
    }

    // Apply reward: +20 PC, -5 BE (example values)
    gameState.pc += 20;
    gameState.be = Math.max(0, gameState.be - 5);

    await gameState.save();

    // Obtener información completa del nivel actual (igual que en loadProgress)
    const gameLevel = await GameLevel.findOne({ where: { level_number: gameState.level } });
    const maxLevel = await GameLevel.max('level_number');
    
    let levelTitle = gameLevel ? gameLevel.title_es : 'Nivel Desconocido';
    let levelDescription = gameLevel ? gameLevel.description_es : '';
    
    if (gameLevel && user) {
      const userLanguage = user.selected_language || 'es';
      levelTitle = userLanguage === 'en' ? gameLevel.title_en : gameLevel.title_es;
      levelDescription = userLanguage === 'en' ? gameLevel.description_en : gameLevel.description_es;
    }

    res.status(200).json({
      message: 'Ad rewarded successfully.',
      updated_game_state: {
        ...gameState.toJSON(),
        levelInfo: gameLevel ? {
          ...gameLevel.toJSON(),
          title: levelTitle,
          description_visual: levelDescription,
        } : null,
        userInfo: user ? { 
          nickname: user.nickname, 
          avatar_url: user.avatar_url, 
          premium: user.premium, 
          tipo_invitado: user.tipo_invitado,
          selected_language: user.selected_language 
        } : null,
        maxLevel: maxLevel,
      },
    });
  } catch (error) {
    console.error('Error rewarding ad:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  const stripeWebhookSecret = process.env.NODE_ENV === 'production' 
    ? process.env.STRIPE_WEBHOOK_SECRET_LIVE 
    : process.env.STRIPE_WEBHOOK_SECRET_TEST;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, stripeWebhookSecret);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('Checkout session completed:', session.id);
      // Fulfill the purchase
      try {
        const userId = session.client_reference_id;
        const user = await User.findByPk(userId);
        if (user) {
          user.premium = true;
          await user.save();
          console.log(`User ${userId} premium status updated to true.`);
        } else {
          console.warn(`User with ID ${userId} not found for premium update.`);
        }
      } catch (error) {
        console.error('Error updating user premium status:', error);
      }
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.json({ received: true });
};


