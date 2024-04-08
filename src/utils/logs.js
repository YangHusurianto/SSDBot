import { findGuild } from '../queries/guildQueries.js';

export async function logMessage(guild, message) {
  const logChannel = await getChannel(guild, 'logChannel');

  if (!logChannel) return;
  logChannel.send(message);
}

export async function logAction(guild, message) {
  const actionChannel = await getChannel(guild, 'modActionsChannel');

  if (!actionChannel) return;
  actionChannel.send(message);
}

async function getChannel(guild, channel) {
  const guildDoc = await findGuild(guild);

  const channelId = guildDoc.settings.get(channel);
  if (channelId) {
    const channel = guild.channels.cache.get(channelId);
    if (!channel) return null;

    return channel;
  }
}

