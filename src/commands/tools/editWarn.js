const Guild = require('../../schemas/guild');

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

require('dotenv').config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('editwarn')
    .setDescription('Edit a warning.')
    .addIntegerOption((option) =>
      option
        .setName('warn_number')
        .setDescription('The case number to edit')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('reason').setDescription('The new reason')
    )
    .addStringOption((option) =>
      option.setName('notes').setDescription('Notes about the warning')
    )
    .setDMPermission(false),
    // .setDefaultMemberPermissions(PermissionFlagsBits.DeafenMembers),

  async execute(interaction, _client) {
    const { options, guild } = interaction;
    const warnNumber = options.getInteger('warn_number');
    let reason = options.getString('reason') ?? '';
    let notes = options.getString('notes') ?? '';

    try {
      const guildDoc = await Guild.findOne(
        {
          guildId: guild.id,
          'users.warns.warnNumber': warnNumber,
        },
        { 'users.$': 1 }
      );

      if (!guildDoc)
        return await interaction.reply(
          `:x: Could not find warning #${warnNumber}, failed to edit.`
        );
      const user = guildDoc.users[0];
      const warn = user.warns.find((warn) => warn.warnNumber === warnNumber);
      if (!reason) reason = warn.warnReason;
      if (!notes) notes = warn.notes;

      const editedWarn = await Guild.findOneAndUpdate(
        { guildId: guild.id, 'users.warns.warnNumber': warnNumber },
        {
          $set: {
            'users.$[user].warns.$[warn].warnReason': reason,
            'users.$[user].warns.$[warn].moderatorNotes': notes,
          },
        },
        {
          arrayFilters: [
            { 'user.warns.warnNumber': warnNumber },
            { 'warn.warnNumber': warnNumber },
          ],
          new: true,
        }
      );

      await interaction.reply(
        `<:check:1196693134067896370> Warning #${warnNumber} edited with new reason: ${reason}.`
      );
    } catch (err) {
      console.error(err);
    }
  },
};
