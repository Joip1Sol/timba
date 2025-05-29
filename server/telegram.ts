import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Cargar variables de entorno
dotenv.config();

// Configurar el bot de Telegram
const bot = new Telegraf(process.env.BOT_TOKEN || '');

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI || '')
  .then(() => console.log('Conectado a MongoDB'))
  .catch((err) => console.error('Error conectando a MongoDB:', err));

// Comando /start
bot.command('start', (ctx) => {
  ctx.reply('¡Bienvenido a la Ruleta! Para comenzar a jugar, usa el botón del menú.');
});

// Comando para abrir la mini app
bot.command('play', (ctx) => {
  ctx.reply('Abre la Ruleta', {
    reply_markup: {
      inline_keyboard: [[
        {
          text: '🎰 Jugar Ruleta',
          web_app: { url: 'TU_URL_DE_LA_WEBAPP' } // Aquí deberás poner la URL de tu webapp
        }
      ]]
    }
  });
});

// Manejar errores
bot.catch((err: any) => {
  console.error('Error en el bot:', err);
});

// Iniciar el bot
bot.launch()
  .then(() => console.log('Bot iniciado'))
  .catch((err) => console.error('Error iniciando el bot:', err));

// Habilitar el cierre correcto
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM')); 