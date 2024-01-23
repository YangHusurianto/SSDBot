const { Schema, model } = require("mongoose");

const noteSchema = new Schema({
  _id: Schema.Types.ObjectId,
  guildId: String,
  targetUserId: String,
  noteNumber: Number,
  note: String,
  noteDate: Date,
  moderatorUserId: String,
});

module.exports = { noteSchema }