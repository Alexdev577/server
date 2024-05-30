// require
const express = require("express");
const Advertizer = require("../../models/Advertiser.model");
const { cleanName } = require("../../utilities/dataCleaning");
const auth = require("../../middleware/auth");
const router = express.Router();

// new traffic type creation
router.post("/", auth(["ADMIN"]), async (req, res) => {
  const { name } = req.body;
  const advertiser = name && cleanName(name);

  // check type with the same name
  const exists = await Advertizer.findOne({
    name: {
      $regex: advertiser,
      $options: "i",
    },
  });
  if (exists) {
    return res.status(400).json({ message: "Item already exists!" });
  }

  const newAdvertiser = new Advertizer({
    name: advertiser.charAt(0).toUpperCase() + advertiser.slice(1),
  });

  await newAdvertiser.save();

  return res.status(200).json({
    message: "Item created successfully!",
  });
});

// get all traffic types
router.get("/", auth(["ADMIN", "MANAGER", "USER"]), async (req, res) => {
  try {
    const data = await Advertizer.find().sort({
      name: 1,
    });

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: err?.message });
  }
});

// delete traffic type
router.delete("/:id", auth(["ADMIN"]), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await Advertizer.findOneAndDelete({ _id: id });
    if (!result) {
      return res.status(404).json({ message: "Advertiser not found!" });
    }

    res.status(200).json({
      message: "Item successfully deleted!",
    });
  } catch (error) {
    res.status(500).json({ message: error?.message });
  }
});

module.exports = router;
