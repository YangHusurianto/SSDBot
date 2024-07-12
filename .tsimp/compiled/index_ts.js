import fs from 'fs';
import path from 'path';
import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { connect } from 'mongoose';
import { fileURLToPath } from 'url';
// Access env variables
import 'dotenv/config';
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
        console.log(`Loading ${file}`);
        await import('file://' + path.join(__dirname, 'src/functions', folder, file)).then((module) => module.default(client));
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
// load guild settings
client.handleCache();
// check for mutes
client.handleMutes();
// https://www.youtube.com/watch?v=Ina9qiiujCQ
// https://github.com/LunarTaku/djs-warn-system
// https://github.com/ryzyx/discordjs-button-pagination/blob/interaction/index.js
// https://stackoverflow.com/questions/39785036/reliably-reconnect-to-mongodb
// https://medium.com/@accidental-feature/building-a-discord-bot-with-node-day-5-mongodb-d085caefe490
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiQzovVXNlcnMveWFuZ2gvRG9jdW1lbnRzL0Rpc2NvcmQgQm90L1NTREJvdC9zcmMvIiwic291cmNlcyI6WyIuLi9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsTUFBTSxJQUFJLENBQUM7QUFDcEIsT0FBTyxJQUFJLE1BQU0sTUFBTSxDQUFDO0FBQ3hCLE9BQU8sRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLGlCQUFpQixFQUFFLE1BQU0sWUFBWSxDQUFDO0FBQ25FLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxVQUFVLENBQUM7QUFDbkMsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLEtBQUssQ0FBQztBQUVwQyx1QkFBdUI7QUFDdkIsT0FBTyxlQUFlLENBQUE7QUFFdEIsT0FBTyxZQUFZLE1BQU0sZUFBZSxDQUFDO0FBRXpDLDBCQUEwQjtBQUMxQixZQUFZO0FBQ1osWUFBWSxDQUFDLE9BQU8sRUFBRTtJQUNwQixNQUFNLEVBQUUsbUNBQW1DO0NBQzVDLENBQUMsQ0FBQztBQUVILE1BQU0sU0FBUyxHQUFHLGFBQWEsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQy9ELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDO0FBRW5ELE1BQU0sWUFBWSxHQUFHLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLEVBQUUsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQztBQUNwRSxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssR0FBRyxZQUFZLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQThCLENBQUM7QUFFMUYseUJBQXlCO0FBQ3pCLE1BQU0sTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDO0lBQ3hCLE9BQU8sRUFBRTtR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