const { findGuild } = require('../../queries/guildQueries');
const { findAndCreateUser } = require('../../queries/userQueries');
const { logMessage } = require('../../util/logMessage');

const { SlashCommandBuilder, escapeMarkdown } = require('discord.js');
const mongoose = require('mongoose');


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
      option.setName('note').setDescription('The note').setRequired(true)
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

      let userDoc = await findAndCreateUser(guild.id, target.id);
      userDoc.notes.push(note);

      await guildDoc.save().catch(async (err) => {
        await interaction.reply(`:x: Failed to update case number.`);
        console.error(err);
      });

      await userDoc.save().catch(async (err) => {
        await interaction.reply(`:x: Failed to save note.`);
        console.error(err);
      });

      await interaction.reply({
        content: `<:check:1196693134067896370> A note has been placed under ${target}.`,
        ephemeral: true,
      });

      //log to channel
      logMessage(
        guild,
        `**NOTE** | Case #${guildDoc.caseNumber++}\n` +
          `**Target:** ${escapeMarkdown(`${target.username} (${target.id}`, {
            code: true,
          })})\n` +
          `**Moderator:** ${escapeMarkdown(
            `${member.user.username} (${member.user.id}`,
            { code: true }
          )})\n` +
          `**Note:** ${noteInfo}\n`
      );
    } catch (err) {
      console.error(err);
    }
  },
};
