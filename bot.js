// =======================
// Discord VC Live Bot API (MongoDB Version)
// =======================
const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers
  ]
});

const app = express();
const PORT = process.env.PORT || 3000;

// =======================
// MongoDB Connection
// =======================
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

const userSchema = new mongoose.Schema({
  guildId: String,
  userId: String,
  name: String,
  avatar: String,
  totalTime: Number,
  joinedAt: Number
});

const VCUser = mongoose.model("VCUser", userSchema);

// =======================
// Express + CORS
// =======================
app.use(cors({
  origin: "https://discord-vc-live.vercel.app", // your frontend URL
  optionsSuccessStatus: 200
}));

// =======================
// Discord Bot Events
// =======================
client.on("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on("voiceStateUpdate", async (oldState, newState) => {
  const guildId = newState.guild.id;
  const userId = newState.id;

  // User joins VC
  if (!oldState.channelId && newState.channelId) {
    const existing = await VCUser.findOne({ guildId, userId });
    if (existing) {
      existing.joinedAt = Date.now();
      await existing.save();
    } else {
      await VCUser.create({
        guildId,
        userId,
        name: newState.member.user.username,
        avatar: newState.member.user.displayAvatarURL({ dynamic: true }),
        totalTime: 0,
        joinedAt: Date.now()
      });
    }
  }

  // User leaves VC
  if (oldState.channelId && !newState.channelId) {
    const user = await VCUser.findOne({ guildId, userId });
    if (user && user.joinedAt) {
      user.totalTime += Date.now() - user.joinedAt;
      user.joinedAt = null;
      await user.save();
    }
  }
});

// =======================
// API Endpoint
// =======================
app.get("/api/voice", async (req, res) => {
  const users = await VCUser.find();
  const response = {};

  for (const user of users) {
    if (!response[user.guildId]) response[user.guildId] = [];
    response[user.guildId].push({
      name: user.name,
      avatar: user.avatar,
      totalTime: user.totalTime,
      joinedAt: user.joinedAt
    });
  }

  res.json(response);
});

// =======================
// Start API + Login Bot
// =======================
app.listen(PORT, () => console.log(`🌐 API running on port ${PORT}`));

client.login(process.env.DISCORD_TOKEN);
