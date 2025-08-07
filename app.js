require('dotenv').config(); // Load environment variables

const { App } = require('@slack/bolt');
const express = require('express');

// Initialize your Slack Socket Mode app
const slackApp = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
  logger: {
    debug: (...args) => console.debug(`[${new Date().toISOString()}] [DEBUG]`, ...args),
    info: (...args) => console.info(`[${new Date().toISOString()}] [INFO]`, ...args),
    warn: (...args) => console.warn(`[${new Date().toISOString()}] [WARN]`, ...args),
    error: (...args) => console.error(`[${new Date().toISOString()}] [ERROR]`, ...args)
  }
});

// Slash command: /setup-coffeetalk
slackApp.command('/setup-coffeetalk', async ({ command, ack, say, logger }) => {
  try {
    await ack();
    await say(`☕ Setting up Coffee Talk channels...`);
  } catch (error) {
    logger.error(`Error handling /setup-coffeetalk: ${error.message}`);
  }
});

slackApp.command('/coffeetalk-help', async ({ ack, say, logger }) => {
  try {
    await ack();
    await say(
      `☕ *Coffee Talk Help*\n\nUse the following commands:\n• \`/setup-coffeetalk\` — Create personal channels for all teammates\n• \`/add-coffeetalk @user\` — Add a new member's channel\n• \`/coffeetalk-help\` — Show this message`
    );
  } catch (error) {
    logger.error(`Error handling /coffeetalk-help: ${error.message}`);
  }
});

// Start both the Slack bot and a dummy HTTP server for Render
(async () => {
  await slackApp.start();
  console.log(`[${new Date().toISOString()}] ⚡ Coffee Talk Bot is running on Socket Mode`);

  // Dummy Express server to keep Render Web Service happy
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Health check endpoint
  app.get('/healthz', (req, res) => {
    res.status(200).send('ok');
  });

  // Welcome/root page
  app.get('/', (req, res) => {
    res.send('☕ Coffee Talk is brewed hot and ready to go.');
  });

  app.listen(PORT, () => {
    console.log(`[${new Date().toISOString()}] 🌐 Dummy web server listening on port ${PORT}`);
  });
})();
