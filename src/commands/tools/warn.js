const Guild = require('../../schemas/guild');

const {
  SlashCommandBuilder,
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
    .setDMPermission(false),
  // .setDefaultMemberPermissions(PermissionFlagsBits.DeafenMembers),

  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    const guild = await findGuild(interaction.guild);
    let tags = guild.autoTags;

    const filtered = Array.from(tags).filter(([key, _value]) =>
      key.startsWith(focusedValue)
    );

    if (!filtered.length && focusedValue.length === 0) {
      return await interaction.respond(
        Array.from(tags).map(([key, _value]) => ({ name: key, value: key }))
      );
    }

    return await interaction.respond(
      filtered.map(([key, _value]) => ({ name: key, value: key }))
    );
  },

  async execute(interaction, client) {
    const { options, guild, member } = interaction;
    const target = options.getUser('user');
    var reason = options.getString('reason') ?? 'No reason provided.';
    const date = new Date();

    try {
      const guildDoc = await findGuild(guild);

      if (target.id == '145959145319694336')
        return await interaction.reply({
          content: 'L + Bozo. Puff is too princess to be warned!',
          ephemeral: true,
        });
      
      // pull the tags list and convert to value
      let tags = guildDoc.autoTags;
      reason = tags.get(reason) ?? reason;

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
          notes: [],
          warns: [warning],
        };

        guildDoc.users.push(userDoc);
      } else userDoc.warns.push(warning);

      let warnData =
        `**WARN** | Case #${guildDoc.caseNumber++}\n` +
        `**Target:** ${escapeMarkdown(`${target.username} (${target.id}`, {
          code: true,
        })})\n` +
        `**Moderator:** ${escapeMarkdown(
          `${member.user.username} (${member.user.id}`,
          { code: true }
        )})\n` +
        `**Reason:** ${reason}\n`;

      let warnConfirmation = `<:check:1196693134067896370> ${target} has been warned.`;

      await guildDoc.save().catch(console.error);

      await interaction.reply(warnConfirmation);

      if (target.id === client.user.id) return; // don't send a message to the bot
      client.users
        .send(
          target.id,
          'You have been warned in Sweet Sugar Dreams, ' +
            'these warnings are to inform you that a rule ' +
            'may have been broken and for us to keep track ' +
            'of your history on the server. Warnings are not ' +
            'serious, unless you keep repeating what we warned you for.\n' +
            'If you believe this warn was made in error, please make a <#852694135927865406>.\n\n' +
            `Warning: ${reason}`
        )
        .catch(console.error);

      //log to channel
      if (guildDoc.loggingChannel) {
        const logChannel = guild.channels.cache.get(guildDoc.loggingChannel);
        if (!logChannel) return;

        await logChannel.send(warnData);
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
