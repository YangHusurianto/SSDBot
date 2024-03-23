const { Schema, model } = require('mongoose');
const { infractionSchema } = require('./infraction');
const { noteSchema } = require('./note');

const user_testSchema = new Schema({
  _id: Schema.Types.ObjectId,
  userId: String,
  guildId: String,
  verified: Boolean,
  verifiedBy: String,
  notes: [noteSchema],
  infractions: [infractionSchema]
});

module.exports = model('User', user_testSchema, "users");