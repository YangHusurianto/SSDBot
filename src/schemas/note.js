import { Schema } from 'mongoose';

export const noteSchema = new Schema({
  _id: Schema.Types.ObjectId,
  guildId: String,
  targetUserId: String,
  noteNumber: Number,
  note: String,
  noteDate: Date,
  moderatorUserId: String,
});
