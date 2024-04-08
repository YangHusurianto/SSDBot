import { findUser } from '../../queries/userQueries.js';

import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('checkverify')
    .setDescription('Check if a user is verified')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The user to check')
        .setRequired(true)
    )
    .setDMPermission(false),

  async execute(interaction, client) {
    const { options, guild } = interaction;
    const target = options.getUser('user');

    try {
      const userDoc = await findUser(guild.id, target.id);
      if (!userDoc || !userDoc.verified) {
        return await interaction.reply(
          `:x: User is not verified in this server.`
        );
      }

      return await interaction
        .reply(`<:check:1196693134067896370> ${target} is verified!`)
        .then(async () => {
          const targetMember = await interaction.guild.members.fetch(target.id);
          targetMember.roles.add('926253317284323389');
          return await interaction.editReply(
            `<:check:1196693134067896370> ${target} is verified, but missing the verified role.\nGiving the role now.`
          );
        })
        .catch((err) => {
          console.error(err);
        });
    } catch (err) {
      console.error(err);
    }
  },
};
