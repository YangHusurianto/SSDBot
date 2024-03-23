const { user_testSchema } = require('../schemas/user_test');

const { mongoose, model } = require('mongoose');

findUser = async (guildId, userId) => {
  const userDoc = model('User', user_testSchema, `users-${guildId}`);

  return await userDoc.findOneAndUpdate(
    { userId: userId },
    {
      $setOnInsert: {
        _id: new mongoose.Types.ObjectId(),
        userId: userId,
        verified: false,
        verifiedBy: '',
        notes: [],
        infractions: [],
      },
    },
    { upsert: true, new: true }
  );
};

module.exports = findUser;
