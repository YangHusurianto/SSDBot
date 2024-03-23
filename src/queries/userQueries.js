const User = require('../schemas/user_test');

const mongoose = require('mongoose');

getRecentByModerator = async (guildId, userId, timeLimit, type) => {
  const afterDate = new Date();
  afterDate.setDate(afterDate.getDate() - timeLimit);

  return await User.aggregate([
    { $match: { guildId: guildId } },
    { $unwind: '$infractions' },
    {
      $match: {
        'infractions.date': { $gte: afterDate },
        'infractions.type': type,
        'infractions.moderatorUserId': userId,
      },
    },
    { $project: { _id: 0, infractions: '$infractions' } },
  ]);
};

getRecentByUser = async (guildId, userId, timeLimit) => {
  const afterDate = new Date();
  afterDate.setDate(afterDate.getDate() - timeLimit);

  return await User.aggregate([
    { $match: { guildId: guildId, userId: userId } },
    { $unwind: '$infractions' },
    { $match: { 'infractions.date': { $gte: afterDate } } },
    { $project: { _id: 0, infractions: '$infractions' } },
  ]);
};

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

module.exports = {
  getRecentByModerator,
  getRecentByUser,
  findUser,
  findAndCreateUser,
};
