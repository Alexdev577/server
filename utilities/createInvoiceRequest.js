const AffiliationClick = require("../models/AffiliationClick.model");
const AdAffiliationClick = require("../models/AdAffiliationClick.model");
const InvoiceRequest = require("../models/InvoiceRequest.model");
const Notification = require("../models/Notification.model");
const WeeklyOfferwiseClick = require("../models/WeeklyOfferwiseClick.model");

const createInvoiceRequest = async (minWithdrawBalance) => {
  await handleWeeklyOfferwiseClicks();

  const invoicePipeline = [
    {
      $match: {
        paymentStatus: "unpaid",
      },
    },
    {
      $group: {
        _id: "$userOid",
        total: { $sum: "$revenue" },
        details: { $push: "$_id" },
      },
    },
    {
      $project: {
        _id: 0,
        userOid: "$_id",
        total: 1,
        details: 1,
      },
    },
  ];
  const invoiceRequest = await WeeklyOfferwiseClick.aggregate(invoicePipeline);

  let invoiceCount = 0;

  for (const invoice of invoiceRequest) {
    if (invoice?.total > minWithdrawBalance) {
      const invoiceId = await generateInvoiceRequestId();

      await InvoiceRequest.create({
        userOid: invoice?.userOid,
        invoiceId,
        paymentAmount: invoice?.total,
        details: invoice?.details,
      }).then((result) => {
        invoiceCount += 1;
      });
    }
  }
  if (invoiceCount > 0) {
    await Notification.create({
      targetRole: "ADMIN",
      heading: `${invoiceCount} new invoices request created!`,
      type: "invoice-creation",
      link: `/invoice-requests`,
    });
  }
  return invoiceRequest;
};

// calculate and save offerwise leads and revenue for certain time intervals
const handleWeeklyOfferwiseClicks = async () => {
  const unpaidPipeline = [
    { $match: { lead: 1, status: "approved", paymentStatus: "unpaid" } },
    {
      $lookup: {
        from: "users",
        localField: "userInfo",
        foreignField: "_id",
        as: "userData",
      },
    },
    {
      $match: {
        "userData.status": "active",
      },
    },
    {
      $group: {
        _id: {
          userInfo: "$userInfo",
          offerId: "$offerId",
        },
        offerName: { $first: "$offerName" },
        lead: { $sum: "$lead" },
        transIds: { $push: "$transactionId" },
        revenue: { $sum: { $multiply: ["$price", "$lead"] } },
      },
    },
    {
      $project: {
        _id: 0,
        userOid: "$_id.userInfo",
        offerId: "$_id.offerId",
        offerName: 1,
        lead: 1,
        transIds: 1,
        revenue: 1,
      },
    },
  ];
  const weeklyOfferClicks = await AffiliationClick.aggregate(unpaidPipeline);

  // -------- update resulted click's payment status to pending -------- //
  const allTransIds = weeklyOfferClicks.reduce((acc, data) => acc.concat(data.transIds || []), []);

  // Batch update AffiliationClick and AdAffiliationClick collection
  await AffiliationClick.updateMany(
    { transactionId: { $in: allTransIds } },
    { paymentStatus: "pending" },
    { upsert: false }
  );
  await AdAffiliationClick.updateMany(
    { transactionId: { $in: allTransIds } },
    { paymentStatus: "pending" },
    { upsert: false }
  );

  // ---------- save weeklyOfferClicks in database collection ---------- //
  await WeeklyOfferwiseClick.insertMany(weeklyOfferClicks);
};

// generate an unique invoiceRequestId
const generateInvoiceRequestId = async () => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(2, 4).padStart(2, "0");
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  //get todays invoice count
  const count = await InvoiceRequest.countDocuments({
    createdAt: {
      $gte: startOfToday,
      $lte: now,
    },
  });

  // Combine month, day and count of the day
  const uniqueID = `${year}${month}${day}${(count + 1).toString().padStart(6, "0")}`;
  return uniqueID;
};

module.exports = createInvoiceRequest;
