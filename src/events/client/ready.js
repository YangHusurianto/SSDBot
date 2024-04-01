import { Events } from 'discord.js';

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`Bot logged in as ${client.user.tag}`);
  },
};
