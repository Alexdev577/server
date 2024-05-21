const User = require("../../models/User.model");
const express = require("express");
const bcrypt = require("bcrypt");
const auth = require("../../middleware/auth");
const { cleanEmail } = require("../../utilities/dataCleaning");
const { sendEmail } = require("../../utilities/mailer");
const { generateHashToken } = require("../../utilities/mailHelper");
const router = express.Router();

//* Delete User
router.delete("/delete/:id", auth("ADMIN"), async (req, res) => {
  const { id } = req.params;
  try {
    // Find the user by id
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await User.findOneAndDelete({ _id: id });

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error?.message });
  }
});

//* send verification code and token
router.post("/send-verification-link/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User doesn't exist!" });
    }
    if (user?.isVerified) {
      return res.status(400).json({ message: "Your account is arleady verified!" });
    }

    const token = await generateHashToken(user?.email && cleanEmail(user?.email)).catch((err) =>
      console.log(err)
    );

    if (token) {
      sendEmail({
        email: user?.email,
        name: user?.name,
        token,
        emailType: "verify-email",
      })
        .then(async (response) => {
          // console.log("Mail sent:", response);
          user.verificationToken = token;
          user.verificationTokenExpiry = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);

          await user.save();

          return res.status(200).json({ message: `Link has been sent to "${user?.email}"` });
        })
        .catch((error) => {
          // console.error("Mail error:", error);
          return res.status(400).json({ message: "Couldn't sent link! try again" });
        });
    } else {
      return res.status(500).json({ message: "Couldn't sent link! try again" });
    }
  } catch (error) {
    res.status(500).json({ message: error?.message });
  }
});

//* verify email
router.patch("/verify-email/:id", async (req, res) => {
  const { id } = req.params;
  const { token } = req.body;

  console.log(id, token);

  try {
    // Find the user by id
    const user = await User.findOne({
      _id: id,
      verificationToken: token,
    });

    if (!user) {
      return res.status(404).json({ message: "Wrong token or user doesn't exist!" });
    }
    if (user?.isVerified) {
      return res.status(200).json({ message: "Your account is arleady verified!" });
    }
    const now = new Date();
    const tokenExpiry = new Date(user?.verificationTokenExpiry);

    if (now > tokenExpiry) {
      return res.status(406).json({ message: "Verification token expired!" });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;

    await user.save();

    res.status(200).json({ message: "Account verified!" });
  } catch (error) {
    res.status(500).json({ message: error?.message });
  }
});

//* send verification code and token
router.post("/send-resetpass-link", async (req, res) => {
  const { email, userName } = req.body;

  try {
    const user = await User.findOne({ $or: [{ email }, { userName }] });

    if (!user) {
      return res.status(404).json({ message: "User doesn't exist!" });
    }

    const token = await generateHashToken(user?.email && cleanEmail(user?.email)).catch((err) =>
      console.log(err)
    );

    if (token) {
      sendEmail({
        email: user?.email,
        name: user?.name,
        token,
        emailType: "reset-password",
      })
        .then(async (response) => {
          // console.log("Mail sent:", response);
          user.forgotPassToken = token;
          user.forgotPassTokenExpiry = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);

          await user.save();

          return res.status(200).json({ message: `a link has been sent to "${user?.email}"` });
        })
        .catch((error) => {
          // console.error("Mail error:", error);
          return res.status(400).json({ message: "Couldn't sent link! try again" });
        });
    } else {
      return res.status(500).json({ message: "Couldn't sent link! try again", user });
    }
  } catch (error) {
    res.status(500).json({ message: error?.message });
  }
});

//* verify reset password token
router.post("/verify-resetpass-token", async (req, res) => {
  const { token } = req.body;

  try {
    // Find the user by id
    const user = await User.findOne({
      forgotPassToken: token,
    });

    if (!user) {
      return res.status(400).json({ message: "The token you provided is not correct." });
    }

    const now = new Date();
    const tokenExpiry = new Date(user?.verificationTokenExpiry);

    if (now > tokenExpiry) {
      return res.status(406).json({ message: "The token you provided is expired!" });
    }

    res.status(200).json({ message: "Token verified!" });
  } catch (error) {
    res.status(500).json({ message: error?.message });
  }
});

//* reset user password
router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    // Find the user by id
    const user = await User.findOne({
      forgotPassToken: token,
    });

    if (!user) {
      return res.status(400).json({ message: "The token you provided is not correct." });
    }

    const now = new Date();
    const tokenExpiry = new Date(user?.verificationTokenExpiry);

    if (now > tokenExpiry) {
      return res.status(406).json({ message: "The token you provided is expired!" });
    }

    // reset password
    bcrypt.hash(newPassword, 10, async (err, hash) => {
      if (err) {
        return res.status(500).json({
          message: "an error occured while generating password hash",
        });
      }
      user.password = hash;
      user.forgotPassToken = undefined;
      user.forgotPassTokenExpiry = undefined;

      await user.save();

      return res.status(200).json({ message: "Password changed" });
    });
  } catch (error) {
    res.status(500).json({ message: error?.message });
  }
});

module.exports = router;
