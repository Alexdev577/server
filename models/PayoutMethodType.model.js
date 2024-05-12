const mongoose = require("mongoose");

const PayoutMethodTypeSchema = new mongoose.Schema({
  name: String,
});

module.exports = mongoose.model("PayoutMethodType", PayoutMethodTypeSchema);
