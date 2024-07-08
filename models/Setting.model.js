const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema(
  {
    trackerURL: String,
    topCampaignFlag: String,
    dayToWithdraw: Number,
    dateToWithdraw: [String],
    minWithdrawBalance: Number,
    invoiceFlag: Boolean,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Setting", settingSchema);
