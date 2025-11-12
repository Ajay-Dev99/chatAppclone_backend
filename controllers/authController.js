const jwt = require("jsonwebtoken");
const sendEmail = require("../helpers/nodeMailer");
const User = require("../model/userModel");

const otpMap = new Map();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "3d";

const ensureJwtConfig = () => {
    if (!JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured. Please set it in your environment variables.");
    }
};

const generateToken = (user) => {
    ensureJwtConfig();

    return jwt.sign(
        {
            sub: user._id.toString(),
            email: user.email,
        },
        JWT_SECRET,
        {
            expiresIn: JWT_EXPIRES_IN,
        }
    );
};

const sanitizeUser = (user) => {
    const userObj = user.toObject ? user.toObject() : user;
    // Remove internal mongoose fields
    delete userObj.__v;
    if (userObj.password) {
        delete userObj.password;
    }
    if (userObj._id) {
        userObj.id = userObj._id.toString();
        userObj._id = userObj._id.toString();
    }
    return userObj;
};

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
        }, 5 * 60 * 1000); // 5 minutes

        const subject = "OTP Verification";
        const result = await sendEmail(email, subject, otp);

        return res.status(200).json({ message: "OTP sent successfully", result });
    } catch (error) {
        console.error("Error sending OTP:", error);
        return res.status(500).json({ message: error.message });
    }
};

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
                const localPart = normalizedEmail.split("@")[0] || "user";
                const prettyName = localPart.replace(/[._\d]+/g, " ").replace(/\s+/g, " ").trim();
                const name = prettyName.length ? prettyName.replace(/\b\w/g, (c) => c.toUpperCase()) : "User";

                user = new User({ name, email: normalizedEmail, isVerified: true, lastSeen: new Date() });
                await user.save();
            } else if (!user.isVerified) {
                user.isVerified = true;
                user.lastSeen = new Date();
                await user.save();
            } else {
                user.lastSeen = new Date();
                await user.save();
            }

            const token = generateToken(user);
            const decoded = jwt.decode(token);
            const expiresAt = decoded?.exp ? decoded.exp * 1000 : null;

            return res.status(200).json({
                message: "OTP verified successfully",
                user: sanitizeUser(user),
                token,
                expiresAt,
            });
        } catch (dbError) {
            console.error("DB error while creating/verifying user:", dbError);
            return res.status(500).json({ message: "OTP verified but failed to create/update user" });
        }
    } catch (error) {
        console.error("Error verifying OTP:", error);
        if (error.message?.includes("JWT_SECRET")) {
            return res.status(500).json({ message: error.message });
        }
        return res.status(500).json({ message: "Failed to verify OTP" });
    }
};

const logout = async (req, res) => {
    try {
        if (req.user?._id) {
            await User.findByIdAndUpdate(req.user._id, { isOnline: false, lastSeen: new Date() });
        }
    } catch (error) {
        console.error("Error during logout:", error);
    }

    return res.status(200).json({ message: "Logged out successfully" });
};

module.exports = { sendOtp, verifyOtp, logout };