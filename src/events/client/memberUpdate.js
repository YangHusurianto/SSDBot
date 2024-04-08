import { findUser } from '../../queries/userQueries.js';

import { Events } from 'discord.js';

export default {
  name: Events.GuildMemberUpdate,
  async execute(_oldMember, newMember) {
    const userDoc = await findUser(newMember.guild.id, newMember.id);
    if (!userDoc) return;

    if (userDoc.muted) {
      const newRoles = newMember.roles.cache.filter(
        (role) => role.name !== 'MUTE'
      );
      newMember.roles.remove(newRoles).catch(console.error);
    }
  },
};
