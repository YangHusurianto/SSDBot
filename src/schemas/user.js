import { infractionSchema } from './infraction.js';
import { noteSchema } from './note.js';

import { Schema, model } from 'mongoose';

const userSchema = new Schema({
  _id: Schema.Types.ObjectId,
  userId: String,
  guildId: String,
  verified: Boolean,
  verifiedBy: String,
  notes: [noteSchema],
  infractions: [infractionSchema],
  roles: [String],
  muted: Boolean,
});

export default model('User', userSchema, 'users');
