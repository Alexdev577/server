const User = require("../../models/User.model");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const auth = require("../../middleware/auth");
const { sendEmail } = require("../../utilities/mailer");

//Update User by admin or manager
router.patch("/admin/:id", auth(["MANAGER", "ADMIN"]), async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    // Find the user by id and exclude the password field
    const user = await User.findById(id);
    // check if the user exists
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }
    if (!user?.isVerified) {
      return res.status(400).json({ message: "Account is not verified yet!" });
    }
    // check if the required fields are present
    if (!updateData?.email || !updateData?.userName) {
      return res.status(400).json({
        message: !updateData?.email ? "Email is required" : "Username is required",
      });
    }
    // check if user already exists with the specified email or username, excluding the current user
    const haveUserWithEmail = await User.findOne({
      $and: [{ email: updateData?.email }, { _id: { $ne: id } }],
    });

    if (haveUserWithEmail) {
      return res.status(400).json({ message: "Email already in use!" });
    }

    const haveUserWithUsername = await User.findOne({
      $and: [{ userName: updateData?.userName }, { _id: { $ne: id } }],
    });

    if (haveUserWithUsername) {
      return res.status(400).json({ message: "Username already in use!" });
    }
    if (!updateData?.manager) {
      return res.status(400).json({ message: "Please affiliate with a manager!" });
    }

    // update user information with password //
    if (updateData?.password) {
      bcrypt.hash(updateData?.password, 10, async (err, hash) => {
        if (err) {
          return res.status(500).json({
            message: "an error occured while generating hash",
          });
        }
        updateData.password = hash;

        await User.findOneAndUpdate({ _id: id }, updateData, {
          upsert: false,
        });
        // send mail if status changed //
        if (updateData?.status !== user?.status) {
          sendEmail({
            name: user?.name,
            email: user?.email,
            emailType: "acount-status",
            accountStatus: updateData?.status,
          })
            .then((res) => console.log("mail res", res))
            .catch((err) => console.log("mail err", err));
        }

        return res.status(200).json({
          message: "User updated successfully!",
        });
      });
    }
    // update user information without password //
    if (!updateData?.password) {
      await User.findOneAndUpdate(
        { _id: id },
        { ...updateData, password: user?.password },
        {
          upsert: false,
        }
      );
      // send mail if status changed //
      if (updateData?.status !== user?.status) {
        sendEmail({
          name: user?.name,
          email: user?.email,
          emailType: "acount-status",
          accountStatus: updateData?.status,
        })
          .then((res) => console.log("mail res", res))
          .catch((err) => console.log("mail err", err));
      }

      return res.status(200).json({
        message: "User updated successfully!",
      });
    }
  } catch (error) {
    res.status(500).json({ message: error?.message });
  }
});

//Update User by user
router.patch("/user/:id", auth(["USER"]), async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    // Find the user by id and exclude the password field
    const user = await User.findById(id);
    // check if the user exists
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }
    // // check if the required fields are present
    if (!updateData?.email || !updateData?.userName) {
      return res.status(400).json({
        message: !updateData?.email ? "Email is required" : "Username is required",
      });
    }
    // check if user already exists with the specified email or username, excluding the current user
    const haveUserWithEmail = await User.findOne({
      $and: [{ email: updateData?.email }, { _id: { $ne: id } }],
    });

    if (haveUserWithEmail) {
      return res.status(400).json({ message: "Email already in use!" });
    }

    const haveUserWithUsername = await User.findOne({
      $and: [{ userName: updateData?.userName }, { _id: { $ne: id } }],
    });

    if (haveUserWithUsername) {
      return res.status(400).json({ message: "Username already in use!" });
    }

    if (updateData?.newPassword) {
      bcrypt.compare(updateData?.currentPassword, user?.password, (err, result) => {
        if (err) {
          return res.status(500).json({
            message: "An error occurred",
          });
        }

        if (!result) {
          return res.status(401).json({ message: "Invalid current password" });
        }

        bcrypt.hash(updateData?.newPassword, 10, async (err, hash) => {
          if (err) {
            return res.status(500).json({
              message: "an error occured while generating hash",
            });
          }
          updateData.password = hash;

          const result = await User.findOneAndUpdate({ _id: id }, updateData, {
            upsert: true,
            new: true,
          }).select("-password");

          return res.status(200).json({
            result,
            message: "User updated successfully!",
          });
        });
      });
    }
    if (!updateData?.newPassword) {
      const result = await User.findOneAndUpdate({ _id: id }, updateData, {
        upsert: true,
        new: true,
      }).select("-password");

      return res.status(200).json({
        result,
        message: "User updated successfully!",
      });
    }
  } catch (error) {
    res.status(500).json({ message: error?.message });
  }
});

module.exports = router;
