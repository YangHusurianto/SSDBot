const findGuild = require('../../utils/findGuild');

const { SlashCommandBuilder, escapeMarkdown } = require('discord.js');
const mongoose = require('mongoose');

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
      const guildDoc = await findGuild(guild);

      let userDoc = guildDoc.users.find((user) => user.userId === target.id);

      if (!userDoc) {
        userDoc = {
          _id: new mongoose.Types.ObjectId(),
          userId: target.id,
          verified: true,
          verifiedBy: member.user.id,
          notes: [],
          infractions: [],
        };

        guildDoc.users.push(userDoc);
      } else if (userDoc.verified) {
        return await interaction.reply(`:x: ${target} is already verified!`);
      } else {
        userDoc.verified = true;
        userDoc.verifiedBy = member.user.id;
      }

      await guildDoc
        .save()
        .then(async () => {
          let verifyData =
            `**VERIFY** | ${target}\n` +
            `**Target:** ${escapeMarkdown(`${target.username} (${target.id}`, {
              code: true,
            })})\n` +
            `**Moderator:** ${escapeMarkdown(
              `${member.user.username} (${member.user.id}`,
              { code: true }
            )})`;

          const targetMember = interaction.guild.members.cache.find(
            (member) => member.id === target.id
          );
          targetMember.roles.add('926253317284323389');

          let verifyConfirmation = `<:check:1196693134067896370> ${target} has been verified!`;

          await interaction.reply(verifyConfirmation);

          //log to channel
          if (guildDoc.loggingChannel) {
            const logChannel = guild.channels.cache.get(
              guildDoc.loggingChannel
            );
            if (!logChannel) return;

            await logChannel.send(verifyData);
          }
        })
        .catch(console.error);
    } catch (err) {
      console.error(err);
    }
  },
};
