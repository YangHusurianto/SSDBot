import { logMessage } from '../../utils/logMessage.js';

import { Events, escapeMarkdown, EmbedBuilder } from 'discord.js';

export default {
  name: Events.guildMemberRemove,
  async execute(member) {
    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setAuthor(
        `${member.user.username}`,
        member.user.displayAvatarURL()
      )
      .setDescription(`${member.user.username} left the server`)
      .addFields({
        name: 'User Information',
        value: `${escapeMarkdown(member.user.username)} ${(member.user.id)} @<${member.user.id}>`,
      })
      .addFields({
        name: 'Roles',
        value: member.roles.cache.map((role) => role.toString()).join(', ')
      })
      .addFields({
        name: 'Joined Server',
        value: member.joinedAt,
      })
      .addFields({
        name: 'Joined Discord',
        value: member.user.createdAt,
      })
      .addFields({
        name: 'ID',
        value: `\`\`\`ini\nUser = ${member.user.id}\`\`\``,
      })
      .addTimestamp();

    await logMessage(member.guild, { embeds: [embed] });
  },
};
