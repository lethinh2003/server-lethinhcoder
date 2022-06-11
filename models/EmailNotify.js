const mongoose = require("mongoose");
const validator = require("validator");

const EmailNotifySchema = new mongoose.Schema({
  email: {
    type: String,
    tirm: true,
    required: [true, "Missing email"],
    validate: [validator.isEmail, "Email is not valid"],
  },
  createdAt: {
    type: String,
    default: () => new Date().toISOString(),
  },
});

const EmailNotify = mongoose.models.EmailNotify || mongoose.model("EmailNotify", EmailNotifySchema);
module.exports = EmailNotify;
