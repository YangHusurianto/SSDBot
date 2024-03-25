botSelfCheck = async (interaction, target, client) => {
  if (target.id === client.user.id) {
    return await interaction.reply({
      content: 'I cannot warn myself!',
      ephemeral: true,
    });
  }

  return false;
};

roleHeirarchyCheck = async (interaction, guild, target, member) => {
  await guild.members
    .fetch(target.id)
    .then(async (targetMember) => {
      if (
        member.roles.highest.comparePositionTo(targetMember.roles.highest) < 1
      ) {
        return await interaction.reply({
          content:
            'You cannot warn a member with a higher or equal role than you!',
          ephemeral: true,
        });
      }
    })
    .catch(async (err) => {
      console.error(err);
      return await interaction.reply({
        content: 'Failed to fetch member for warn check.',
        ephemeral: true,
      });
    });

  return false;
};

module.exports = { botSelfCheck, roleHeirarchyCheck };
