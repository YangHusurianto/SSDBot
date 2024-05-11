import { logMessage } from '../../utils/logs.js';

import { Events, escapeMarkdown, EmbedBuilder } from 'discord.js';

const NEW_MEMBER_AGE_LIMIT = 60; // days

export default {
  name: Events.GuildMemberAdd,
  async execute(member, client) {
    const accountAge = Date.now() - member.user.createdAt;

    if (accountAge < 1000 * 60 * 60 * 24 * NEW_MEMBER_AGE_LIMIT) {
      muteUser(member, client);
    }

    await logJoin(member);
  },
};

async function logJoin(member) {
  const joinedAt = member.joinedTimestamp;
  const createdAt = member.user.createdTimestamp;

  const embed = new EmbedBuilder()
    .setColor('#00FF00')
    .setAuthor({
      name: `${member.user.username}`,
      iconURL: member.user.displayAvatarURL(),
    })
    .setDescription(`${member.user.username} joined the server`)
    .addFields(
      {
        name: 'User Information',
        value: `${escapeMarkdown(member.user.username)} (${member.user.id}) <@${
          member.user.id
        }>`,
      },
      {
        name: 'Roles',
        value: member.roles.cache.map((role) => role.toString()).join(', '),
      },
      {
        name: 'Joined Server',
        value: `<t:${joinedAt}:F> | <t:${joinedAt}:R>`,
        inline: true,
      },
      {
        name: 'Joined Discord',
        value: `<t:${createdAt}:F> | <t:${createdAt}:R>`,
        inline: true,
      },
      {
        name: 'Member Count',
        value: member.guild.memberCount,
        inline: true,
      },
      {
        name: 'ID',
        value: `\`\`\`ini\nUser = ${member.user.id}\`\`\``,
      }
    )
    .setTimestamp();

  await logMessage(member.guild, { embeds: [embed] });
}

// invite code - https://anidiots.guide/coding-guides/tracking-used-invites/

async function muteUser(
  interaction,
  guild,
  client,
  target,
  member,
  time,
  reason
) {
  const guildDoc = await findGuild(guild);

  reason = await getReplacedReason(guild, reason);

  // create the warning first so we can insert regardless of whether the user exists
  const mute = {
    _id: new mongoose.Types.ObjectId(),
    guildId: guild.id,
    targetUserId: target.id,
    type: 'MUTE',
    number: -1,
    reason: reason,
    date: new Date(),
    duration: '0',
    moderatorUserId: member.user.id,
    moderatorNotes: '',
  };

  let userDoc = await findAndCreateUser(guild.id, target.id, true);
  userDoc.infractions.push(mute);

  const targetMember = await guild.members.fetch(target.id);
  const savedRolesMap = targetMember.roles.valueOf();
  let savedRoles = [];
  for (const role of savedRolesMap) {
    savedRoles.push(role[0]);
  }
  userDoc.roles = savedRoles;
  userDoc.muted = true;

  await userDoc.save().catch(async (err) => {
    console.error(err);
    return await interaction.reply(':x: Failed to save mute.');
  });

  const role = guild.roles.cache.find((role) => role.name === 'MUTE');
  targetMember.roles.set([role.id]);

  let formattedTime = time;
  if (time === '0') formattedTime = 'Indefinite';
  else formattedTime = prettyMilliseconds(time, { verbose: true });
  await interaction.reply(
    `<:check:1196693134067896370> ${target} has been muted for ${formattedTime}.`
  );

  client.users
    .send(
      target.id,
      `You have been muted in ${guild.name}.\n` +
        `**Duration:** ${formattedTime}\n` +
        `**Reason:** ${reason}\n\n` +
        'If you feel this mute was not fair or made in error,' +
        'please create a ticket in the server at <#852694135927865406>'
    )
    .catch((err) => {
      console.log('Failed to dm user about mute.');
      console.error(err);
    });

  //log to channel
  await logAction(
    guild,
    `**MUTE** | Case #${guildDoc.caseNumber - 1}\n` +
      `**Target:** ${escapeMarkdown(`${target.username} (${target.id}`, {
        code: true,
      })})\n` +
      `**Moderator:** ${escapeMarkdown(
        `${member.user.username} (${member.user.id}`,
        { code: true }
      )})\n` +
      `**Duration:** ${formattedTime}\n` +
      `**Reason:** ${reason}\n`
  );
}

async function mutedCheck(interaction, guild, target) {
  let check = false;
  const targetMember = await guild.members.fetch(target.id);
  // check if user is already muted
  if (targetMember.roles.cache.some((role) => role.name === 'MUTE')) {
    check = await interaction.reply({
      content: `${target} is already muted.`,
      ephemeral: true,
    });
  }

  return check;
}
