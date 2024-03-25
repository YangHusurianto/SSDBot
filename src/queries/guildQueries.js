const Guild = require('../schemas/guild');

const mongoose = require('mongoose');

findGuild = async (guild) => {
  return await Guild.findOneAndUpdate(
    { guildId: guild.id },
    {
      $setOnInsert: {
        _id: new mongoose.Types.ObjectId(),
        guildId: guild.id,
        guildName: guild.name,
        guildIcon: guild.iconURL(),
        caseNumber: 0,
        loggingChannel: '',
        users: [],
        autoTags: new Map(),
        channelTags: new Map(),
      },
    },
    { upsert: true, new: true }
  );
};

getAutoTags = async (guild) => {
  const guildDoc = await findGuild(guild);
  return guildDoc.autoTags;
}

getChannelTags = async (guild) => {
  const guildDoc = await findGuild(guild);
  return guildDoc.channelTags;
}

getReplacedMessage = async (guild, message) => {
  const guildDoc = await findGuild(guild);
  let finalReason = guildDoc.autoTags.get(message);

  if (!finalReason) {
    const channelTags = guildDoc.channelTags;
    const tagPattern = new RegExp(
      Object.keys(channelTags.toJSON()).join('|'),
      'g'
    );

    finalReason = message.replace(
      tagPattern,
      (matched) => `<#${channelTags.get(matched)}>`
    );
  }

  return finalReason;
}

module.exports = { findGuild, getAutoTags, getChannelTags};