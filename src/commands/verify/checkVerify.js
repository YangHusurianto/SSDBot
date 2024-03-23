const Guild = require('../../schemas/guild');

const { SlashCommandBuilder, escapeMarkdown } = require('discord.js');


module.exports = {
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
    const { options, guild, member } = interaction;
    const target = options.getUser('user');

    try {
      const guildDoc = await Guild.findOne(
        {
          guildId: guild.id,
          'users.userId': target.id,
        },
        { 'users.$': 1 }
      );

      if (!guildDoc || !guildDoc.users[0].verified)
        return await interaction.reply(
          `:x: User is not verified in this server.`
        );

      return await interaction.reply(
        `<:check:1196693134067896370> ${target} is verified!`
      ).then(() => {
        const targetMember = interaction.guild.members.cache.find(member => member.id === target.id);
        targetMember.roles.add("926253317284323389");
      }).catch((err) => {
        console.error(err);
      });
    } catch (err) {
      console.error(err);
    }
  },
};