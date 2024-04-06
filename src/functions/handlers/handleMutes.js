import getMutedUsers from '../queries/userQueries.js';

export default async function handleMutes(client) {
  client.handleMutes = async () => {
    setInterval(async () => {
      try {
        const mutedUsers = await getMutedUsers();

        for (const userDoc of mutedUsers) {
          const userInfractions = userDoc.infractions;
          for (const infraction of userInfractions) {
            if (infraction.type !== 'MUTE') continue;

            const time = new Date(infraction.date).getTime() + ms(infraction.duration);
            if (time > Date.now()) continue;

            const guild = client.guilds.cache.get(userDoc.guildId);
            if (!guild) continue;

            const member = guild.members.cache.get(userDoc.userId);
            if (!member) continue;

            const role = guild.roles.cache.find((role) => role.name === 'MUTE');
            if (!role) continue;

            member.roles.set(userDoc.roles);
          }
        }
      } catch (err) {
        console.error(err);
      }
     }, 1000 * 30); // Every 30 seconds
  };
}
