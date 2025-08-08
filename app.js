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
  await say(`☕ *Welcome to Coffee Talk!*\n
*Coffee Talk* creates cozy, personal public channels for thinking out loud, journaling, or rubber duck debugging. Each \`#coffeetalk_*\` channel is owned by one person—only they can start new conversations. Everyone else is encouraged to reply in threads.

These channels are perfect for:
• Brain dumps, personal notes, or daily reflections  
• Sharing “working out loud” updates  
• Logging ideas, wins, frustrations, and questions  
• Letting teammates peek into your thought process (and maybe offer help)

📌 *Rules for Coffee Talk channels:*
• Only the owner can post *top-level* messages (new conversations).  
• Everyone else should *reply in threads*—just like tapping someone on the shoulder to talk about their sticky note.  
• Channels must be named like \`#coffeetalk_yourname\`.

✅ *You don’t need an admin to set it up!*  
Feel free to create your own \`#coffeetalk_*\` channel—Coffee Talk will enforce the rules automatically once the bot is added.

📋 *Available Commands:*
• \`/coffeetalk-help\` – Show this message  
• \`/ping-coffeetalk\` – Check if the bot is running
• \`/coffeetalk-start\` – Invite Coffee Talk to your channel to get the conversations brewing.

Enjoy the brew.`);
});

// Slash: /ping-coffeetalk
slackApp.command('/ping-coffeetalk', async ({ ack, say }) => {
  await ack();
  await say("☕️ Coffee Talk is brewing and responsive.");
});

// Enforce: Only allow the channel creator to post top-level messages in #coffeetalk_*
slackApp.event('message', async ({ event, client, logger }) => {
  try {
    if (event.channel_type !== 'channel' || event.subtype || event.thread_ts) return;

    const channelInfo = await client.conversations.info({ channel: event.channel });
    const channelName = channelInfo.channel.name;

    // Only apply rules to channels that start with coffeetalk_
    if (!channelName.startsWith('coffeetalk_')) return;

    const creatorId = channelInfo.channel.creator;
    const userId = event.user;

    // If the user is not the channel creator, send them a warning (but don't delete)
    if (userId !== creatorId) {
      await client.chat.postMessage({
        channel: userId,
        text: `👋 Hi there. A little reminder that Coffee Talk channels are for you to *reply* in—not start new conversations. Please use *thread replies* instead.`
      });
      
      logger.info(`Warned user ${userId} for posting in #${channelName}`);
    }

  } catch (error) {
    logger.error(`Message moderation error: ${error.message}`);
  }
});


// Event: Welcome new users (via team_join)
slackApp.event('team_join', async ({ event, client, logger }) => {
  try {
    const user = event.user;

    // Skip bots or external accounts
    if (user.is_bot || user.is_restricted || user.is_ultra_restricted) return;

    // Open a DM
    const dm = await client.conversations.open({ users: user.id });
await client.chat.postMessage({
  channel: dm.channel.id,
  text: `👋 Welcome to the team, <@${user.id}>!

Would you like your own *Coffee Talk* channel? It’s a public space for your thoughts, ideas, and shower epiphanies. Other members can read and reply—but only you can start top-level posts.

To get started:
1. Create a public channel named \`#coffeetalk_${user.name.toLowerCase().replace(/[^a-z0-9_-]/g, '')}\`
2. Run \`/coffeetalk-start\` in that channel to invite Coffee Talk Bot

Type \`/coffeetalk-help\` at any time to learn more. ☕`
});


    logger.info(`Sent welcome message to ${user.name}`);
  } catch (error) {
    logger.error(`team_join error: ${error.message}`);
  }
});
// Slash: /coffeetalk-start
slackApp.command('/coffeetalk-start', async ({ ack, body, client, respond, logger }) => {
  await ack();

  try {
    const userInfo = await client.users.info({ user: body.user_id });
    const displayName = userInfo.user.profile.display_name || userInfo.user.name;
    const cleanName = displayName.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const expectedChannelName = `coffeetalk_${cleanName}`;

    const result = await client.conversations.list({ types: 'public_channel' });
    const channel = result.channels.find(c => c.name === expectedChannelName);

    if (!channel || channel.id !== body.channel_id) {
      await respond({
        response_type: 'ephemeral',
        text: `⚠️ Please run \`/coffeetalk-start\` inside your own \`#${expectedChannelName}\` channel.`
      });
      return;
    }

    await client.conversations.join({ channel: channel.id });

    await client.chat.postMessage({
      channel: channel.id,
      text: `👋 Welcome to your very own *Coffee Talk*, <@${body.user_id}>!

This is your space to share ideas, learnings, and even photos from your latest adventure. You’re the only one who can start top-level posts—everyone else will reply in threads.

Have any other questions? Type \`/coffeetalk-help\` anytime for guidance.

☕ Happy sharing!`
    });

    await respond({
      response_type: 'ephemeral',
      text: `✅ Coffee Talk Bot has joined <#${channel.id}> and is ready!`
    });

    logger.info(`Bot joined and welcomed channel: #${expectedChannelName}`);
  } catch (error) {
    logger.error(`Error with /coffeetalk-start: ${error.message}`);
    await respond({
      response_type: 'ephemeral',
      text: `❌ Something went wrong trying to start Coffee Talk in your channel.`
    });
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
