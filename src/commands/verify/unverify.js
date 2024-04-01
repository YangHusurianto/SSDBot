import { findUser } from '../../queries/userQueries.js';

import { SlashCommandBuilder, escapeMarkdown } from 'discord.js';
import { logMessage } from '../../utils/logMessage.js';

export default {
  data: new SlashCommandBuilder()
    .setName('unverify')
    .setDescription('Unverify a user')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The user to unverify')
        .setRequired(true)
    )
    .setDMPermission(false),

  async execute(interaction, client) {
    const { options, guild, member } = interaction;
    const target = options.getUser('user');

    try {
      let userDoc = await findUser(guild.id, target.id);

      if (!userDoc || !userDoc.verified) {
        return await interaction.reply({
          content: `:x: ${target} is not verified!`,
          ephemeral: true,
        });
      }

      userDoc.verified = false;
      userDoc.verifiedBy = '';
      userDoc
        .save()
        .then(async () => {
          const targetMember = await guild.members.fetch(target.id);
          targetMember.roles.remove('926253317284323389');

          await interaction.reply({
            content: `<:check:1196693134067896370> ${target} has been unverified!`,
            ephemeral: true,
          });

          return await logMessage(
            guild,
            `**UNVERIFY** | ${target}\n` +
              `**Target:** ${escapeMarkdown(
                `${target.username} (${target.id}`,
                {
                  code: true,
                }
              )})\n` +
              `**Moderator:** ${escapeMarkdown(
                `${member.user.username} (${member.user.id}`,
                { code: true }
              )})`
          );
        })
        .catch(console.error);
    } catch (err) {
      console.error(err);
    }
  },
};
