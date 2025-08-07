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

Happy thinking ☕`);
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
      text: `👋 Welcome to the team, <@${user.id}>!\n\nWould you like your own *Coffee Talk* channel? It’s a public space for your thoughts, ideas, and shower epiphanies. Other members can read and respond, but they are not allowed to create top-level posts.\n\nType \`/coffeetalk-help\` to learn more or create your *#coffeetalk_${user.name.toLowerCase().replace(/[^a-z0-9_-]/g, '')}*. Dont forget to invite Coffee Bot to the channel too.`
    });

    logger.info(`Sent welcome message to ${user.name}`);
  } catch (error) {
    logger.error(`team_join error: ${error.message}`);
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
