const { sequelize } = require('../config/db');
const GameConfig = require('../models/GameConfig');

const gameConfigData = [
  {
    config_key: 'NUM_CORRUPTION_TYPES',
    config_value: '10',
    description: 'Número de tipos de corrupción para la ruleta.',
  },
  {
    config_key: 'NUM_CORRUPTION_CARDS',
    config_value: '5',
    description: 'Número de sub-opciones (cartas) por tipo de corrupción.',
  },
  {
    config_key: 'MAX_RECORDING_SECONDS',
    config_value: '30',
    description: 'Tiempo máximo de grabación de voz en segundos.',
  },
  {
    config_key: 'MAX_PLAN_WORDS',
    config_value: '300',
    description: 'Número máximo de palabras para el plan del jugador.',
  },
  
  {
    config_key: 'PRECIO_RESCATE_ESCANDALO',
    config_value: '1',
    description: 'Precio del rescate por BE >= 80.',
  },
  
  {
    config_key: 'UMBRAL_ESCANDALO_MINIMO',
    config_value: '80',
    description: 'Valor BE a partir del cual se muestra opción de rescate.',
  },
  {
    config_key: 'UMBRAL_GAMEOVER',
    config_value: '90',
    description: 'Valor BE a partir del cual se activa el Game Over.',
  },
  {
    config_key: 'VALOR_BE_REINICIO_PAGO',
    config_value: '40',
    description: 'Valor fijo de BE al reiniciar tras degradación.',
  },
  {
    config_key: 'REINICIAR_RECURSOS_CON_CAIDA',
    config_value: 'true',
    description: 'Si se reinician PC/INF al bajar de nivel tras escándalo.',
  },
  
  {
    config_key: 'GAME_MODE',
    config_value: 'produccion',
    description: 'Modo de ejecución del juego (desarrollo o produccion).',
  },
  {
    config_key: 'TERMS_AND_CONDITIONS_TEXT',
    config_value: `
      <h2>Términos y Condiciones de Uso de Corruptopolis IA</h2>
      <p>Bienvenido a Corruptopolis IA. Al acceder y utilizar este juego, usted acepta los siguientes términos y condiciones:</p>
      <h3>1. Naturaleza del Juego</h3>
      <p>Corruptopolis IA es un juego de simulación interactivo diseñado con fines de entretenimiento y educativos. <strong>No representa la realidad política ni social.</strong> Cualquier similitud con personas, eventos o situaciones reales es pura coincidencia.</p>
      <h3>2. Interacciones con Modelos de Lenguaje (LLMs)</h3>
      <p>Este juego utiliza Modelos de Lenguaje Grandes (LLMs) para generar contenido dinámico, como planes, evaluaciones y titulares de escándalos. Es importante entender que:</p>
      <ul>
        <li>Las respuestas de los LLMs son generadas por inteligencia artificial y pueden no ser siempre precisas, coherentes o apropiadas.</li>
        <li>El juego no tiene control directo sobre el contenido exacto generado por los LLMs en tiempo real.</li>
        <li>El contenido generado por los LLMs es parte de la experiencia de juego y no debe interpretarse como asesoramiento, opinión o hecho.</li>
      </ul>
      <h3>3. Privacidad y Datos Personales</h3>
      <p>Nos tomamos su privacidad muy en serio:</p>
      <ul>
        <li><strong>No recopilamos ni almacenamos datos personales sensibles.</strong></li>
        <li>Su información de registro (nickname, email) se utiliza únicamente para la gestión de su cuenta dentro del juego.</li>
        <li>Las interacciones dentro del juego (sus planes, las evaluaciones del LLM) se almacenan para el progreso del juego y el historial, pero no se asocian directamente con su identidad personal fuera del juego.</li>
        <li>No compartimos sus datos con terceros.</li>
      </ul>
      <h3>4. Contenido Generado por el Usuario</h3>
      <p>Usted es el único responsable del contenido que introduce en el juego (por ejemplo, sus "planes"). Asegúrese de que su contenido sea apropiado y no viole ninguna ley o derecho de terceros.</p>
      <h3>5. Limitación de Responsabilidad</h3>
      <p>Los desarrolladores de Corruptopolis IA no se hacen responsables de:</p>
      <ul>
        <li>Cualquier daño o perjuicio derivado del uso o la imposibilidad de usar el juego.</li>
        <li>El contenido generado por los LLMs o por otros usuarios.</li>
        <li>Interrupciones del servicio o errores técnicos.</li>
      </ul>
      <h3>6. Modificaciones de los Términos</h3>
      <p>Nos reservamos el derecho de modificar estos términos en cualquier momento. Se le notificará sobre cualquier cambio significativo.</p>
      <p>Al hacer clic en "Aceptar", usted confirma que ha leído, entendido y aceptado estos Términos y Condiciones.</p>
    `,
    description: 'Texto completo de los Términos y Condiciones de Uso.',
  },
  {
    config_key: 'DISCLAIMER_TEXT',
    config_value: `
      <h2>Descargo de Responsabilidad de Corruptopolis IA</h2>
      <p><strong>Corruptopolis IA es un producto de ficción.</strong> Todos los personajes, organizaciones y eventos representados en este juego son ficticios y cualquier parecido con entidades reales, vivas o muertas, es puramente coincidental.</p>
      <p>El propósito de este juego es el entretenimiento y la exploración de conceptos de manera lúdica. <strong>No debe tomarse como una representación precisa de la política, la economía o cualquier otro aspecto de la vida real.</strong>
      <p>Las interacciones con los Modelos de Lenguaje Grandes (LLMs) son experimentales y su contenido es generado algorítmicamente. <strong>Los mensajes, consejos o "planes" generados por la IA no tienen control humano directo y no deben ser considerados como recomendaciones o verdades.</strong></p>
      <p>El juego no promueve ni aprueba ninguna actividad ilegal, inmoral o poco ética. Se alienta a los jugadores a mantener una perspectiva crítica y a recordar que esto es solo un juego.</p>
      <p><strong>Su privacidad es importante:</strong> No se guardan ni se comparten datos personales sensibles. El contenido que usted introduce en el juego es responsabilidad suya.</p>
    `,
    description: 'Texto del descargo de responsabilidad del juego.',
  },
  // NUEVAS CONFIGURACIONES DE PUBLICIDAD
  {
    config_key: 'AD_PROVIDER',
    config_value: 'none',
    description: 'Proveedor de publicidad activo: none, adsense, applovin, unity, ironsource',
  },
  {
    config_key: 'AD_PROVIDER_CONFIG',
    config_value: JSON.stringify({
      adsense: {
        client_id: 'ca-pub-4527234404026244',
        rewarded_unit_id: 'ca-pub-4527234404026244/YOUR_REWARDED_AD_UNIT_ID',
        interstitial_unit_id: 'ca-pub-4527234404026244/YOUR_INTERSTITIAL_AD_UNIT_ID'
      },
      applovin: {
        sdk_key: 'YOUR_APPLOVIN_SDK_KEY',
        app_id: 'YOUR_APPLOVIN_APP_ID',
        rewarded_unit_id: 'YOUR_REWARDED_UNIT_ID',
        interstitial_unit_id: 'YOUR_INTERSTITIAL_UNIT_ID'
      },
      unity: {
        game_id: 'YOUR_UNITY_GAME_ID',
        rewarded_placement_id: 'rewardedVideo',
        interstitial_placement_id: 'video'
      },
      ironsource: {
        app_key: 'YOUR_IRONSOURCE_APP_KEY',
        rewarded_instance_id: 'DefaultRewardedVideo',
        interstitial_instance_id: 'DefaultInterstitial'
      }
    }),
    description: 'Configuración JSON para cada proveedor de publicidad',
  },
  {
    config_key: 'AD_TEST_MODE',
    config_value: 'true',
    description: 'Activar modo de prueba para anuncios (true/false)',
  },
  {
    config_key: 'AD_REWARDS_ENABLED',
    config_value: 'true',
    description: 'Habilitar anuncios recompensados (true/false)',
  },
  {
    config_key: 'AD_INTERSTITIAL_ENABLED',
    config_value: 'true',
    description: 'Habilitar anuncios intersticiales (true/false)',
  },
];

const seedGameConfig = async () => {
  try {
    await sequelize.sync({ alter: true }); // Sincroniza los modelos, alterando la tabla si es necesario

    for (const configItem of gameConfigData) {
      const [config, created] = await GameConfig.findOrCreate({
        where: { config_key: configItem.config_key },
        defaults: configItem
      });

      if (created) {
        console.log(`Configuración '${config.config_key}' creada.`);
      } else {
        // Update only if the value has changed
        if (config.config_value !== configItem.config_value) {
          await GameConfig.update(configItem, { where: { config_key: configItem.config_key } });
          console.log(`Configuración '${config.config_key}' actualizada.`);
        } else {
          console.log(`Configuración '${config.config_key}' ya está actualizada.`);
        }
      }
    }

    console.log('Seeding de configuración de juego completado.');
  } catch (error) {
    console.error('Error durante el seeding de configuración de juego:', error);
  } finally {
    await sequelize.close();
  }
};

seedGameConfig();
