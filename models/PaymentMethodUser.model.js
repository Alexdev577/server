const mongoose = require("mongoose");

const paymentMethodUserSchema = new mongoose.Schema(
  {
    userOid: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    userId: String,
    paymentMethod: String,
    email: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("PaymentMethodUser", paymentMethodUserSchema);
