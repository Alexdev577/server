// require
const express = require("express");
const ConversionType = require("../../models/ConversionType.model");
const { cleanName } = require("../../utilities/dataCleaning");
const auth = require("../../middleware/auth");
const router = express.Router();

// new conversion type creation
router.post("/", auth(["ADMIN"]), async (req, res) => {
  const { name } = req.body;

  const conversionType = name && cleanName(name);

  // check type with the same name
  const exists = await ConversionType.findOne({
    name: {
      $regex: conversionType,
      $options: "i",
    },
  });
  if (exists) {
    return res.status(400).json({ message: "Item already exists!" });
  }

  const singleType = new ConversionType({
    name: conversionType.charAt(0).toUpperCase() + conversionType.slice(1),
  });

  await singleType.save();

  return res.status(200).json({
    message: "Item created successfully!",
  });
});

// get all conversion types
router.get("/", auth(["ADMIN", "MANAGER", "USER"]), async (req, res) => {
  try {
    const allTypes = await ConversionType.find().sort({
      name: 1,
    });

    res.status(200).json(allTypes);
  } catch (err) {
    res.status(500).json({ message: err?.message });
  }
});

// delete conversion type
router.delete("/:id", auth(["ADMIN"]), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await ConversionType.findOneAndDelete({ _id: id });

    if (!result) {
      return res.status(404).json({ message: "Conversion type not found!" });
    }

    res.status(200).json({
      message: "Item successfully deleted!",
    });
  } catch (error) {
    res.status(500).json({ message: error?.message });
  }
});

module.exports = router;
