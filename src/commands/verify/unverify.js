const Guild = require('../../schemas/guild');

const { SlashCommandBuilder, escapeMarkdown } = require('discord.js');
const mongoose = require('mongoose');

require('dotenv').config();

module.exports = {
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
      const guildDoc = await findGuild(guild);

      let userDoc = guildDoc.users.find((user) => user.userId === target.id);

      if (!userDoc || !userDoc.verified) {
        return await interaction.reply({
          content: `:x: ${target} is not verified!`,
          ephemeral: true,
        });
      } else {
        userDoc.verified = false;
        userDoc.verifiedBy = '';
        guildDoc
          .save()
          .then(() => {
            const targetMember = interaction.guild.members.cache.find(
              (member) => member.id === target.id
            );
            targetMember.roles.remove('926253317284323389');
          })
          .catch(console.error);

        let unverifyData =
          `**UNVERIFY** | ${target}\n` +
          `**Target:** ${escapeMarkdown(`${target.username} (${target.id}`, {
            code: true,
          })})\n` +
          `**Moderator:** ${escapeMarkdown(
            `${member.user.username} (${member.user.id}`,
            { code: true }
          )})`;

        //log to channel
        if (guildDoc.loggingChannel) {
          const logChannel = guild.channels.cache.get(guildDoc.loggingChannel);
          if (!logChannel) return;

          await logChannel.send(verifyData);
        }

        return await interaction.reply({
          content: `<:check:1196693134067896370> ${target} has been unverified!`,
          ephemeral: true,
        });
      }
    } catch (err) {
      console.error(err);
    }
  },
};

const findGuild = async (guild) => {
  return await Guild.findOneAndUpdate(
    { guildId: guild.id },
    {
      $setOnInsert: {
        _id: new mongoose.Types.ObjectId(),
        guildId: guild.id,
        guildName: guild.name,
        guildIcon: guild.iconURL(),
        caseNumber: 0,
        loggingChannel: '',
        users: [],
        autoTags: new Map(),
        channelTags: new Map(),
      },
    },
    { upsert: true, new: true }
  );
};
