const User = require('../schemas/user_test');

const mongoose = require('mongoose');

findUser = async (guildId, userId) => {
  return await User.findOne({ guildId: guildId, userId: userId });
};

findAndCreateUser = async (guildId, userId) => {
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
    { upsert: true, new: true }
  );
};

module.exports = { findUser, findAndCreateUser };
