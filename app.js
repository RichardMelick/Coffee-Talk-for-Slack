const { App } = require('@slack/bolt');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true
});

// Slash command handler
app.command('/setup-coffeetalk', async ({ command, ack, say }) => {
  await ack();
  await say(`☕ Setting up Coffee Talk channels for your team...`);
});

app.command('/ping-coffeetalk', async ({ ack, say }) => {
  await ack();
  await say("🏓 Coffee Talk Bot is alive!");
});

(async () => {
  await app.start();
  console.log('⚡ Coffee Talk Bot is running on Socket Mode');
})();
