const Manager = require("../../models/Manager.model");
const express = require("express");
const mongoose = require("mongoose");
const auth = require("../../middleware/auth");
const router = express.Router();

//* Delete User

router.delete("/:id", auth(["ADMIN"]), async (req, res) => {
  const { id } = req.params;
  try {
    // Find the user by id and exclude the password field
    const user = await Manager.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }
    if (user.role === "ADMIN") {
      return res.status(401).json({ message: "Unauthorized!" });
    }

    const result = await Manager.findOneAndDelete({ _id: id }).select("-password");

    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ message: error?.message });
  }
});

module.exports = router;
