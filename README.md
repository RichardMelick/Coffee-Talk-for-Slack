# ☕ Coffee Talk

**Coffee Talk** is a friendly Slack bot that helps teams share thoughts, half-baked ideas, and rubber duck debugging in personal, thread-only channels. It creates a cozy, async space for thinking out loud—without adding noise to public conversations.

---

## What It Does

- Creates personal, public channels like `#coffeetalk_jane`
- Enforces posting rules:
  - Only the channel owner can post top-level messages
  - Everyone else replies in threads
- Welcomes new users and offers them a chance to create their own Coffee Talk channel
- Offers helpful slash commands:
  - `/coffeetalk-help` – Show an explainer
  - `/coffeetalk-create` – Create your own channel
  - `/ping-coffeetalk` – Check if the bot is running

---

## Tech Stack

- Node.js + [@slack/bolt](https://slack.dev/bolt-js)
- Socket Mode for real-time interactivity
- Express (for health checks)
- Hosted on [Render](https://render.com/) or any Node-compatible environment
