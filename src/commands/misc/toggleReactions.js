import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('togglereactions')
    .setDescription('Toggle reactions in the current channel')
    .setDMPermission(false),

  async execute(interaction) {
    const { guild, channel } = interaction;

    toggleReactions(guild, channel);

    await interaction.reply({
      content: 'Reactions have been toggled',
      ephemeral: true,
    });
  },
};

const toggleReactions = (guild, channel) => {
  channel.permissionOverwrites.edit(guild.id, { ADD_REACTIONS: true });
}

