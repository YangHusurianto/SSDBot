const { Schema, model } = require('mongoose');
const { warnSchema } = require('./warn');
const { noteSchema } = require('./note');

const userSchema = new Schema({
  _id: Schema.Types.ObjectId,
  userId: String,
  verified: Boolean,
  verifiedBy: String,
  notes: [noteSchema],
  warns: [warnSchema]
});

module.exports = { userSchema }