const mongoose = require("mongoose");

const advertiserSchema = new mongoose.Schema({
  name: String,
});

module.exports = mongoose.model("Advertiser", advertiserSchema);
