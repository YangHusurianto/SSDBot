const User = require('../../schemas/user_test');

const findInfraction = require('../../queries/infractionQueries');

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
    .setDMPermission(false),

  async execute(interaction, _client) {
    const { options, guild, member } = interaction;
    const warnNumber = options.getInteger('warn_number');
    const target = options.getUser('user');

    try {
      const userDoc = await findInfraction(guild.id, warnNumber);
      if (!userDoc) {
        return await interaction.reply(
          `:x: Warning #${warnNumber} not found.`
        );
      }

      const infraction = userDoc.infractions.find(
        (infraction) => infraction.number === warnNumber
      );

      if (infraction.type !== 'WARN') {
        return await interaction.reply(`:x: You cannot remove a ban.`);
      }

      return await User.findOneAndUpdate(
        { userId: infraction.targetUserId, guildId: guild.id},
        {
          $pull: {
            infractions: { number: warnNumber },
          },
        },
        { new: true }
      ).then(async () => {
        return await interaction.reply(
          `<:check:1196693134067896370> Warning #${warnNumber} removed.`
        );
        }).catch(async (err) => {
        console.error(err);
        return await interaction.reply(
          `:x: Failed to remove warning #${warnNumber}.`
        );
      })

  
    } catch (err) {
      console.error(err);
    }
  },
};
