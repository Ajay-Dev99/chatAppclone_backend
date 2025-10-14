const authRoutes = require("express").Router();
const { sendOtp } = require("../../controllers/authController");


authRoutes.post("/send-otp", sendOtp);



module.exports = authRoutes;