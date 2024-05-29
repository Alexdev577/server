const express = require("express");
const Setting = require("../../models/Setting.model");
const createInvoiceRequest = require("../../utilities/createInvoiceRequest");
const InvoiceRequest = require("../../models/InvoiceRequest.model");
const WeeklyOfferwiseClick = require("../../models/WeeklyOfferwiseClick.model");
const AffiliationClick = require("../../models/AffiliationClick.model");
const AdAffiliationClick = require("../../models/AdAffiliationClick.model");
const Invoice = require("../../models/Invoice.model");
const UserAccount = require("../../models/UserAccount.model");
const Notification = require("../../models/Notification.model");

const auth = require("../../middleware/auth");
const { ObjectId } = require("mongodb");
const router = express.Router();

// create invoice-request on admin specified date
router.get("/create-invoice", auth(["ADMIN", "MANAGER"]), async (req, res) => {
  try {
    const setting = await Setting.findById(null);

    // const dayToWithdraw = setting?.dayToWithdraw;
    const dateToWithdraw = setting?.dateToWithdraw;
    const minWithdrawBalance = setting?.minWithdrawBalance;
    const invoiceFlag = setting?.invoiceFlag;

    // const invoice = await createInvoiceRequest(minWithdrawBalance);
    const today = new Date();
    if (dateToWithdraw.includes(today.getDate())) {
      if (invoiceFlag) {
        await createInvoiceRequest(minWithdrawBalance);

        setting.invoiceFlag = false;
        await setting.save();
        return res.status(200).json({
          message: "Invoice created",
        });
      } else {
        return res.status(200).json({ message: "No invoice created!" });
      }
    } else {
      if (!invoiceFlag) {
        setting.invoiceFlag = true;
        await setting.save();

        return res.status(200).json({
          message: "No invoice created!",
        });
      }
      return res.status(200).json({ message: "No invoice created!" });
    }
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
});

// get invoice-request list
router.get("/invoice-requests", auth(["ADMIN"]), async (req, res) => {
  try {
    const pipeline = [
      {
        $match: {},
      },
      {
        $lookup: {
          from: "users",
          localField: "userOid",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      {
        $lookup: {
          from: "weeklyofferwiseclicks",
          localField: "details",
          foreignField: "_id",
          as: "details",
        },
      },
      {
        $addFields: {
          userInfo: { $arrayElemAt: ["$userInfo", 0] },
          pendingPaymentCount: {
            $size: {
              $filter: {
                input: "$details",
                as: "detail",
                cond: { $eq: ["$$detail.paymentStatus", "unpaid"] },
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          name: "$userInfo.name",
          email: "$userInfo.email",
          paymentAmount: 1,
          invoiceId: 1,
          activityStatus: 1,
          pendingPaymentCount: 1,
          createdAt: 1,
        },
      },
    ];
    const invoiceRequest = await InvoiceRequest.aggregate(pipeline);

    res.status(200).json(invoiceRequest);
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
});

// get invoice-request details by id
router.get("/invoice-requests/:id", auth(["ADMIN"]), async (req, res) => {
  const { id } = req.params;
  try {
    const pipeline = [
      {
        $match: { invoiceId: id },
      },
      {
        $lookup: {
          from: "weeklyofferwiseclicks",
          localField: "details",
          foreignField: "_id",
          as: "details",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userOid",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      {
        $lookup: {
          from: "paymentmethodusers",
          localField: "userInfo.userId",
          foreignField: "userId",
          as: "paymentMethod",
        },
      },
      {
        $lookup: {
          from: "managers",
          localField: "userInfo.manager",
          foreignField: "_id",
          as: "manager",
        },
      },
      {
        $addFields: {
          userInfo: { $arrayElemAt: ["$userInfo", 0] },
          paymentMethod: { $arrayElemAt: ["$paymentMethod", 0] },
          manager: { $arrayElemAt: ["$manager", 0] },
        },
      },
      {
        $project: {
          _id: 1,
          userOid: 1,
          paymentAmount: 1,
          invoiceId: 1,
          details: 1,
          createdAt: 1,

          name: "$userInfo.name",
          userId: "$userInfo.userId",
          email: "$userInfo.email",
          phone: "$userInfo.phone",
          socialLink: "$userInfo.socialLink",
          userStatus: "$userInfo.status",
          address: "$userInfo.address",

          manager: "$manager.name",

          paymentMethod: "$paymentMethod.paymentMethod",
          paymentEmail: "$paymentMethod.email",
        },
      },
    ];
    const invoiceRequestDetails = await InvoiceRequest.aggregate(pipeline);

    res.status(200).json(invoiceRequestDetails?.[0]);
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
});

// update invoice-request and create final invoice for user
router.patch("/invoice-requests/:id", auth(["ADMIN"]), async (req, res) => {
  const { id } = req.params;
  const dataToUpdate = req.body;

  try {
    const invoiceRequest = await InvoiceRequest.findOne({ invoiceId: id });
    if (!invoiceRequest) {
      return res.status(404).json({ message: "No invoice found!" });
    }

    //check if offers are unpaid?
    const unpaidOffersData = [];
    const ids = dataToUpdate.map((data) => data._id);
    const weeklyClicks = await WeeklyOfferwiseClick.find({
      _id: { $in: ids },
      paymentStatus: "unpaid",
    });
    unpaidOffersData.push(...weeklyClicks);

    if (unpaidOffersData.length < 1) {
      return res.status(404).json({ message: "No unpaid offer available!" });
    }

    //=========== update teh weeklyOfferwiseClick and affiliationClick collection ==========//

    const unpaidOfferIds = unpaidOffersData.map((data) => data._id);
    const allTransIds = unpaidOffersData.reduce((acc, data) => acc.concat(data.transIds || []), []);

    // Batch update WeeklyOfferwiseClick documents
    await WeeklyOfferwiseClick.updateMany(
      { _id: { $in: unpaidOfferIds } },
      { paymentStatus: "paid" },
      { upsert: false }
    );

    // Batch update AffiliationClick and AdAffiliationClick documents
    await AffiliationClick.updateMany(
      { transactionId: { $in: allTransIds } },
      { paymentStatus: "paid" },
      { upsert: false }
    );
    await AdAffiliationClick.updateMany(
      { transactionId: { $in: allTransIds } },
      { paymentStatus: "paid" },
      { upsert: false }
    );

    //=========== create invoice here ==========//
    let total = 0;
    for (data of unpaidOffersData) {
      total += data?.revenue;
    }

    const invoiceId = await generateInvoiceId();
    await Invoice.create({
      invoiceId,
      userOid: invoiceRequest?.userOid,
      paymentAmount: total,
    }).then(async (invoice) => {
      //update user account
      const userAccount = await UserAccount.findOne({ userOid: invoice?.userOid });
      userAccount.currentBalance -= parseFloat(invoice.paymentAmount);
      userAccount.pendingWithdrawal += parseFloat(invoice.paymentAmount);
      await userAccount.save();

      // notify user
      await Notification.create({
        targetRole: "USER",
        userInfo: invoice?.userOid,
        heading: "New Invoice Created",
        type: "invoice-creation",
        link: `/payment`,
      });
    });

    invoiceRequest.activityStatus = "active";
    await invoiceRequest.save();

    res.status(200).json({ message: "Payment Completed" });
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
});

//get invoice
router.get("/get-invoices", auth(["ADMIN", "USER", "MANAGER"]), async (req, res) => {
  const { status } = req.query;
  try {
    let filter = {};

    if (req?.user?.role === "USER") {
      filter.userOid = new ObjectId(req?.user?._id);
    }
    if (status) {
      filter.paymentStatus = status;
    }

    const pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: "paymentmethodusers",
          localField: "userOid",
          foreignField: "userOid",
          as: "payoutMethod",
        },
      },
      { $addFields: { payoutMethod: { $arrayElemAt: ["$payoutMethod", 0] } } },
      {
        $project: {
          _id: 1,
          invoiceId: 1,
          userOid: 1,
          paymentAmount: 1,
          paymentStatus: 1,
          createdAt: 1,
          updatedAt: 1,
          payoutMethod: "$payoutMethod.paymentMethod",
          payoutEmail: "$payoutMethod.email",
          cryptoAddress: "$payoutMethod.cryptoAddress",
          cryptoType: "$payoutMethod.cryptoType",
        },
      },
    ];
    const invoices = await Invoice.aggregate(pipeline);
    // const invoices = await Invoice.find(filter).populate([
    //   {
    //     path: "userOid",
    //     model: "PaymentMethodUser",
    //     foreignField: "userOid",
    //     select: "-_id paymentMethod email cryptoType cryptoAddress",
    //   },
    // ]);

    if (!invoices) {
      return res.status(404).json({ message: "No invoice found!" });
    }

    res.status(200).json(invoices);
  } catch (err) {
    res.status(500).json({ message: err?.message });
  }
});

//upaate invoice status
router.patch("/payment-status", auth(["ADMIN"]), async (req, res) => {
  const data = req.body;

  try {
    const invoiceData = await Invoice.findOne({ invoiceId: data.invoiceId });
    if (!invoiceData) {
      return res.status(404).json({ message: "No invoice found!" });
    }

    invoiceData.paymentStatus = data?.status;
    await invoiceData.save().then(async (result) => {
      if (!result) {
        return res.status(500).json({ message: "something went wrong!" });
      }
      const userAccount = await UserAccount.findOne({ userOid: result?.userOid });
      if (data?.status === "approved") {
        userAccount.pendingWithdrawal -= parseFloat(result?.paymentAmount);
        userAccount.totalWithdrawal += parseFloat(result?.paymentAmount);
        await userAccount.save();
      }
      if (data?.status === "pending") {
        userAccount.pendingWithdrawal += parseFloat(result?.paymentAmount);
        userAccount.totalWithdrawal -= parseFloat(result?.paymentAmount);
        await userAccount.save();
      }
    });

    res.status(200).json({
      message: `payment status updated!`,
    });
  } catch (err) {
    res.status(500).json({ message: err?.message });
  }
});

// generate an unique invoiceId
const generateInvoiceId = async () => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(2, 4).padStart(2, "0");
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  //get todays invoice count
  const count = await Invoice.countDocuments({
    createdAt: {
      $gte: startOfToday,
      $lte: now,
    },
  });

  // Combine month, day and count of the day
  const uniqueID = `${year}${month}${day}${(count + 1).toString().padStart(6, "0")}`;
  return uniqueID;
};

module.exports = router;
