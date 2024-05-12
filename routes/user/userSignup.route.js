// require
const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../../models/User.model");
const { cleanName, cleanEmail, cleanUrl } = require("../../utilities/dataCleaning");
const Notification = require("../../models/Notification.model");
const { sendEmail } = require("../../utilities/mailer");

// router
const router = express.Router();

// unexpected get api response
router.get("/", (req, res, next) => {
  if (!cleanUrl(req.originalUrl)) {
    return res.status(400).json({ message: "Bad request" });
  }
  return res.status(400).json({ message: "Not applicable" });
});

// new user registration
router.post("/", (req, res) => {
  const userData = req.body;

  User.findOne({
    $or: [{ email: userData?.email }, { userName: userData?.userName }],
  }).then((result) => {
    // console.log(result);
    if (!result) {
      bcrypt.hash(userData?.password, 10, async (err, hash) => {
        if (err) {
          return res.status(500).json({
            message: "an error occured while generating password hash",
          });
        }
        const lastUser = await User.find().sort({ _id: -1 }).limit(1);

        const token = await generateHashToken(userData?.email && cleanEmail(userData?.email)).catch(
          (err) => console.log(err)
        );

        const user = new User({
          ...userData,
          userId: (parseInt(lastUser[0]?.userId ?? 0) + 1).toString().padStart(4, "0"),
          name: userData?.name && cleanName(userData?.name),
          email: userData?.email && cleanEmail(userData?.email),
          userName: userData?.userName && cleanName(userData?.userName),
          password: hash,
          verificationToken: token,
          verificationTokenExpiry: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
        });
        user
          .save()
          .then(async (result) => {
            if (token) {
              sendEmail({
                email: result?.email,
                name: result?.name,
                token,
                emailType: "verify-email",
              })
                .then((response) => {
                  console.log("Mail sent:", response);
                })
                .catch((error) => {
                  console.error("Mail error:", error);
                });
            }

            // admins action log
            await Notification.create({
              targetRole: "ADMIN",
              heading: `New user registration ${result?.name}`,
              type: "user_registration",
              link: `/users/${result?._id}`,
            });

            return res.status(200).json({
              message: "User registered. Verification code has been sent to your email.",
            });
          })
          .catch((err) => {
            return res.status(500).json({ message: err?.message });
          });
      });
    } else {
      return res.status(400).json({ message: "User already exist!" });
    }
  });
});

// generate an unique user Id
// const generateUserId = async () => {
//   const now = new Date();
//   const year = now.getFullYear().toString().slice(2, 4).padStart(2, "0");
//   const month = (now.getMonth() + 1).toString().padStart(2, "0"); // Months are 0-based
//   const day = now.getDate().toString().padStart(2, "0");
//   const hour = now.getHours().toString().padStart(2, "0");
//   const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

//   //get the user count for current month
//   const userCount = await User.countDocuments({
//     createdAt: {
//       $gte: startOfThisMonth,
//       $lte: now,
//     },
//   });

//   // Combine month, day, hour, price and user count of the day
//   const uniqueID = `${year}${month}${day}${hour}${(userCount + 1).toString().padStart(4, "0")}`;
//   return uniqueID;
// };

module.exports = router;
