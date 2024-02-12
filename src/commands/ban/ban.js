const Guild = require('../../schemas/guild');

const { SlashCommandBuilder, escapeMarkdown } = require('discord.js');
const mongoose = require('mongoose');

require('dotenv').config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user by sending them a private message')
    .addUserOption((option) =>
      option.setName('user').setDescription('The user to ban').setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('The reason for banning')
        .setRequired(true)
    )
    .setDMPermission(false),

  async execute(interaction, client) {
    const { options, guild, member } = interaction;
    const target = options.getUser('user');
    var reason = options.getString('reason');
    const date = new Date();

    if (target.id === client.user.id) {
      // unable to warn the bot
      return await interaction.reply({
        content: 'I cannot ban myself!',
        ephemeral: true,
      });
    }

    try {
      const banCheck = await guild.fetchBan(target.id);
      if (banCheck) {
        return await interaction.reply({
          content: `${target} is already banned!`,
          ephemeral: true,
        });
      }

      const guildDoc = await findGuild(guild);

      // pull the tags list and convert to value
      let tags = guildDoc.autoTags;
      reason = tags.get(reason) ?? reason;

      // create the ban first so we can insert regardless of whether the user exists
      const ban = {
        _id: new mongoose.Types.ObjectId(),
        guildId: guild.id,
        targetUserId: target.id,
        type: 'BAN',
        number: guildDoc.caseNumber,
        reason: reason,
        date: date,
        moderatorUserId: member.user.id,
        moderatorNotes: '',
      };

      let userDoc = guildDoc.users.find((user) => user.userId === target.id);
      if (!userDoc) {
        userDoc = {
          _id: new mongoose.Types.ObjectId(),
          userId: target.id,
          verified: false,
          verifiedBy: '',
          notes: [],
          infractions: [ban],
        };

        guildDoc.users.push(userDoc);
      } else userDoc.infractions.push(ban);

      await client.users
        .send(
          target.id,
          `You have been banned from ${guild.name}.\n` +
            `**Reason:** ${reason}\n\n` +
            `If you feel this ban was not fair or made in error,` +
            `please create a ticket in the unban server at https://discord.gg/Hwtt2V8CKp.`
        )
        .catch((err) => {
          console.log('Failed to dm user about ban.')
          console.log(err);
        });

      await guild.members.ban(target.id, { reason: reason }).catch(console.error);

      guildDoc.caseNumber++;
      await guildDoc.save().catch(console.error);

      let banConfirmation = `<:check:1196693134067896370> ${target} has been banned.`;
      await interaction.reply(banConfirmation);

      //log to channel
      let banData =
        `**BAN** | Case #${guildDoc.caseNumber}\n` +
        `**Target:** ${escapeMarkdown(`${target.username} (${target.id}`, {
          code: true,
        })})\n` +
        `**Moderator:** ${escapeMarkdown(
          `${member.user.username} (${member.user.id}`,
          { code: true }
        )})\n` +
        `**Reason:** ${reason}\n`;

      if (guildDoc.loggingChannel) {
        const logChannel = guild.channels.cache.get(guildDoc.loggingChannel);
        if (!logChannel) return;

        await logChannel.send(banData);
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
      },
    },
    { upsert: true, new: true }
  );
};
