import { logAction } from '../../utils/logs.js';
import { botSelfCheck, roleHeirarchyCheck } from '../../utils/checks.js';

import { SlashCommandBuilder, escapeMarkdown } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('delete')
    .setDescription('Delete a message')
    .addStringOption((option) =>
      option
        .setName('id')
        .setDescription('The id of the message to delete')
        .setRequired(true)
    )
    .setDMPermission(false),

  async execute(interaction, client) {
    const { options, guild, member } = interaction;
    const messageId = options.getString('id');

    let message;
    try {
      message = await interaction.channel.messages.fetch(messageId);
    } catch (err) {
      return await interaction.reply({
        content: 'Failed to fetch message or invalid message id.',
        ephemeral: true,
      });
    }

    if (!message) {
      return await interaction.reply({
        content: 'Message not found.',
        ephemeral: true,
      });
    }

    const target = message.author;

    if (await botSelfCheck(interaction, target, client, 'delete a message of'))
      return;
    if (
      await roleHeirarchyCheck(
        interaction,
        guild,
        target,
        member,
        'delete a message of'
      )
    )
      return;

    if (await channelCheck(interaction, message)) return;

    try {
      deleteMessage(interaction, message, guild, target, member);
    } catch (err) {
      console.error(err);
    }
  },
};

const deleteMessage = async (interaction, message, guild, target, member) => {
  await message
    .delete()
    .then(async () => {
      await interaction.reply({
        content: `Message (${message.content}) deleted.`,
        ephemeral: true,
      });

      await logAction(
        guild,
        `**DEL MSG**\n` +
          `**Author:** ${escapeMarkdown(`${target.username} (${target.id}`, {
            code: true,
          })})\n` +
          `**Content:** ${message.content}\n` +
          `**Moderator:** ${escapeMarkdown(
            `${member.user.username} (${member.user.id}`,
            { code: true }
          )})\n`
      );
    })
    .catch(async (err) => {
      console.error(err);
      return await interaction.reply({
        content: 'Failed to delete message.',
        ephemeral: true,
      });
    });
};

const channelCheck = async (interaction, message) => {
  let channelName = message.channel.name;

  if (channelName === 'mod-actions' || channelName === 'logs') {
    return await interaction.reply({
      content: 'You cannot delete messages in this channel.',
      ephemeral: true,
    });
  }

  return false;
};
