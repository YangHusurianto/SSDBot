const Guild = require('../../schemas/guild');

const { SlashCommandBuilder, escapeMarkdown } = require('discord.js');
const mongoose = require('mongoose');

require('dotenv').config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('note')
    .setDescription('Create a note for a user')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The user to note')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('note')
        .setDescription('The note')
        .setRequired(true)
    )
    .setDMPermission(false),

  async execute(interaction) {
    const { options, guild, member } = interaction;
    const target = options.getUser('user');
    var noteInfo = options.getString('note');
    const date = new Date();

    try {
      const guildDoc = await findGuild(guild);

      // create the note first so we can insert regardless of whether the user exists
      const note = {
        _id: new mongoose.Types.ObjectId(),
        guildId: guild.id,
        targetUserId: target.id,
        noteNumber: guildDoc.caseNumber,
        note: noteInfo,
        noteDate: date,
        moderatorUserId: member.user.id, 
      };

      let userDoc = guildDoc.users.find((user) => user.userId === target.id);
      if (!userDoc) {
        userDoc = {
          _id: new mongoose.Types.ObjectId(),
          userId: target.id,
          verified: false,
          verifiedBy: '',
          notes: [note],
          infractions: [],
        };

        guildDoc.users.push(userDoc);
      } else userDoc.notes.push(note);

      let noteData =
        `**NOTE** | Case #${guildDoc.caseNumber++}\n` +
        `**Target:** ${escapeMarkdown(`${target.username} (${target.id}`, {
          code: true,
        })})\n` +
        `**Moderator:** ${escapeMarkdown(
          `${member.user.username} (${member.user.id}`,
          { code: true }
        )})\n` +
        `**Note:** ${noteInfo}\n`;

      let noteConfirmation = `<:check:1196693134067896370> A note has been placed under ${target}.`;

      await guildDoc.save().catch(console.error);

      await interaction.reply({
        content: noteConfirmation,
        ephemeral: true,
      });

      //log to channel
      if (guildDoc.loggingChannel) {
        const logChannel = guild.channels.cache.get(guildDoc.loggingChannel);
        if (!logChannel) return;

        await logChannel.send(noteData);
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
