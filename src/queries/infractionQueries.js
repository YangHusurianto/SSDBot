const User = require('../schemas/user_test');

const updateInfraction = async (guildId, infractionNumber, reason, notes) => {
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
};

const findInfraction = async (guildId, infractionNumber) => {
  try {
    return await User.findOne({
      guildId: guildId,
      'infractions.number': infractionNumber,
    });
  } catch (error) {
    console.error(error);
  }
};

module.exports = { updateInfraction, findInfraction };
