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
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// { guildId: { userId: { name, avatar, joinedAt, totalTime } } }
const vcUsers = {};

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
      // Rejoined VC, just update joinedAt
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

// API returns VC users + cumulative leaderboard
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

app.listen(PORT, () => console.log(`🌐 API running on port ${PORT}`));
client.login(process.env.DISCORD_TOKEN);
