const express = require("express");
const Setting = require("../../models/Setting.model");
const createInvoiceRequest = require("../../utilities/createInvoiceRequest");
const InvoiceRequest = require("../../models/InvoiceRequest.model");
const WeeklyOfferwiseClick = require("../../models/WeeklyOfferwiseClick.model");
const AffiliationClick = require("../../models/AffiliationClick.model");
const AdAffiliationClick = require("../../models/AdAffiliationClick.model");
const Invoice = require("../../models/Invoice.model");
const Notification = require("../../models/Notification.model");

const auth = require("../../middleware/auth");
const router = express.Router();

// create invoice-request on admin specified date
router.get("/create-invoice", auth(["ADMIN"]), async (req, res) => {
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

    const unpaidOffersData = [];
    for (data of dataToUpdate) {
      const weeklyClicks = await WeeklyOfferwiseClick.findById(data._id);
      if (weeklyClicks?.paymentStatus === "unpaid") {
        unpaidOffersData.push(weeklyClicks);
      }
    }

    if (unpaidOffersData.length < 1) {
      return res.status(404).json({ message: "No unpaid offer available!" });
    }

    for (data of unpaidOffersData) {
      await WeeklyOfferwiseClick.findByIdAndUpdate(
        data._id,
        { paymentStatus: "paid" },
        { upsert: true, new: true }
      ).then(async (result) => {
        for (transId of result?.transIds) {
          await AffiliationClick.findOneAndUpdate(
            { transactionId: transId },
            {
              paymentStatus: "paid",
            }
          );
          await AdAffiliationClick.findOneAndUpdate(
            { transactionId: transId },
            {
              paymentStatus: "paid",
            }
          );
        }
      });
    }

    let total = 0;
    for (data of unpaidOffersData) {
      total += data?.revenue;
    }

    const invoiceId = await generateInvoiceId();
    await Invoice.create({
      invoiceId,
      userOid: invoiceRequest?.userOid,
      paymentAmount: total,
    }).then(
      async (invoice) =>
        await Notification.create({
          targetRole: "USER",
          userInfo: invoice?.userOid,
          heading: "New Invoice Created",
          type: "invoice-creation",
          link: `/payment`,
        })
    );

    invoiceRequest.activityStatus = "active";
    invoiceRequest.save();

    res.status(200).json({ message: "Payment Completed" });
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
});

//get invoice
router.get("/get-invoices", auth(["ADMIN", "USER", "MANAGER"]), async (req, res) => {
  try {
    let filter = {};

    if (req?.user?.role === "USER") {
      filter.userOid = req?.user?._id;
    }
    const invoice = await Invoice.find(filter);

    if (!invoice) {
      return res.status(404).json({ message: "No invoice found!" });
    }

    res.status(200).json(invoice);
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
    const saveInvoice = await invoiceData.save();

    if (!saveInvoice) {
      return res.status(500).json({ message: "something went wrong!" });
    }

    res.status(200).json({
      message: "payment status updated!",
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
