const { App } = require("@slack/bolt");

const app = new App({
  token: process.env.xoxb-9315800654469-9313812699283-GzKm3WKKoRuxFCn89IpN7ofp,
  appToken: process.env.xapp-1-A0997PUGRBM-9319492280484-ab0c5d36f03af821e7ecf84c9098707c189f4e62f2c8d8b57a723f715853b4d9,
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
