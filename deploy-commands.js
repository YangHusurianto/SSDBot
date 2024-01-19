const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

require("dotenv").config();

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

let warningDB;

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath)(warningDB);

	//create command item in collection
	if ('data' in command && 'execute' in command) {
		commands.push(command.data.toJSON());
	} else {
		console.log(`[WARNING] ${filePath} command failed to register properly`);
	}
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

rest.delete(Routes.applicationCommand(process.env.CLIENT_ID, '1127715944983175341'))
	.then(() => console.log("deleted"))
	.catch(console.error);


// and deploy your commands!
(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			// Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.DEV_GUILD_ID),
			Routes.applicationCommands(process.env.DEV_CLIENT_ID),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();
