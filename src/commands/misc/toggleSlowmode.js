import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('toggleslowmode')
    .setDescription('Toggle slowmode in the current channel')
    .addNumberOption((option) =>
      option
        .setName('time')
        .setDescription('The amount of time slow mode for in seconds')
        .setRequired(true)
    )
    .setDMPermission(false),

  async execute(interaction) {
    const { options } = interaction;
    var time = options.getNumber('time');

    if (await maxTimeCheck(interaction, time)) return;

    try {
      toggleSlowmode(interaction, time);
    } catch (err) {
      console.error(err);
    }
  },
};

const toggleSlowmode = async (interaction, time) => {
  interaction.channel.setRateLimitPerUser(time);
  await interaction.reply({
    content: `Slowmode has been set to ${time} seconds`,
    ephemeral: true,
  })
};

const maxTimeCheck = async (interaction, time) => {
  if (time > 21600) {
    await interaction.reply({
      content: 'Slowmode time cannot be more than 6 hours',
      ephemeral: true,
    });
    return true;
  }
  return false;
};