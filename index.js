import fs from 'fs';
import path from 'path';
import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { connect } from 'mongoose';
import { fileURLToPath } from 'url';

// Access env variables
import 'dotenv/config'

import consoleStamp from 'console-stamp';

// setup timestamp logging
//@ts-ignore
consoleStamp(console, {
  format: ':date(yyyy/mm/dd HH:MM:ss.l).blue',
});

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const filePath = path.join(__dirname, 'error.log');

const stderrStream = fs.createWriteStream(filePath, { flags: 'a' });
process.stderr.write = stderrStream.write.bind(stderrStream);

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
client.guildSettings = new Map();

const functionFolders = fs.readdirSync('./src/functions');
for (const folder of functionFolders) {
  const functionFiles = fs
    .readdirSync(path.join('./src/functions', folder))
    .filter((file) => (file.endsWith('.js') || file.endsWith('.ts')));

  for (const file of functionFiles) {
    console.log(`Loading ${file}`)
    await import(
      'file://' + path.join(__dirname, 'src/functions', folder, file)
    ).then((module) => module.default(client));
  }
}

await client.handleEvents();
await client.handleCommands();

// setup verbosity?
if (process.env.VERBOSE === 'true') {
  client.on('debug', console.log).on('warn', console.log);
}

// Log in with token
client.login(process.env.DISCORD_TOKEN);

// Connect to database
const mongoConnection = process.env.MONGO_CONNECTION;
if (!mongoConnection) {
  throw new Error('MongoDB connection string is not defined.');
}
connect(mongoConnection).catch(console.error);

// check for mutes
client.handleMutes();

// https://www.youtube.com/watch?v=Ina9qiiujCQ
// https://github.com/LunarTaku/djs-warn-system
// https://github.com/ryzyx/discordjs-button-pagination/blob/interaction/index.js
// https://stackoverflow.com/questions/39785036/reliably-reconnect-to-mongodb
// https://medium.com/@accidental-feature/building-a-discord-bot-with-node-day-5-mongodb-d085caefe490
