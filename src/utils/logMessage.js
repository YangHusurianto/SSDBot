import { findGuild } from '../queries/guildQueries.js';

export async function logMessage(guild, message) {
  const guildDoc = await findGuild(guild);

  if (guildDoc.loggingChannel) {
    const logChannel = guild.channels.cache.get(guildDoc.loggingChannel);
    if (!logChannel) return;

    await logChannel.send(message);
  }
}
