import { findUser } from '../../queries/userQueries.js';

import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('selfreverify')
    .setDescription('Check if you have been verified')
    .setDMPermission(false),

  async execute(interaction, client) {
    const { guild, member } = interaction;

    try {
      const userDoc = await findUser(guild.id, member.id);
      if (!userDoc || !userDoc.verified) {
        return await interaction.reply({
          content: `:x: You are not verified!`,
          ephemeral: true,
        });
      }

      // give the verified role to the user and ephemeral reply
      let verifiedRole = guild.roles.cache.find(
        (role) => role.id == '926253317284323389'
      );
      await member.roles
        .add(verifiedRole)
        .then(() => {
          return interaction.reply({
            content: `<:check:1196693134067896370> You have been reverified!`,
            ephemeral: true,
          });
        })
        .catch((err) => {
          console.error(err);
          return interaction.reply({
            content: `:x: There was an error re-verifying you.`,
            ephemeral: true,
          });
        });
    } catch (err) {
      console.error(err);
    }
  },
};
