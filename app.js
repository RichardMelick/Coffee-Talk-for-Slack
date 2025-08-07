const { App } = require("@slack/bolt");

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true
});

app.command("/coffeetalk-help", async ({ ack, say }) => {
  await ack();
  await say("☕ Welcome to Coffee Talk! Use `/setup-coffeetalk` to start.");
});

(async () => {
  await app.start();
  console.log("⚡ Coffee Talk Bot is running on Socket Mode");
})();
