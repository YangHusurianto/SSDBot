const Guild = require('../../schemas/guild');

const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

require('dotenv').config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removewarn')
    .setDescription('Remove a warning from a user.')
    .addIntegerOption((option) =>
      option
        .setName('warn_number')
        .setDescription('The case number to remove')
        .setRequired(true)
    )
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The user to warn (used to verify the warning)')
    )
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.DeafenMembers),

  async execute(interaction, _client) {
    const { options, guild, member } = interaction;
    const warnNumber = options.getInteger('warn_number');
    const target = options.getUser('user');

    try {
      const guildDoc = await Guild.findOne({ guildId: guild.id });
      if (!guildDoc) {
        await interaction.reply(`This server has no users with warnings!`);
        return;
      }

      if (target) {
        const userDoc = guildDoc.users.find(
          (user) => user.userId === target.id
        );
        if (!userDoc) {
          await interaction.reply(`This user has no warnings!`);
          return;
        }
      }

      const userDoc = await Guild.findOne(
        { guildId: guild.id, 'users.warns.warnNumber': warnNumber },
        { 'users.$': 1 }
      );

      if (!userDoc) {
        await interaction.reply(`:x: No warning found with that case number.`);
        return;
      }

      const warning = userDoc.users[0].warns.find(
        (warn) => warn.warnNumber === warnNumber
      );

      if (target && warning.targetUserId !== target.id) {
        await interaction.reply(
          `:x: The user you provided is not the user who was warned.`
        );
        return;
      }

      const removedWarn = await Guild.findOneAndUpdate(
        { guildId: guild.id, 'users.warns.warnNumber': warnNumber },
        {
          $pull: {
            'users.$.warns': { warnNumber: warnNumber },
          },
        }
      );

      await removedWarn.save().catch(console.error);

      await interaction.reply(
        `<:check:1196693134067896370> Warning #${warnNumber} removed.`
      );
    } catch (err) {
      console.error(err);
    }
  },
};
