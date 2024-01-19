const { Schema, model } = require('mongoose');
const { warnSchema } = require('./warn');

const userSchema = new Schema({
  _id: Schema.Types.ObjectId,
  userId: String,
  userName: String,
  userNick: String,
  warns: [warnSchema]
});

// let User = model("userSchema", userSchema, "users");
// module.exports = { User, userSchema }
module.exports = { userSchema }