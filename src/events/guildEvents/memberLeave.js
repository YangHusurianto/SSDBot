import { logMessage } from '../../utils/logs.js';

import { Events, escapeMarkdown, EmbedBuilder } from 'discord.js';

export default {
  name: Events.GuildMemberRemove,
  async execute(member) {
    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setAuthor({
        name: `${member.user.username}`,
        iconURL: member.user.displayAvatarURL(),
      })
      .setDescription(`${member.user.username} left the server`)
      .addFields(
        {
          name: 'User Information',
          value: `${escapeMarkdown(member.user.username)} (${member.user.id}) <@${
            member.user.id
          }>`,
        },
        {
          name: 'Roles',
          value: member.roles.cache.map((role) => role.toString()).join(', '),
        },
        {
          name: 'Joined Server',
          value: `<t:${Math.round(member.joinedAt.getTime() / 1000)}:F>`,
        },
        {
          name: 'Joined Discord',
          value: `<t:${Math.round(member.user.createdAt.getTime() / 1000)}:F>`,
        },
        {
          name: 'ID',
          value: `\`\`\`ini\nUser = ${member.user.id}\`\`\``,
        }
      )
      .setTimestamp();

    await logMessage(member.guild, { embeds: [embed] });
  },
};
