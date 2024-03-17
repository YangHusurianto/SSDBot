const Guild = require('../../schemas/guild');

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

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
    .setDMPermission(false),
  // .setDefaultMemberPermissions(PermissionFlagsBits.DeafenMembers),

  async execute(interaction, _client) {
    const { options, guild, member } = interaction;
    const warnNumber = options.getInteger('warn_number');
    const target = options.getUser('user');

    await interaction.deferReply();

    try {
      const guildDoc = await Guild.findOne({ guildId: guild.id });
      if (!guildDoc) {
        await interaction.editReply(`This server has no users with warnings!`);
        return;
      }

      if (target) {
        const userDoc = guildDoc.users.find(
          (user) => user.userId === target.id
        );
        if (!userDoc) {
          return await interaction.editReply(`This user has no warnings!`);
        }
      }

      const userDoc = await Guild.findOne(
        { guildId: guild.id, 'users.infractions.number': warnNumber },
        { 'users.$': 1 }
      );

      if (!userDoc) {
        return await interaction.editReply(
          `:x: No warning found with that case number.`
        );
      }

      const infraction = userDoc.users[0].infractions.find(
        (infraction) => infraction.number === warnNumber
      );

      if (target && infraction.targetUserId !== target.id) {
        return await interaction.editReply(
          `:x: The user you provided is not the user who was warned.`
        );
      }

      if (infraction.type !== 'WARN') {
        return await interaction.editReply(`:x: You cannot remove a ban.`);
      }

      const removedWarn = await Guild.findOneAndUpdate(
        { guildId: guild.id, 'users.infractions.number': warnNumber },
        {
          $pull: {
            'users.$.infractions': { number: warnNumber },
          },
        }
      );

      await removedWarn.save().catch(console.error);

      return await interaction.editReply(
        `<:check:1196693134067896370> Warning #${warnNumber} removed.`
      );
    } catch (err) {
      console.error(err);
    }
  },
};
