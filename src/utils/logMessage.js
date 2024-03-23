const { findGuild } = require('../queries/guildQueries');

logMessage = async (guild, message) => {
  const guildDoc = await findGuild(guild);

  if (guildDoc.loggingChannel) {
    const logChannel = guild.channels.cache.get(
      guildDoc.loggingChannel
    );
    if (!logChannel) return;

    await logChannel.send(message);
  }
}

module.exports = { logMessage };