const Manager = require("../../models/Manager.model");
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const bcrypt = require("bcrypt");

//* Update User
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    // Find the manager by id field
    const user = await Manager.findById(id);
    // check if the user exists
    if (!user) {
      return res.status(404).json({ message: "Manager not found!" });
    }
    if (user.role === "ADMIN") {
      return res.status(401).json({ message: "Unauthorized!" });
    }

    // check if the required fields are present
    if (!updateData?.email || !updateData?.userName) {
      return res.status(400).json({
        message: !updateData?.email ? "Email is required" : "Username is required",
      });
    }
    // check if user already exists with the specified email or username, excluding the current user
    const haveUserWithEmail = await Manager.findOne({
      $and: [{ email: updateData?.email }, { _id: { $ne: id } }],
    });

    if (haveUserWithEmail) {
      return res.status(400).json({ message: "Email already in use!" });
    }

    const haveUserWithUsername = await Manager.findOne({
      $and: [{ userName: updateData?.userName }, { _id: { $ne: id } }],
    });

    if (haveUserWithUsername) {
      return res.status(400).json({ message: "Username already in use!" });
    }

    if (updateData?.password) {
      bcrypt.hash(updateData?.password, 10, async (err, hash) => {
        if (err) {
          return res.status(500).json({
            message: "an error occured while generating hash",
          });
        }
        updateData.password = hash;

        const result = await Manager.findOneAndUpdate({ _id: id }, updateData, {
          upsert: false,
          new: true,
        }).select("-password");

        return res.status(200).json({
          result,
          message: "Manager updated successfully!",
        });
      });
    }
    if (!updateData?.password) {
      updateData.password = user?.password;
      const result = await Manager.findOneAndUpdate({ _id: id }, updateData, {
        upsert: false,
        new: true,
      }).select("-password");

      return res.status(200).json({
        result,
        message: "Manager updated successfully!",
      });
    }
  } catch (error) {
    res.status(500).json({ message: error?.message });
  }
});

module.exports = router;
