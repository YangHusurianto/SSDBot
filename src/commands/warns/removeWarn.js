const Guild = require('../../schemas/guild');
const findUser = require('../../util/findUser');
const findInfraction = require('../../util/findInfraction');

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

  async execute(interaction, _client) {
    const { options, guild, member } = interaction;
    const warnNumber = options.getInteger('warn_number');
    const target = options.getUser('user');

    await interaction.deferReply();

    try {
      const userDoc = await findInfraction(warnNumber);
      if (!userDoc) {
        return await interaction.editReply(
          `:x: Warning #${warnNumber} not found.`
        );
      }

      const infraction = userDoc.infractions.find(
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


      const updatedUserDoc = await User.findOneAndUpdate(
        { userId: infraction.targetUserId },
        {
          $pull: {
            infractions: { number: warnNumber },
          },
        },
        { new: true }
      ).then(async () => {
        return await interaction.editReply(
          `<:check:1196693134067896370> Warning #${warnNumber} removed.`
        );
        }).catch(async (err) => {
        console.error(err);
        return await interaction.editReply(
          `:x: Failed to remove warning #${warnNumber}.`
        );
      })

  
    } catch (err) {
      console.error(err);
    }
  },
};
