const Guild = require('../../schemas/guild');

const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require('discord.js');
const mongoose = require('mongoose');

require('dotenv').config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnchannel')
    .setDescription('Create a channel tag')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('create')
        .setDescription('Create a channel tag')
        .addStringOption((option) =>
          option
            .setName('tag_name')
            .setDescription('The name of the tag')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('channel_id')
            .setDescription('The id of the channel')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('remove')
        .setDescription('Remove a channel tag')
        .addStringOption((option) =>
          option
            .setName('tag_name')
            .setDescription('The name of the tag')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName('list').setDescription('List all channel tags')
    )
    .setDMPermission(false),

  async execute(interaction, _client) {
    const { options, guild, member } = interaction;
    const tag = options.getString('tag_name');

    try {
      if (options.getSubcommand() === 'create') {
        const createdTag = await createTag(guild, tag, options.getString('channel_id'));
        return await interaction.reply(createdTag);
      }

      if (options.getSubcommand() === 'remove') {
        const removedTag = await removeTag(guild, tag);
        return await interaction.reply(removedTag);
      }

      if (options.getSubcommand() === 'list') {
        const tagsList = await tagsListEmbed(guild);
        return await interaction.reply({ embeds: [tagsList] });
      }
    } catch (err) {
      console.error(err);
    }
  },
};

const createTag = async (guild, tag, reason) => {
  let guildDoc = await Guild.findOneAndUpdate(
    { guildId: guild.id },
    {
      $setOnInsert: {
        _id: new mongoose.Types.ObjectId(),
        guildId: guild.id,
        guildName: guild.name,
        guildIcon: guild.iconURL(),
        caseNumber: 0,
        users: [],
        autoTags: new Map(),
        channelTags: new Map(),
      },
    },
    { upsert: true, new: true }
  );

  guildDoc.channelTags.set(`#${tag}`, id);

  await guildDoc.save().catch(console.error);

  return(`ChannelTag ${tag} created with id: ${id}.`);
};

const removeTag = async (guild, tag) => {
  let guildDoc = await Guild.findOne({ guildId: guild.id });

  if (!guildDoc) {
    return(`This server has no channel tags!`);
  }

  if (!guildDoc.channelTags.has(tag)) {
    return(`This server has no channel tag with that name!`);
  }

  guildDoc.channelTags.delete(`#${tag}`);

  await guildDoc.save().catch(console.error);

  return(`ChannelTag ${tag} removed.`);
};

const tagsListEmbed = async (guild) => {
  let guildDoc = await Guild.findOne({ guildId: guild.id });

  if (!guildDoc || guildDoc.channelTags.size === 0) {
    return('This server has no channel tags!');
  }

  let tags = guildDoc.channelTags;

  const embed = new EmbedBuilder().setAuthor({
    name: 'Channel Tags'
  });

  // sort by alphabetical key
  tags = new Map([...tags.entries()].sort());

  tags.forEach((value, key) => {
    embed.addFields({
      name: key.slice(1),
      value: value,
    });
  });

  return embed;
};
