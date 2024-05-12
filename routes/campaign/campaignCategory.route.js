// require
const express = require("express");
const CampaignCategory = require("../../models/CampaignCategory.model");
const { cleanName } = require("../../utilities/dataCleaning");
const auth = require("../../middleware/auth");
const router = express.Router();

// new category creation
router.post("/", auth(["ADMIN"]), async (req, res) => {
  const { name } = req.body;

  const CategoryName = name && cleanName(name);

  // check manager with same email
  const exists = await CampaignCategory.findOne({
    name: {
      $regex: CategoryName,
      $options: "i",
    },
  });
  if (exists) {
    return res.status(400).json({ message: "Category already exists!" });
  }

  const category = new CampaignCategory({
    name: CategoryName.charAt(0).toUpperCase() + CategoryName.slice(1),
  });

  category.save();

  return res.status(200).json({
    message: "Category created successfully!",
  });
});

// get all campaign category
router.get("/", async (req, res) => {
  try {
    const allCategories = await CampaignCategory.find().sort({
      name: 1,
    });

    res.status(200).json({
      data: allCategories,
    });
  } catch (err) {
    res.status(500).json({ message: err?.message });
  }
});

// delete category
router.delete("/:id", auth(["ADMIN"]), async (req, res) => {
  const { id } = req.params;
  try {
    const exists = await CampaignCategory.findById(id);

    if (!exists) {
      return res.status(404).json({ message: "Category not found!" });
    }
    const result = await CampaignCategory.findOneAndDelete({ _id: id });

    res.status(200).json({
      result,
      message: "Category successfully deleted!",
    });
  } catch (error) {
    res.status(500).json({ message: error?.message });
  }
});

module.exports = router;
