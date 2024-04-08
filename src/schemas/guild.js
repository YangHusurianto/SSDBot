import { Schema, model } from 'mongoose';

const guildSchema = new Schema({
  _id: Schema.Types.ObjectId,
  guildId: String,
  guildName: String,
  guildIcon: String,
  caseNumber: Number,
  autoTags: { type: Map, of: String },
  channelTags: { type: Map, of: String },
  settings: { type: Map, of: String },
});

export default model('Guild', guildSchema, 'guilds');
