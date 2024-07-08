const mongoose = require("mongoose");

const campaignCategorySchema = new mongoose.Schema({
  name: String,
});

module.exports = mongoose.model("CampaignCategory", campaignCategorySchema);
