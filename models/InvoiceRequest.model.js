const mongoose = require("mongoose");

const invoiceRequestSchema = new mongoose.Schema(
  {
    userOid: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    paymentAmount: Number,
    invoiceId: String,
    details: [],
    activityStatus: { type: String, default: "pending" },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("InvoiceRequest", invoiceRequestSchema);
