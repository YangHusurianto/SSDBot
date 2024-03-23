const User = require('../schemas/user_test');

findInfraction = async (guildId, infractionNumber) => {
  try {
    return await User.findOne({
        guildId: guildId,
       'infractions.number': infractionNumber,
      });
  } catch (error) {
    console.error(error);
  }
};

module.exports = findInfraction;