const Guild = require('../../schemas/guild');

const {
  SlashCommandBuilder,
  PermissionsBitField,
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
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionsBitField.DEAFEN_MEMBERS),

  async execute(interaction, _client) {
    const { options, guild, member } = interaction;
    const tag = options.getString('tag_name');

    try {
      if (options.getSubcommand() === 'create') {
        const reason = options.getString('warn_reason');

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

        await interaction.reply(
          `AutoTag ${tag} created with reason ${reason}.`
        );

        return await guildDoc.save().catch(console.error);
      }

      if (options.getSubcommand() === 'remove') {
        let guildDoc = await Guild.findOne({ guildId: guild.id });

        if (!guildDoc) {
          await interaction.reply(`This server has no auto tags!`);
          return;
        }

        if (!guildDoc.autoTags.has(tag)) {
          await interaction.reply(
            `This server has no auto tag with that name!`
          );
          return;
        }

        guildDoc.autoTags.delete(tag);

        await interaction.reply(`AutoTag ${tag} removed.`);

        return await guildDoc.save().catch(console.error);
      }
    } catch (err) {
      console.error(err);
    }
  },
};
