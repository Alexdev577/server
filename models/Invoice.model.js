const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    invoiceId: String,
    userOid: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    paymentAmount: Number,
    paymentStatus: { type: String, default: "pending" },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Invoice", invoiceSchema);
