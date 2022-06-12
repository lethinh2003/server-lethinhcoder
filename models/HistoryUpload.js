const mongoose = require("mongoose");

const HistoryUploadSchema = new mongoose.Schema({
  account: {
    type: String,
  },
  link: {
    type: String,
  },
  createdAt: {
    type: String,
    default: () => new Date().toISOString(),
  },
});

const HistoryUpload = mongoose.models.HistoryUpload || mongoose.model("HistoryUpload", HistoryUploadSchema);
module.exports = HistoryUpload;
