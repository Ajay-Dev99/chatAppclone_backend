const authRoutes = require("express").Router();
const { sendOtp, verifyOtp, logout } = require("../../controllers/authController");
const authenticate = require("../../middleware/authMiddleware");

authRoutes.post("/send-otp", sendOtp);
authRoutes.post("/verify-otp", verifyOtp);
authRoutes.post("/logout", authenticate, logout);

module.exports = authRoutes;