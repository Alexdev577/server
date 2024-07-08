const mongoose = require("mongoose");

const conversionTypeSchema = new mongoose.Schema({
  name: String,
});

module.exports = mongoose.model("ConversionType", conversionTypeSchema);
