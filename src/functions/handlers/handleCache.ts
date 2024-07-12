import { findGuild } from '../../queries/guildQueries.js';

import { Client } from 'discord.js';

export async function loadCache(client: Client) {
  const guilds = client.guilds.cache.map((guild) => guild.id);

  console.log(guilds)
}