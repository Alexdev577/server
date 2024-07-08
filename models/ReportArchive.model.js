const mongoose = require("mongoose");

const reportArchiveSchema = new mongoose.Schema(
  {
    userId: String,
    userName: String,
    manager: {
      type: mongoose.Types.ObjectId,
      ref: "Manager",
    },
    month: String,
    click: Number,
    uniqueClick: Number,
    lead: Number,
    revenue: Number,
    epc: Number,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ReportArchive", reportArchiveSchema);
