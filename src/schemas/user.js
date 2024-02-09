const { Schema, model } = require('mongoose');
const { infractionSchema } = require('./infraction');
const { noteSchema } = require('./note');

const userSchema = new Schema({
  _id: Schema.Types.ObjectId,
  userId: String,
  verified: Boolean,
  verifiedBy: String,
  notes: [noteSchema],
  infractions: [infractionSchema]
});

module.exports = { userSchema }