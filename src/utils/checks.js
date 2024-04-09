export async function botSelfCheck(interaction, target, client, type) {
  if (target.id === client.user.id) {
    return await interaction.reply({
      content: `I cannot ${type} myself!`,
      ephemeral: true,
    });
  }

  if (target.id === interaction.member.id) {
    return await interaction.reply({
      content: `You cannot ${type} yourself!`,
      ephemeral: true,
    });
  }

  return false;
}

export async function roleHeirarchyCheck(
  interaction,
  guild,
  target,
  member,
  type
) {
  return await guild.members
    .fetch(target.id)
    .then(async (targetMember) => {
      if (
        member.roles.highest.comparePositionTo(targetMember.roles.highest) < 1
      ) {
        return await interaction.reply({
          content: `You cannot ${type} a member with a higher or equal role than you!`,
          ephemeral: true,
        });
      }

      return false;
    })
    .catch(async (err) => {
      console.error(err);
      return await interaction.reply({
        content: 'Failed to fetch member for permissions check.',
        ephemeral: true,
      });
    });
}
