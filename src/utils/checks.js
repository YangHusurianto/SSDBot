export async function botSelfCheck(interaction, target, client, type) {
  if (target.id === client.user.id) {
    const selfCheck = {
      content: `I cannot ${type} myself!`,
      ephemeral: true,
    };
    if (interaction.replied) return await interaction.editReply(selfCheck);
    else return await interaction.reply(selfCheck);
  }

  if (target.id === interaction.member.id) {
    const selfCheck = {
      content: `You cannot ${type} yourself!`,
      ephemeral: true,
    };
    if (interaction.replied) return await interaction.editReply(selfCheck);
    else return await interaction.reply(selfCheck);
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
        const banCheck = {
          content: `You cannot ${type} a member with a higher or equal role than you!`,
          ephemeral: true,
        };
        if (interaction.replied) return await interaction.editReply(banCheck);
        else return await interaction.reply(banCheck);
      }

      return false;
    })
    .catch(async (err) => {
      if (type === 'ban') {
        const banCheck = {
          content:
            'Failed to fetch member for permissions check. Attempting to ban user anyway...',
          ephemeral: true,
        };
        if (interaction.replied) await interaction.editReply(banCheck);
        else await interaction.reply(banCheck);

        return false;
      }

      console.error(err);
      const banCheck = {
        content: 'Failed to fetch member for permissions check.',
        ephemeral: true,
      };
      if (interaction.replied) return await interaction.editReply(banCheck);
      else return await interaction.reply(banCheck);
    });
}
