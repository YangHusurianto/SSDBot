import User from '../schemas/user.js';

export async function updateInfraction(
  guildId,
  infractionNumber,
  reason,
  notes
) {
  try {
    let UserDoc = await User.findOne({
      guildId: guildId,
      'infractions.number': infractionNumber,
    });

    if (!UserDoc) {
      return null;
    }

    if (!reason) reason = UserDoc.infractions.reason;
    if (!notes) notes = UserDoc.infractions.moderatorNotes;

    return await User.findOneAndUpdate(
      {
        guildId: guildId,
        'infractions.number': infractionNumber,
      },
      {
        $set: {
          'infractions.$.reason': reason,
          'infractions.$.moderatorNotes': notes,
        },
      },
      { new: true }
    );
  } catch (error) {
    console.error(error);
  }
}

export async function removeInfraction(userId, guildId, infractionNumber) {
  try {
    return await User.findOneAndUpdate(
      { userId: userId, guildId: guildId },
      {
        $pull: {
          infractions: { number: infractionNumber },
        },
      }
    );
  } catch (error) {
    console.error(error);
  }
}

export async function findInfraction(guildId, infractionNumber) {
  try {
    return await User.findOne({
      guildId: guildId,
      'infractions.number': infractionNumber,
    });
  } catch (error) {
    console.error(error);
  }
}
