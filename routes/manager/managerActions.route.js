// require
const express = require("express");
const bcrypt = require("bcrypt");
const Manager = require("../../models/Manager.model");
const { cleanName, cleanEmail, cleanUrl } = require("../../utilities/dataCleaning");
const Notification = require("../../models/Notification.model");
const auth = require("../../middleware/auth");

// router
const router = express.Router();

// unexpected get api response
router.get("/", (req, res) => {
  if (!cleanUrl(req.originalUrl)) {
    return res.status(400).json({ message: "Bad request" });
  }
  return res.status(400).json({ message: "Not applicable" });
});

// new user registration
router.post("/create", auth(["ADMIN"]), async (req, res) => {
  const managerData = req.body;

  const newName = managerData?.name && cleanName(managerData?.name);
  const newUserEmail = managerData?.email && cleanEmail(managerData?.email);
  const newUserName = managerData?.userName && cleanName(managerData?.userName.toLowerCase());

  // check manager with same email
  const haveUserWithEmail = await Manager.findOne({
    email: newUserEmail,
  });
  if (haveUserWithEmail) {
    return res.status(400).json({ message: "Email already in use!" });
  }
  // check manager with same username
  const haveUserWithUsername = await Manager.findOne({
    userName: newUserName,
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
      name: newName,
      email: newUserEmail,
      userName: newUserName,
      password: hash,
    });

    manager
      .save()
      .then(async (result) => {
        // notify manager
        await Notification.create({
          targetRole: "MANAGER",
          managerInfo: result?._id,
          heading: "Welcome, You are appointed as Manager",
          type: "manager_registration",
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

//* Update manager details
router.patch("/update/:id", auth(["ADMIN", "MANAGER"]), async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const newName = updateData?.name && cleanName(updateData?.name);
  const newUserEmail = updateData?.email && cleanEmail(updateData?.email);
  const newUserName = updateData?.userName && cleanName(updateData?.userName.toLowerCase());

  try {
    // Find the manager by id field
    const user = await Manager.findById(id);
    // check if the user exists
    if (!user) {
      return res.status(404).json({ message: "Manager not found!" });
    }
    if (req?.user?.role === "MANAGER" && req?.user?._id !== user?._id) {
      return res.status(404).json({ message: "Access denied!" });
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
      $and: [{ email: newUserEmail }, { _id: { $ne: id } }],
    });

    if (haveUserWithEmail) {
      return res.status(400).json({ message: "Email already in use!" });
    }

    const haveUserWithUsername = await Manager.findOne({
      $and: [{ userName: newUserName }, { _id: { $ne: id } }],
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

        const result = await Manager.findOneAndUpdate(
          { _id: id },
          {
            ...updateData,
            name: newName,
            email: newUserEmail,
            userName: newUserName,
            password: hash,
          },
          {
            upsert: false,
            new: true,
          }
        ).select("-password");

        return res.status(200).json({
          result,
          message: "Manager updated successfully!",
        });
      });
    }
    if (!updateData?.password) {
      const result = await Manager.findOneAndUpdate(
        { _id: id },
        {
          ...updateData,
          name: newName,
          email: newUserEmail,
          userName: newUserName,
          password: user?.password,
        },
        {
          upsert: false,
          new: true,
        }
      ).select("-password");

      return res.status(200).json({
        result,
        message: "Manager updated successfully!",
      });
    }
  } catch (error) {
    res.status(500).json({ message: error?.message });
  }
});

//* Delete managr
router.delete("/delete/:id", auth(["ADMIN"]), async (req, res) => {
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
