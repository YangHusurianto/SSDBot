const { findGuild } = require('../../queries/guildQueries');
const { findAndCreateUser } = require('../../queries/userQueries');
const { logMessage } = require('../../util/logMessage');

const { SlashCommandBuilder, escapeMarkdown } = require('discord.js');

require('dotenv').config();

module.exports = {
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
          const targetMember = interaction.guild.members.cache.find(
            (member) => member.id === target.id
          );
          targetMember.roles.add('926253317284323389');

          await interaction.reply(
            `<:check:1196693134067896370> ${target} has been verified!`
          );

          //log to channel
          logMessage(
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
