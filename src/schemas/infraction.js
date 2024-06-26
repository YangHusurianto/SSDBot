import { Schema } from 'mongoose';

export const infractionSchema = new Schema({
  _id: Schema.Types.ObjectId,
  targetUserId: String,
  type: String,
  number: Number,
  reason: String,
  date: Date,
  duration: String,
  moderatorUserId: String,
  moderatorNotes: String,
});
