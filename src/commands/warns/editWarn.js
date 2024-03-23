const Guild = require('../../schemas/guild');
const { updateInfraction } = require('../../queries/infractionQueries');

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

require('dotenv').config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('editwarn')
    .setDescription('Edit an infraction.')
    .addIntegerOption((option) =>
      option
        .setName('infraction_number')
        .setDescription('The case number to edit')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('reason').setDescription('The new reason')
    )
    .addStringOption((option) =>
      option.setName('notes').setDescription('Notes about the infraction')
    )
    .setDMPermission(false),

  async execute(interaction, _client) {
    const { options, guild } = interaction;
    const infractionNumber = options.getInteger('infraction_number');
    let reason = options.getString('reason') ?? null;
    let notes = options.getString('notes') ?? null;

    if (!reason && !notes) {
      return await interaction.reply(
        `:x: You must provide a reason or notes to edit an infraction.`
      );
    }

    try {
      return await updateInfraction(
        guild.id,
        infractionNumber,
        reason,
        notes
      )
        .then(async (value) => {
          if (value) {
            return await await interaction.reply(
              `<:check:1196693134067896370> Infraction #${infractionNumber} edited.`
            );
          }

          return await interaction.reply(
            `:x: Infraction #${infractionNumber} not found.`
          );
        })
        .catch(async (err) => {
          console.error(err);
          return await interaction.reply(
            `:x: Failed to edit infraction #${infractionNumber}.`
          );
        });
    } catch (err) {
      console.error(err);
    }
  },
};
