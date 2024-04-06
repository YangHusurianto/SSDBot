import User from '../schemas/user.js';

import mongoose from 'mongoose';

export async function getRecentByModerator(guildId, userId, timeLimit, type) {
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
}

export async function getRecentByUser(guildId, userId, timeLimit) {
  const afterDate = new Date();
  afterDate.setDate(afterDate.getDate() - timeLimit);

  return await User.aggregate([
    { $match: { guildId: guildId, userId: userId } },
    { $unwind: '$infractions' },
    { $match: { 'infractions.date': { $gte: afterDate } } },
    { $project: { _id: 0, infractions: '$infractions' } },
  ]);
}

export async function findUser(guildId, userId) {
  return await User.findOne({ guildId: guildId, userId: userId });
}

export async function findAndCreateUser(guildId, userId) {
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
        roles: [],
      },
    },
    { upsert: true, new: true }
  );
}

export async function getMutedUsers() {
  return await User.aggregate([
    { $match: { muted: true } },
    { $unwind: '$infractions' },
    { $sort: { 'infractions.date': -1 } },
    { $limit: 1 },
    {
      $match: {
        $or: [{ 'infractions.type': 'MUTE' }, { 'infractions.type': 'UNMUTE' }],
        $lte: [
          {
            $add: ['$infractions.date', { $toInt: '$infractions.duration' }],
          },
          new Date(),
        ],
      },
    },
  ]);
}
