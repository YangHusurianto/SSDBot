const { Schema, model } = require('mongoose');
const { userSchema } = require('./user');

const guildSchema = new Schema({
  _id: Schema.Types.ObjectId,
  guildId: String,
  guildName: String,
  guildIcon: String,
  caseNumber: Number,
  users: { type: [userSchema], default: [] },
  autoTags: { type: Map, of: String }
});

module.exports = model('Guild', guildSchema, "guilds");