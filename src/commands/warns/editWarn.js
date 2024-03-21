const Guild = require('../../schemas/guild');

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
  // .setDefaultMemberPermissions(PermissionFlagsBits.DeafenMembers),

  async execute(interaction, _client) {
    const { options, guild } = interaction;
    const infractionNumber = options.getInteger('infraction_number');
    let reason = options.getString('reason') ?? '';
    let notes = options.getString('notes') ?? '';

    interaction.deferReply();

    try {
      const guildDoc = await Guild.findOne(
        {
          guildId: guild.id,
          'users.infractions.number': infractionNumber,
        },
        { 'users.$': 1 }
      );

      if (!guildDoc)
        return await interaction.editReply(
          `:x: Could not find infraction #${infractionNumber}, failed to edit.`
        );
      const user = guildDoc.users[0];
      const infraction = user.infractions.find((infraction) => infraction.number === infractionNumber);
      if (!reason) reason = infraction.reason;
      if (!notes) notes = infraction.moderatorNotes;

      const editedInfraction = await Guild.findOneAndUpdate(
        { guildId: guild.id, 'users.infractions.number': infractionNumber },
        {
          $set: {
            'users.$[user].infractions.$[infraction].reason': reason,
            'users.$[user].infractions.$[infraction].moderatorNotes': notes,
          },
        },
        {
          arrayFilters: [
            { 'user.infractions.number': infractionNumber },
            { 'infraction.number': infractionNumber },
          ],
          new: true,
        }
      );

      await interaction.editReply(
        `<:check:1196693134067896370> Infraction #${infractionNumber} edited with new reason: ${reason}`
      );
    } catch (err) {
      console.error(err);
    }
  },
};
