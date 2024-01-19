const Guild = require('../../schemas/guild');

const {
  SlashCommandBuilder,
  PermissionsBitField,
  escapeMarkdown,
} = require('discord.js');
const mongoose = require('mongoose');

require('dotenv').config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user by sending them a private message')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The user to warn')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('The reason')
        .setAutocomplete(true)
    )
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionsBitField.DEAFEN_MEMBERS),

  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    let tags = await Guild.findOne({ guildId: interaction.guild.id });
    tags = tags.autoTags;

    const filtered = Array.from(tags).filter(([key, _value]) =>
      key.startsWith(focusedValue)
    );
    await interaction.respond(
      filtered.map(([key, value]) => ({ name: key, value: value }))
    );
  },

  async execute(interaction, client) {
    const { options, guild, member } = interaction;
    const target = options.getUser('user');
    var reason = options.getString('reason') ?? 'No reason provided.';
    const date = new Date();

    try {
      let guildDoc = await Guild.findOneAndUpdate(
        { guildId: guild.id },
        {
          $setOnInsert: {
            _id: new mongoose.Types.ObjectId(),
            guildId: guild.id,
            guildName: guild.name,
            guildIcon: guild.iconURL(),
            caseNumber: 0,
            users: [],
            autoTags: new Map(),
          },
        },
        { upsert: true, new: true }
      );

      // create the warning first so we can insert regardless of whether the user exists
      const warning = {
        _id: new mongoose.Types.ObjectId(),
        guildId: guild.id,
        targetUserId: target.id,
        warnNumber: guildDoc.caseNumber,
        warnReason: reason,
        warnDate: date,
        moderatorUserId: member.user.id,
        moderatorNotes: '',
      };

      let userDoc = guildDoc.users.find((user) => user.userId === target.id);
      if (!userDoc) {
        userDoc = {
          _id: new mongoose.Types.ObjectId(),
          userId: target.id,
          userName: target.username,
          userNick: target.displayName,
          warns: [warning],
        };

        guildDoc.users.push(userDoc);
      } else userDoc.warns.push(warning);

      let warnConfirmation =
        `<:check:1196693134067896370> ${target} has been warned.\n` +
        `**WARN** | Case #${guildDoc.caseNumber++}\n` +
        `**Target:** ${escapeMarkdown(`${target.username} (${target.id}`, {
          code: true,
        })})\n` +
        `**Moderator:** ${escapeMarkdown(
          `${member.user.username} (${member.user.id}`,
          { code: true }
        )})\n` +
        `**Reason:** ${reason}\n`;

      await guildDoc.save().catch(console.error);

      await interaction.reply(warnConfirmation);

      if (target.id === client.user.id) return;
      client.users.send(
        target.id,
        'You have been warned in Sweet Sugar Dreams, ' + 
        'these warnings are to inform you that a rule ' +
        'may have been broken and for us to keep track ' +
        'of your history on the server. Warnings are not ' +
        'serious, unless you keep repeating what we warned you for.\n\n' +
        `Warning: ${reason}`
      );
    } catch (err) {
      console.error(err);
    }
  },
};
