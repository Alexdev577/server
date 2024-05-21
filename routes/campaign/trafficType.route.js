// require
const express = require("express");
const TrafficType = require("../../models/TrafficType.model");
const { cleanName } = require("../../utilities/dataCleaning");
const auth = require("../../middleware/auth");
const router = express.Router();

// new traffic type creation
router.post("/", auth(["ADMIN"]), async (req, res) => {
  const { name } = req.body;
  const trafficType = name && cleanName(name);

  // check type with the same name
  const exists = await TrafficType.findOne({
    name: {
      $regex: trafficType,
      $options: "i",
    },
  });
  if (exists) {
    return res.status(400).json({ message: "Item already exists!" });
  }

  const singleType = new TrafficType({
    name: trafficType.charAt(0).toUpperCase() + trafficType.slice(1),
  });

  await singleType.save();

  return res.status(200).json({
    message: "Item created successfully!",
  });
});

// get all traffic types
router.get("/", async (req, res) => {
  try {
    const allTypes = await TrafficType.find().sort({
      name: 1,
    });

    res.status(200).json({
      data: allTypes,
    });
  } catch (err) {
    res.status(500).json({ message: err?.message });
  }
});

// delete traffic type
router.delete("/:id", auth(["ADMIN"]), async (req, res) => {
  const { id } = req.params;
  try {
    const exists = await TrafficType.findById(id);
    if (!exists) {
      return res.status(404).json({ message: "Item not found!" });
    }
    const result = await TrafficType.findOneAndDelete({ _id: id });

    res.status(200).json({
      result,
      message: "Item successfully deleted!",
    });
  } catch (error) {
    res.status(500).json({ message: error?.message });
  }
});

module.exports = router;
