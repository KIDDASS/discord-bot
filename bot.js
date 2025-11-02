const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');

const app = express();
const PORT = 3000; // your API port (you can change this)

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

let activeVCUsers = new Map(); // guildId -> [usernames]

// Log in
client.once('clientReady', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// Track joins/leaves
client.on('voiceStateUpdate', (oldState, newState) => {
  const guildId = newState.guild.id;
  const member = newState.member;
  if (!member) return;

  let users = activeVCUsers.get(guildId) || [];

  // Join
  if (!oldState.channelId && newState.channelId) {
    users.push(member.user.username);
    activeVCUsers.set(guildId, [...new Set(users)]);
    console.log(`${member.user.username} joined VC`);
  }

  // Leave
  else if (oldState.channelId && !newState.channelId) {
    users = users.filter(u => u !== member.user.username);
    activeVCUsers.set(guildId, users);
    console.log(`${member.user.username} left VC`);
  }
});

// --- Simple API endpoint ---
app.get('/api/voice', (req, res) => {
  const data = Object.fromEntries(activeVCUsers);
  res.json(data);
});

app.listen(PORT, () => console.log(`🌐 API running on http://localhost:${PORT}`));

// --- Start the bot ---
client.login(process.env.DISCORD_TOKEN);

