const {
  findInfraction,
  removeInfraction,
} = require('../../queries/infractionQueries');
const { logMessage } = require('../../utils/logMessage');

const { SlashCommandBuilder, PermissionFlagsBits, escapeMarkdown } = require('discord.js');


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

    try {
      const userDoc = await findInfraction(guild.id, warnNumber);
      if (!userDoc) {
        return await interaction.reply(`:x: Warning #${warnNumber} not found.`);
      }

      const infraction = userDoc.infractions.find(
        (infraction) => infraction.number === warnNumber
      );

      if (infraction.type !== 'WARN') {
        return await interaction.reply(`:x: You cannot remove a ban.`);
      }

      return await removeInfraction(
        infraction.targetUserId,
        guild.id,
        warnNumber
      )
        .then(async () => {
          await interaction.reply(
            `<:check:1196693134067896370> Warning #${warnNumber} removed.`
          );

          const target = await guild.members.fetch(infraction.targetUserId);

          return await logMessage(
            guild,
            `**REMOVE WARN** | Case #${warnNumber}\n` +
              `**Target:** ${escapeMarkdown(
                `${target.user.username} (${target.id}`,
                {
                  code: true,
                }
              )})\n` +
              `**Moderator:** ${escapeMarkdown(
                `${member.user.username} (${member.user.id}`,
                { code: true }
              )})\n` +
              `**Warn:** ${infraction.reason}\n`
          );
        })
        .catch(async (err) => {
          console.error(err);
          return await interaction.reply(
            `:x: Failed to remove warning #${warnNumber}.`
          );
        });
    } catch (err) {
      console.error(err);
    }
  },
};
