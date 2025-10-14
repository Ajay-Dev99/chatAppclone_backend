const sendEmail = require("../helpers/nodeMailer");

const sendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000);
        const subject = "OTP Verification";
        const result = await sendEmail(email, subject, otp);
        return res.status(200).json({ message: "OTP sent successfully", result });

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

module.exports = { sendOtp }