const { Schema, model } = require("mongoose");

const warnSchema = new Schema({
  _id: Schema.Types.ObjectId,
  guildId: String,
  targetUserId: String,
  warnNumber: Number,
  warnReason: String,
  warnDate: Date,
  moderatorUserId: String,
  moderatorNotes: String
});

// let Warn = model("warningSchema", warnSchema, "userWarns");
// module.exports = { Warn, warnSchema }
module.exports = { warnSchema }