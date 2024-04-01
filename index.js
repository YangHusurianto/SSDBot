import fs from 'fs';
import path from 'path';
import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { connect } from 'mongoose';
import { fileURLToPath } from 'url';

import consoleStamp from 'console-stamp';

// setup timestamp logging
consoleStamp(console, {
  format: ':date(yyyy/mm/dd HH:MM:ss.l).blue',
});

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const filePath = path.join(__dirname, 'error.log');

const stderrStream = fs.createWriteStream(filePath, { flags: 'a' });
process.stderr.write = stderrStream.write.bind(stderrStream);

// Access env variables
import dotenv from 'dotenv';
dotenv.config();

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
  const functionFiles = fs
    .readdirSync(path.join('./src/functions', folder))
    .filter((file) => file.endsWith('.js'));

  for (const file of functionFiles) {
    await import(
      'file://' + path.join(__dirname, 'src/functions', folder, file)
    ).then((module) => module.default(client));
  }
}

client.handleEvents();
client.handleCommands();

// setup verbosity?
if (process.env.VERBOSE === 'true') {
  client.on('debug', console.log).on('warn', console.log);
}

// Log in with token
client.login(process.env.DISCORD_TOKEN);

// Connect to database
connect(process.env.MONGO_CONNECTION).catch(console.error);
// https://www.youtube.com/watch?v=Ina9qiiujCQ
// https://github.com/LunarTaku/djs-warn-system
// https://github.com/ryzyx/discordjs-button-pagination/blob/interaction/index.js
// https://stackoverflow.com/questions/39785036/reliably-reconnect-to-mongodb
