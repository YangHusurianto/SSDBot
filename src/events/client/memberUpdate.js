import { Events } from 'discord.js';

export default {
  name: Events.GuildMemberUpdate,
  async execute(oldMember, newMember) {
    if (oldMember.roles.cache.some((role) => role.name === 'MUTE')) {
      const newRoles = newMember.roles.cache.filter(
        (role) => role.name !== 'MUTE'
      );
      newMember.roles.remove(newRoles).catch(console.error);
    }
  },
};
