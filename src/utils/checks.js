botSelfCheck = async (interaction, target, client) => {
  let check = false;
  
  if (target.id === client.user.id) {
    check = await interaction.reply({
      content: 'I cannot warn myself!',
      ephemeral: true,
    });
  }

  return check;
};

roleHeirarchyCheck = async (interaction, guild, target, member) => {
  let check = false;
  
  await guild.members
    .fetch(target.id)
    .then(async (targetMember) => {
      if (
        member.roles.highest.comparePositionTo(targetMember.roles.highest) < 1
      ) {
        check = await interaction.reply({
          content:
            'You cannot warn a member with a higher or equal role than you!',
          ephemeral: true,
        });
      }
    })
    .catch(async (err) => {
      console.error(err);
      check = await interaction.reply({
        content: 'Failed to fetch member for warn check.',
        ephemeral: true,
      });
    });

  return check;
};

module.exports = { botSelfCheck, roleHeirarchyCheck };
