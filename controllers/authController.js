const sendEmail = require("../helpers/nodeMailer");
const User = require("../model/userModel");


let otpMap = new Map();

const sendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const otp = Math.floor(100000 + Math.random() * 900000);
        otpMap.set(normalizedEmail, otp);
        setTimeout(() => {
            otpMap.delete(normalizedEmail);
        }, 5 * 60 * 1000);

        const subject = "OTP Verification";
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

       
        if (Number(storedOtp) !== Number(otp)) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        otpMap.delete(normalizedEmail);

        
        try {
            let user = await User.findOne({ email: normalizedEmail });
            if (!user) {
                
                const localPart = normalizedEmail.split('@')[0] || 'user';
                const prettyName = localPart.replace(/[._\d]+/g, ' ').replace(/\s+/g, ' ').trim();
                const name = prettyName.length ? prettyName.replace(/\b\w/g, c => c.toUpperCase()) : 'User';

                user = new User({ name, email: normalizedEmail, isVerified: true });
                await user.save();
            } else {
                
                if (!user.isVerified) {
                    user.isVerified = true;
                    await user.save();
                }
            }

            return res.status(200).json({ message: "OTP verified successfully", user });
        } catch (dbError) {
            console.error('DB error while creating/verifying user:', dbError);
            return res.status(500).json({ message: 'OTP verified but failed to create/update user' });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
}

module.exports = { sendOtp, verifyOtp };