const express = require("express");
const AffiliationClick = require("../../models/AffiliationClick.model");
const UserAccount = require("../../models/UserAccount.model");
const User = require("../../models/User.model");
const auth = require("../../middleware/auth");
const InvoiceRequest = require("../../models/InvoiceRequest.model");

const { ObjectId } = require("mongodb");

const router = express.Router();

// get and update account data
router.get("/:id", auth(["USER", "ADMIN", "MANAGER"]), async (req, res) => {
  const { id } = req.params;
  try {
    const accountExist = await UserAccount.findOne({ userOid: id });

    if (!accountExist) {
      await UserAccount.create({
        userOid: req?.user?._id,
        currentBalance: 0,
        totalRevenue: 0,
        totalWithdrawal: 0,
        pendingWithdrawal: 0,
      }).then(async (account) => {
        return res.status(200).json(account);
      });
    } else {
      return res.status(200).json(accountExist);
    }
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
});

//get pending payment request
router.get("/pending-request", async (req, res) => {
  try {
    const requestCount = await InvoiceRequest.find({
      paymentStatus: { $eq: "pending" },
    }).countDocuments();

    return res.status(200).json({
      dataCount: requestCount,
    });
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
});

module.exports = router;
