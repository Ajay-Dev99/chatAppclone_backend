const authRoutes = require("express").Router();
const { sendOtp, verifyOtp } = require("../../controllers/authController");


authRoutes.post("/send-otp", sendOtp);
authRoutes.post("/verify-otp", verifyOtp);



module.exports = authRoutes;