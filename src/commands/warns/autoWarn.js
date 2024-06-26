import { findGuild } from '../../queries/guildQueries.js';

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
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
        const createdTag = await createTag(
          guild,
          tag,
          options.getString('warn_reason')
        );
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
  let guildDoc = await findGuild(guild);

  guildDoc.autoTags.set(tag, reason);

  await guildDoc.save().catch(console.error);

  return `AutoTag ${tag} created with reason: ${reason}.`;
};

const removeTag = async (guild, tag) => {
  let guildDoc = await findGuild(guild);

  if (!guildDoc) {
    return `This server has no auto tags!`;
  }

  if (!guildDoc.autoTags.has(tag)) {
    return `This server has no auto tag with that name!`;
  }

  guildDoc.autoTags.delete(tag);

  await guildDoc.save().catch(console.error);

  return `AutoTag ${tag} removed.`;
};

const tagsListEmbed = async (guild) => {
  let guildDoc = await findGuild(guild);

  if (!guildDoc || guildDoc.autoTags.size === 0) {
    return 'This server has no auto tags!';
  }

  let tags = guildDoc.autoTags;

  const embed = new EmbedBuilder().setAuthor({
    name: 'Auto Tags',
  });

  // sort by alphabetical key
  tags = new Map([...tags.entries()].sort());

  tags.forEach((value, key) => {
    embed.addFields({
      name: key,
      value: value,
    });
  });

  return embed;
};
