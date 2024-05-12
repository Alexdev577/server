// require
const express = require("express");
const bcrypt = require("bcrypt");
const Manager = require("../../models/Manager.model");
const { cleanName, cleanEmail, cleanUrl } = require("../../utilities/dataCleaning");
const Notification = require("../../models/Notification.model");

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
router.post("/", async (req, res) => {
  const managerData = req.body;

  // check manager with same email
  const haveUserWithEmail = await Manager.findOne({
    email: managerData?.email,
  });
  if (haveUserWithEmail) {
    return res.status(400).json({ message: "Email already in use!" });
  }
  // check manager with same username
  const haveUserWithUsername = await Manager.findOne({
    userName: managerData?.userName,
  });
  if (haveUserWithUsername) {
    return res.status(400).json({ message: "Username already in use!" });
  }

  // encode the password and save manager information
  bcrypt.hash(managerData?.password, 10, async (err, hash) => {
    if (err) {
      return res.status(500).json({
        message: "an error occured while generating password hash",
      });
    }

    const managerId = await generateManagerId();
    const manager = new Manager({
      ...managerData,
      managerId,
      name: managerData?.name && cleanName(managerData?.name),
      email: managerData?.email && cleanEmail(managerData?.email),
      userName: managerData?.userName && cleanName(managerData?.userName),
      password: hash,
    });

    manager
      .save()
      .then(async (result) => {
        // admins action log
        await Notification.create({
          targetRole: "ADMIN",
          heading: `Appointed ${result?.name} as Manager`,
          type: "manager_registration",
          link: "/affiliateManager",
        });

        return res.status(200).json({
          message: "Manager registration successful!",
        });
      })
      .catch((err) => {
        return res.status(500).json({ message: err?.message });
      });
  });
});

// generate an unique user Id
const generateManagerId = async () => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(2, 4).padStart(2, "0");
  const month = (now.getMonth() + 1).toString().padStart(2, "0"); // Months are 0-based
  const day = now.getDate().toString().padStart(2, "0");
  const hour = now.getHours().toString().padStart(2, "0");
  // const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  //get the manager count
  const managerCount = await Manager.countDocuments();
  // const managerCount = await Manager.countDocuments({
  //   createdAt: {
  //     $gte: startOfThisMonth,
  //     $lte: now,
  //   },
  // });

  // Combine month, day, hour, price and order count of the day
  const uniqueID = `${year}${month}${day}${hour}${(managerCount + 1).toString().padStart(4, "0")}`;
  return uniqueID;
};

module.exports = router;
