// // require
// const express = require("express");
// const Admin = require("../../models/Admin.model");
// const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken");
// require("dotenv").config();
// const { cleanUrl } = require("../../utilities/dataCleaning");

// // router
// const router = express.Router();

// // unexpected get api response
// router.get("/", (req, res, next) => {
//   if (!cleanUrl(req.originalUrl)) {
//     return res.status(400).json({  message: "bad request" });
//   }
//   res.status(200).json({  message: "Not applicable" });
// });

// // user login
// router.post("/", (req, res, next) => {
//   if (!cleanUrl(req.originalUrl)) {
//     return res.status(400).json({  message: "bad request" });
//   }

//   const { email, password } = req.body;

//   Admin.findOne({
//     $or: [{ email: email }, { userName: email }],
//   })
//     .then((login) => {
//       if (!login) {
//         return res
//           .status(401)
//           .json({  message: "Invalid login credentials" });
//       }

//       bcrypt.compare(password, login.password, (err, result) => {
//         if (err) {
//           return res.status(500).json({
//
//             message: "An error occurred while signing in!",
//           });
//         }

//         if (!result) {
//           return res
//             .status(401)
//             .json({  message: "Invalid admin credentials!" });
//         }

//         const access_token = jwt.sign(
//           {
//             _id: login._id,
//             email: login.email,
//             role: login.role,
//             status: login.status,
//           },
//           process.env.JWT_SECRET,
//           {
//             expiresIn: "7d",
//           }
//         );

//         res.status(200).json({
//           access_token,
//           message: "Login Successful!",
//         });
//       });
//     })
//     .catch((err) => {
//       console.log(err);
//       res.status(500).json({  message: err });
//     });
// });

// // exports
// module.exports = router;
