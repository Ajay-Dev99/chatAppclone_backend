const sendEmail = require("../helpers/nodeMailer");

// In-memory map for OTPs. Keys are normalized emails (trim + lowercase).
let otpMap = new Map();

const sendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const otp = Math.floor(100000 + Math.random() * 900000);

        // Store using normalized email so lookups are consistent.
        otpMap.set(normalizedEmail, otp);

        // Auto-delete the OTP after 5 minutes to avoid stale entries.
        setTimeout(() => {
            otpMap.delete(normalizedEmail);
        }, 5 * 60 * 1000);

        const subject = "OTP Verification";
        // send the email to the original provided address (preserve case for display)
        const result = await sendEmail(email, subject, otp);
        return res.status(200).json({ message: "OTP sent successfully", result });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
}

const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || (otp === undefined || otp === null)) {
            return res.status(400).json({ message: "Email and OTP are required" });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const storedOtp = otpMap.get(normalizedEmail);

        if (storedOtp === undefined) {
            return res.status(400).json({ message: "OTP not found or expired" });
        }

        // Compare as numbers to avoid type mismatches (body parsers often give strings).
        if (Number(storedOtp) !== Number(otp)) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        otpMap.delete(normalizedEmail);
        return res.status(200).json({ message: "OTP verified successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
}

module.exports = { sendOtp, verifyOtp };