const { App } = require('@slack/bolt');
const express = require('express');

// Your Slack bot setup
const slackApp = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true
});

// Slash command
slackApp.command('/setup-coffeetalk', async ({ command, ack, say }) => {
  await ack();
  await say(`☕ Setting up Coffee Talk channels...`);
});

// Start both the Slack bot and a fake web server
(async () => {
  await slackApp.start();
  console.log('⚡ Coffee Talk Bot is running on Socket Mode');

  // Start a dummy Express server to keep Render happy
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.get('/', (req, res) => {
    res.send('Coffee Talk is brewed hot and ready to go.');
  });

  app.listen(PORT, () => {
    console.log(`🌐 Dummy web server listening on port ${PORT}`);
  });
})();
