require('dotenv').config();

const { App } = require('@slack/bolt');
const express = require('express');

const slackApp = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});

// Slash: /coffeetalk-help
slackApp.command('/coffeetalk-help', async ({ ack, say }) => {
  await ack();
  await say(`☕ *Coffee Talk Help*\n
• \`/coffeetalk-help\` – Show this help message\n
• \`/ping-coffeetalk\` – Check if Coffee Talk is alive\n
\nℹ️ Admins must manually create and manage \`coffeetalk_*\` channels.`);
});

// Slash: /ping-coffeetalk
slackApp.command('/ping-coffeetalk', async ({ ack, say }) => {
  await ack();
  await say("☕️ Coffee Talk is brewing and responsive.");
});

// Enforce: Only allow owner to post top-level messages
slackApp.event('message', async ({ event, client, logger }) => {
  try {
    if (event.channel_type !== 'channel' || event.subtype || event.thread_ts) return;

    const channelInfo = await client.conversations.info({ channel: event.channel });
    const channelName = channelInfo.channel.name;

    if (!channelName.startsWith('coffeetalk_')) return;

    const allowedUsername = channelName.replace('coffeetalk_', '');
    const userInfo = await client.users.info({ user: event.user });
    const actualUsername = userInfo.user.name.toLowerCase().replace(/[^a-z0-9_-]/g, '');

    if (actualUsername !== allowedUsername) {
      await client.chat.delete({ channel: event.channel, ts: event.ts });

      await client.chat.postMessage({
        channel: event.user,
        text: `⚠️ Only @${allowedUsername} can post new messages in #${channelName}. Please reply in threads.`
      });

      logger.info(`Deleted unauthorized post from ${actualUsername} in #${channelName}`);
    }
  } catch (error) {
    logger.error(`Message moderation error: ${error.message}`);
  }
});

// Dummy Express server for Render Web Service
(async () => {
  await slackApp.start();
  console.log(`[${new Date().toISOString()}] ⚡ Coffee Talk Bot is running on Socket Mode`);

  const app = express();
  const PORT = process.env.PORT || 3000;

  app.get('/healthz', (req, res) => res.status(200).send('ok'));
  app.get('/', (req, res) => res.send('☕ Coffee Talk is brewed and ready.'));

  app.listen(PORT, () => {
    console.log(`[${new Date().toISOString()}] 🌐 Dummy web server on port ${PORT}`);
  });
})();
