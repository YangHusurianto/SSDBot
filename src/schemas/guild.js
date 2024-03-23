const { Schema, model } = require('mongoose');

const guildSchema = new Schema({
  _id: Schema.Types.ObjectId,
  guildId: String,
  guildName: String,
  guildIcon: String,
  caseNumber: Number,
  loggingChannel: String,
  autoTags: { type: Map, of: String },
  channelTags: { type: Map, of: String },
  settings: { type: Map, of: String },
});

module.exports = model('Guild', guildSchema, "guilds");