import { findAndCreateUser } from '../../queries/userQueries.js';
import { logAction } from '../../utils/logs.js';

import { SlashCommandBuilder, escapeMarkdown } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Verify a user')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The user to verify')
        .setRequired(true)
    )
    .setDMPermission(false),

  async execute(interaction, client) {
    const { options, guild, member } = interaction;
    const target = options.getUser('user');

    try {
      let userDoc = await findAndCreateUser(guild.id, target.id);
      const targetMember = await guild.members.fetch(target.id);

      if (userDoc.verified) {
        if (targetMember.roles.cache.has('926253317284323389')) {
          return await interaction.reply(`${target} is already verified!`);
        }

        targetMember.roles.add('926253317284323389');
        return await interaction.reply(
          `<:check:1196693134067896370> ${target} is verified, but missing the verified role.\nGiving the role now.`
        );
      }

      userDoc.verified = true;
      userDoc.verifiedBy = member.user.id;

      return await userDoc
        .save()
        .then(async () => {
          targetMember.roles.add('926253317284323389');

          await interaction.reply(
            `<:check:1196693134067896370> ${target} has been verified!`
          );

          //log to channel
          return await logAction(
            guild,
            `**VERIFY** | ${target}\n` +
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
