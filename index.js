const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const { connect } = require('mongoose');

// Access env variables
require("dotenv").config();

// Create client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });


// register slash commands
client.commands = new Collection();
client.commandArray = [];
client.guildCommandArray = [];
client.commandFilePaths = new Map();

const functionFolders = fs.readdirSync('./src/functions');
for (const folder of functionFolders) {
  const functionPath = path.join('./src/functions', folder);
  const functionFiles = fs.readdirSync(functionPath).filter(file => file.endsWith('.js'));

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