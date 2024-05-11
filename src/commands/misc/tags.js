import consoleStamp from 'console-stamp';
import { findGuild } from '../../queries/guildQueries.js';
import Guild from '../../schemas/guild.js';

import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('tag')
    .setDescription('Send a pre-defined message')
    .addStringOption((option) =>
      option
        .setName('tag')
        .setDescription('The tag')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .setDMPermission(false),

  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    const guild = await findGuild(interaction.guild);
    const tags = guild.settingsMap.get("tags")

    const filtered = Array.from(tags).filter(([key, _value]) =>
      key.startsWith(focusedValue)
    );

    if (!filtered.length && focusedValue.length === 0) {
      return await interaction.respond(
        Array.from(tags).map(([key, _value]) => ({ name: key, value: key }))
      );
    }

    return await interaction.respond(
      filtered.map(([key, _value]) => ({ name: key, value: key }))
    );
  },

  async execute(interaction) {
    const { options, guild } = interaction;
    var tag = options.getString('tag');

    try {
      sendTag(interaction, guild, tag);
    } catch (err) {
      console.error(err);
    }
  },
};

const sendTag = async (interaction, guild, tag) => {
  const guildDoc = await findGuild(guild);
  let finalTag = guildDoc.settingsMap.get("tags").get(tag);

  if (!finalTag) {
    return await interaction.reply({
      content: 'Tag not found.',
      ephemeral: true,
    });
  } // replace the above with getReplacedReason function eventually, need to rewrite the func to support all tags


  return await interaction.reply(finalTag);
};
