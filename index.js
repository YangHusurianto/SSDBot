const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { connect } = require('mongoose');

// setup timestamp logging
require('console-stamp')(console, {
  format: ':date(yyyy/mm/dd HH:MM:ss.l)',
});

const stderrLogFile = path.join(__dirname, 'error.log');
const stderrStream = fs.createWriteStream(stderrLogFile, { flags: 'a' });

process.stderr.write = stderrStream.write.bind(stderrStream);

// Access env variables
require('dotenv').config();

// Create client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
  ],
});

// register slash commands
client.commands = new Collection();
client.commandArray = [];
client.guildCommandArray = [];
client.commandFilePaths = new Map();

const functionFolders = fs.readdirSync('./src/functions');
for (const folder of functionFolders) {
  const functionPath = path.join('./src/functions', folder);
  const functionFiles = fs
    .readdirSync(functionPath)
    .filter((file) => file.endsWith('.js'));

  for (const file of functionFiles) {
    const filePath = path.join(__dirname, functionPath);
    require(path.join(filePath, file))(client);
  }
}

client.handleEvents();
client.handleCommands();

// Log in with token
client.login(process.env.DISCORD_TOKEN);

// Connect to database
connect(process.env.MONGO_CONNECTION).catch(console.error);
// https://www.youtube.com/watch?v=Ina9qiiujCQ
// https://github.com/LunarTaku/djs-warn-system
// https://github.com/ryzyx/discordjs-button-pagination/blob/interaction/index.js
// https://stackoverflow.com/questions/39785036/reliably-reconnect-to-mongodb
