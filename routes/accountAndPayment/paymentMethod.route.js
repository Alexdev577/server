// require
const express = require("express");
const PaymentMethodUser = require("../../models/PaymentMethodUser.model");
const PayoutMethodType = require("../../models/PayoutMethodType.model");
const auth = require("../../middleware/auth");
const { cleanName } = require("../../utilities/dataCleaning");
const router = express.Router();

// new payment method creation
router.post("/create-method", auth(["ADMIN"]), async (req, res) => {
  const { name } = req.body;
  const methodName = name && cleanName(name);

  const exists = await PayoutMethodType.findOne({ name: methodName });
  if (exists) {
    return res.status(400).json({ message: "This method already exists!" });
  }

  const method = new PayoutMethodType({
    name: methodName.charAt(0).toUpperCase() + methodName.slice(1),
  });
  await method.save();

  return res.status(200).json({
    message: "Payment mathod created!",
  });
});

// get all payment mehtod
router.get("/get-methods", auth(["USER", "MANAGER", "ADMIN"]), async (req, res) => {
  try {
    const allMethods = await PayoutMethodType.find().sort({
      name: 1,
    });

    res.status(200).json(allMethods);
  } catch (err) {
    res.status(500).json({ message: err?.message });
  }
});

// delete payout method
router.delete("/delete-method/:id", auth(["ADMIN"]), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await PayoutMethodType.findOneAndDelete({ _id: id });

    if (!result) {
      return res.status(404).json({ message: "Method not found!" });
    }
    res.status(200).json({
      result,
      message: "Method deleted successfully!",
    });
  } catch (error) {
    res.status(500).json({ message: error?.message });
  }
});

// get all user payout option data
router.get("/user-option", auth(["ADMIN", "MANAGER", "USER"]), async (req, res) => {
  try {
    const option = await PaymentMethodUser.find({});

    return res.status(200).json({
      data: option,
    });
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
});

//get single user payment option data
router.get("/user-option/:id", auth(["ADMIN", "MANAGER", "USER"]), async (req, res) => {
  const { id } = req.params;
  try {
    const userMethod = await PaymentMethodUser.findOne({ userId: id });

    if (!userMethod) {
      return res.status(404).json({ message: "Method not found!" });
    }

    res.status(200).json(userMethod);
  } catch (err) {
    res.status(500).json({ message: err?.message });
  }
});

// update payout option data by user auth(["USER"]),
router.patch("/user-option/:id", auth(["ADMIN", "MANAGER", "USER"]), async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  try {
    const method = await PayoutMethodType.findOne({ name: updateData?.paymentMethod });

    if (!method) {
      return res.status(404).json({ message: "This payment method is unavailable!" });
    }
    const result = await PaymentMethodUser.findOneAndUpdate({ userOid: id }, updateData, {
      upsert: true,
      new: true,
    });

    return res.status(200).json({
      result,
      message: "Payment method updated!",
    });
  } catch (error) {
    res.status(500).json({ message: error?.message });
  }
});

module.exports = router;
