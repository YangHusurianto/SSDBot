const User = require('../schemas/user_test');

const mongoose = require('mongoose');

findUser = async (guildId, userId, upsert) => {
  return await User.findOneAndUpdate(
    { userId: userId, guildId: guildId },
    {
      $setOnInsert: {
        _id: new mongoose.Types.ObjectId(),
        userId: userId,
        guildId: guildId,
        verified: false,
        verifiedBy: '',
        notes: [],
        infractions: [],
      },
    },
    { upsert: upsert, new: true }
  );
};

module.exports = findUser;
