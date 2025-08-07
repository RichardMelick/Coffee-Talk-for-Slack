require('dotenv').config();

const { App } = require('@slack/bolt');
const express = require('express');

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

// Helper: Check if user is admin
async function isAdmin(userId, client) {
  try {
    const result = await client.users.info({ user: userId });
    return result.user.is_admin || result.user.is_owner;
  } catch (e) {
    return false;
  }
}

// Slash: /setup-coffeetalk
slackApp.command('/setup-coffeetalk', async ({ command, ack, say, client, logger }) => {
  await ack();

  const isUserAdmin = await isAdmin(command.user_id, client);
  if (!isUserAdmin) {
    return say("🚫 You don’t have permission to run this command.");
  }

  await say(`☕ Setting up Coffee Talk channels...`);

  const result = await client.users.list();
  const members = result.members.filter(u => !u.is_bot && !u.deleted && u.id !== 'USLACKBOT');

  for (const user of members) {
    const username = user.name.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const channelName = `coffeetalk_${username}`;

    try {
      const channel = await client.conversations.create({
        name: channelName,
        is_private: true
      });

      await client.conversations.invite({
        channel: channel.channel.id,
        users: user.id
      });

      logger.info(`✅ Created and invited ${username} to #${channelName}`);
    } catch (err) {
      if (err.data?.error === 'name_taken') {
        logger.warn(`⚠️ Channel #${channelName} already exists. Skipping.`);
      } else {
        logger.error(`❌ Failed for ${username}: ${err.message}`);
      }
    }
  }

  await say("✅ Setup complete.");
});

// Slash: /add-coffeetalk
slackApp.command('/add-coffeetalk', async ({ command, ack, say, client, logger }) => {
  await ack();

  const isUserAdmin = await isAdmin(command.user_id, client);
  if (!isUserAdmin) {
    return say("🚫 You don’t have permission to run this command.");
  }

  const match = command.text.match(/<@(\w+)>/);
  if (!match) return say("❗ Please mention a user: `/add-coffeetalk @username`");

  const userId = match[1];
  const userInfo = await client.users.info({ user: userId });
  const username = userInfo.user.name.toLowerCase().replace(/[^a-z0-9_-]/g, '');
  const channelName = `coffeetalk_${username}`;

  try {
    const channel = await client.conversations.create({
      name: channelName,
      is_private: true
    });

    await client.conversations.invite({
      channel: channel.channel.id,
      users: userId
    });

    await say(`✅ Created #${channelName} for <@${userId}>`);
  } catch (err) {
    if (err.data?.error === 'name_taken') {
      await say(`⚠️ Channel for <@${userId}> already exists.`);
    } else {
      logger.error(`Error in /add-coffeetalk: ${err.message}`);
      await say("❌ Something went wrong.");
    }
  }
});

// Slash: /create-coffeetalk
slackApp.command('/create-coffeetalk', async ({ command, ack, say, client, logger }) => {
  await ack();

  const userId = command.user_id;
  const userInfo = await client.users.info({ user: userId });
  const username = userInfo.user.name.toLowerCase().replace(/[^a-z0-9_-]/g, '');
  const channelName = `coffeetalk_${username}`;

  try {
    const result = await client.conversations.create({
      name: channelName,
      is_private: true
    });

    await client.conversations.invite({
      channel: result.channel.id,
      users: userId
    });

    await say(`✅ Your personal Coffee Talk channel #${channelName} has been created.`);
  } catch (error) {
    if (error.data?.error === 'name_taken') {
      await say(`⚠️ Your channel #${channelName} already exists.`);
    } else {
      logger.error(`Error in /create-coffeetalk: ${error.message}`);
      await say("❌ Something went wrong.");
    }
  }
});

// Slash: /coffeetalk-help
slackApp.command('/coffeetalk-help', async ({ ack, say }) => {
  await ack();
  await say(`☕ *Coffee Talk Help*\n
• \`/setup-coffeetalk\` – Admin only: Set up channels for all team members\n
• \`/add-coffeetalk @user\` – Admin only: Create a channel for someone\n
• \`/create-coffeetalk\` – Create your own channel\n
• \`/coffeetalk-help\` – Show this help message`);
});

// Slash: /ping-coffeetalk
slackApp.command('/ping-coffeetalk', async ({ ack, say }) => {
  await ack();
  await say("🏓 Coffee Talk is brewing and responsive.");
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
