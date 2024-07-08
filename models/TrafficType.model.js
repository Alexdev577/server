const mongoose = require("mongoose");

const trafficTypeSchema = new mongoose.Schema({
  name: String,
});

module.exports = mongoose.model("TrafficType", trafficTypeSchema);
