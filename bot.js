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
  origin: "https://discord-vc-live.vercel.app", // replace with your frontend URL
  optionsSuccessStatus: 200
}));

// Data structure to track VC users
// { guildId: { userId: { name, avatar, joinedAt, totalTime } } }
const vcUsers = {};

// Populate existing VC users when bot is ready
client.on('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  client.guilds.cache.forEach(guild => {
    if (!vcUsers[guild.id]) vcUsers[guild.id] = {};

    guild.channels.cache
      .filter(c => c.type === 2) // 2 = VoiceChannel
      .forEach(vc => {
        vc.members.forEach(member => {
          if (!member.user.bot) {
            vcUsers[guild.id][member.id] = {
              name: member.user.username,
              avatar: member.user.displayAvatarURL({ dynamic: true }),
              joinedAt: Date.now(),
              totalTime: 0
            };
          }
        });
      });
  });
});

// Track voice state updates
client.on('voiceStateUpdate', (oldState, newState) => {
  const guildId = newState.guild.id;
  if (!vcUsers[guildId]) vcUsers[guildId] = {};

  // User joined VC
  if (!oldState.channelId && newState.channelId) {
    vcUsers[guildId][newState.id] = {
      name: newState.member.user.username,
      avatar: newState.member.user.displayAvatarURL({ dynamic: true }),
      joinedAt: Date.now(),
      totalTime: vcUsers[guildId][newState.id]?.totalTime || 0
    };
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
client.login(process.env.DISCORD_TOKEN); // or hardcode your token here
