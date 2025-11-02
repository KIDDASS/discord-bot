// =======================
// Discord VC Live Bot API
// =======================
const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const cors = require('cors');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers
  ]
});

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for your Vercel frontend
app.use(cors({
  origin: "https://discord-vc-live.vercel.app", // replace with your site URL
  optionsSuccessStatus: 200
}));

// Data structure to track VC users
// { guildId: { userId: { name, avatar, joinedAt, totalTime } } }
const vcUsers = {};

// Track voice state updates
client.on('voiceStateUpdate', (oldState, newState) => {
  const guildId = newState.guild.id;
  if (!vcUsers[guildId]) vcUsers[guildId] = {};

  // User joined VC
  if (!oldState.channelId && newState.channelId) {
    if (!vcUsers[guildId][newState.id]) {
      vcUsers[guildId][newState.id] = {
        name: newState.member.user.username,
        avatar: newState.member.user.displayAvatarURL({ dynamic: true }),
        joinedAt: Date.now(),
        totalTime: 0
      };
    } else {
      vcUsers[guildId][newState.id].joinedAt = Date.now();
    }
  }

  // User left VC
  if (oldState.channelId && !newState.channelId) {
    const user = vcUsers[guildId][newState.id];
    if (user) {
      user.totalTime += Date.now() - user.joinedAt;
      delete vcUsers[guildId][newState.id];
    }
  }
});

// API endpoint
app.get('/api/voice', (req, res) => {
  const response = {};
  for (const guildId in vcUsers) {
    response[guildId] = Object.values(vcUsers[guildId]).map(u => ({
      name: u.name,
      avatar: u.avatar,
      joinedAt: u.joinedAt,
      totalTime: u.totalTime
    }));
  }
  res.json(response);
});

// Start Express server
app.listen(PORT, () => {
  console.log(`🌐 API running on port ${PORT}`);
});

// Login Discord bot
client.login('MTQzNDQ4Nzk2ODM1NzE1NDg2Nw.G3O6cP.RZkJWMt8LFaNBHL_J2WMxymAXDJuX2Y9KrFEno');

