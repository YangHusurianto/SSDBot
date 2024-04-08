import { findGuild } from '../queries/guildQueries.js';

export async function logMessage(guild, message) {
  const logChannel = await logCheck(guild);
  
  if (!logChannel) return;
  logChannel.send(message);
}

async function logCheck(guild) {
  const guildDoc = await findGuild(guild);

  if (guildDoc.loggingChannel) {
    const logChannel = guild.channels.cache.get(guildDoc.loggingChannel);
    if (!logChannel) return null;

    return logChannel;
  }
}