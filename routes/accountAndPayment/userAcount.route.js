const express = require("express");
const AffiliationClick = require("../../models/AffiliationClick.model");
const UserAccount = require("../../models/UserAccount.model");
const User = require("../../models/User.model");
const auth = require("../../middleware/auth");
const InvoiceRequest = require("../../models/InvoiceRequest.model");

const { ObjectId } = require("mongodb");

const router = express.Router();

// get and update account data
router.get("/", auth(["USER"]), async (req, res) => {
  try {
    const totalRevenuePipeline = [
      {
        $match: {
          userInfo: new ObjectId(req?.user?._id),
          lead: 1,
          status: "approved",
        },
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: { $multiply: ["$price", "$lead"] } },
        },
      },
      {
        $project: {
          _id: 0,
          revenue: 1,
        },
      },
    ];
    const pendingRevenuePipeline = [
      {
        $match: {
          userInfo: new ObjectId(req?.user?._id),
          lead: 1,
          status: "pending",
        },
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: { $multiply: ["$price", "$lead"] } },
        },
      },
      {
        $project: {
          _id: 0,
          revenue: 1,
        },
      },
    ];
    //------------- get account data -----------------//
    const totalRevenueData = await AffiliationClick.aggregate(totalRevenuePipeline);
    const pendingRevenueData = await AffiliationClick.aggregate(pendingRevenuePipeline);

    const userData = await User.findById(req?.user?._id);
    if (!userData) {
      return res.status(404).json({ message: "User not found!" });
    }

    const accountExist = await UserAccount.findOne({ userOid: req?.user?._id });

    if (!accountExist) {
      await UserAccount.create({
        userOid: req?.user?._id,
        currentBalance: totalRevenueData?.[0]?.revenue,
        totalRevenue: totalRevenueData?.[0]?.revenue,
        pendingRevenue: pendingRevenueData?.[0]?.revenue,
      }).then(async (account) => {
        return res.status(200).json(account);
      });
    } else {
      accountExist.currentBalance =
        totalRevenueData?.[0]?.revenue -
        (accountExist?.totalWithdrawal + accountExist?.pendingWithdrawal);
      accountExist.totalRevenue = totalRevenueData?.[0]?.revenue;
      accountExist.pendingRevenue = pendingRevenueData?.[0]?.revenue;
      await accountExist.save();

      return res.status(200).json(accountExist);
    }
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
});

//upaate single invoice by user
router.patch("/payment-status", auth(["ADMIN"]), async (req, res) => {
  const data = req.body;

  try {
    const invoiceData = await InvoiceRequest.findOne({ invoiceId: data.invoiceId });
    if (!invoiceData) {
      return res.status(404).json({ message: "No invoice found!" });
    }

    invoiceData.paymentStatus = data?.status;
    const saveInvoice = await invoiceData.save();

    if (!saveInvoice) {
      return res.status(500).json({ message: "something went wrong!" });
    }
    //------------- update account data -----------------//
    const accountData = await UserAccount.findOne({ userOid: invoiceData?.userOid });
    if (data?.status === "approved") {
      accountData.pendingWithdrawal =
        parseInt(accountData?.pendingWithdrawal) - parseInt(invoiceData?.paymentAmount);
      accountData.totalWithdrawal =
        parseInt(accountData?.totalWithdrawal) + parseInt(invoiceData?.paymentAmount);
      await accountData.save();
    } else {
      accountData.pendingWithdrawal =
        parseInt(accountData?.pendingWithdrawal) + parseInt(invoiceData?.paymentAmount);
      accountData.totalWithdrawal =
        parseInt(accountData?.totalWithdrawal) - parseInt(invoiceData?.paymentAmount);
      await accountData.save();
    }

    res.status(200).json({
      message: "payment status updated!",
    });
  } catch (err) {
    res.status(500).json({ message: err?.message });
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
