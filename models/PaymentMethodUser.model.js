const mongoose = require("mongoose");

const paymentMethodUserSchema = new mongoose.Schema(
  {
    userOid: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    userId: String,
    userName: String,
    paymentMethod: String,
    email: String,
    manager: {
      type: mongoose.Types.ObjectId,
      ref: "Manager",
    },
    cryptoType: String,
    cryptoAddress: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("PaymentMethodUser", paymentMethodUserSchema);
