const express = require("express");
const UserAccount = require("../../models/UserAccount.model");
const auth = require("../../middleware/auth");

const router = express.Router();

// get user account data
router.get("/:id", auth(["USER", "ADMIN", "MANAGER"]), async (req, res) => {
  const { id } = req.params;
  try {
    if (req?.user?.role === "USER" && id !== req?.user?._id) {
      return res.status(400).json({ message: "Invalid Request" });
    }
    const accountExist = await UserAccount.findOne({ userOid: id });
    if (accountExist) {
      return res.status(200).json(accountExist);
    }

    await UserAccount.create({
      userOid: req?.user?._id,
      currentBalance: 0,
      totalRevenue: 0,
      totalWithdrawal: 0,
      pendingWithdrawal: 0,
    }).then(async (account) => {
      return res.status(200).json(account);
    });
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
});

module.exports = router;
