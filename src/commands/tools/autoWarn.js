const Guild = require('../../schemas/guild');

const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  escapeMarkdown,
} = require('discord.js');
const mongoose = require('mongoose');

require('dotenv').config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autowarn')
    .setDescription('Create an auto warn tag')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('create')
        .setDescription('Create an auto warn tag')
        .addStringOption((option) =>
          option
            .setName('tag_name')
            .setDescription('The name of the tag')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('warn_reason')
            .setDescription('The autofilled warning reason')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('remove')
        .setDescription('Remove an auto warn tag')
        .addStringOption((option) =>
          option
            .setName('tag_name')
            .setDescription('The name of the tag')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName('list').setDescription('List all auto warn tags')
    )
    .setDMPermission(false),
    // .setDefaultMemberPermissions(PermissionFlagsBits.DeafenMembers),

  async execute(interaction, _client) {
    const { options, guild, member } = interaction;
    const tag = options.getString('tag_name');

    try {
      if (options.getSubcommand() === 'create') {
        const test = await createTag(guild, tag, options.getString('warn_reason'));
        console.log(test);
        return await interaction.reply(test);
      }

      if (options.getSubcommand() === 'remove') {
        return await interaction.reply(removeTag(guild, tag));
      }

      if (options.getSubcommand() === 'list') {
        return await interaction.reply({ embeds: [tagsListEmbed(guild)] });
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
      },
    },
    { upsert: true, new: true }
  );

  guildDoc.autoTags.set(tag, reason);

  await guildDoc.save().catch(console.error);

  return(`AutoTag ${tag} created with reason ${reason}.`);
};

const removeTag = async (guild, tag) => {
  let guildDoc = await Guild.findOne({ guildId: guild.id });

  if (!guildDoc) {
    return(`This server has no auto tags!`);
  }

  if (!guildDoc.autoTags.has(tag)) {
    return(`This server has no auto tag with that name!`);
  }

  guildDoc.autoTags.delete(tag);

  await guildDoc.save().catch(console.error);

  return(`AutoTag ${tag} removed.`);
};

const tagsListEmbed = async (guild) => {
  let guildDoc = await Guild.findOne({ guildId: guild.id });

  if (!guildDoc || guildDoc.autoTags.size === 0) {
    return('This server has no auto tags!');
  }

  let tags = guildDoc.autoTags;

  const embed = {
    title: `Auto Tags`,
    description: `List of all auto tags`,
    fields: [],
  };

  tags.forEach((value, key) => {
    embed.fields.push({
      name: key,
      value: value,
    });
  });

  return embed;
};
