const { Schema, model } = require("mongoose");

const infractionSchema = new Schema({
  _id: Schema.Types.ObjectId,
  targetUserId: String,
  type: String,
  number: Number,
  reason: String,
  date: Date,
  moderatorUserId: String,
  moderatorNotes: String
});

module.exports = { infractionSchema }