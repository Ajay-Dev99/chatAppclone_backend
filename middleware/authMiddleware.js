const jwt = require("jsonwebtoken");
const User = require("../model/userModel");

const JWT_SECRET = process.env.JWT_SECRET;

const authMiddleware = async (req, res, next) => {
    if (!JWT_SECRET) {
        console.error("JWT_SECRET is not configured. Please set it in your environment variables.");
        return res.status(500).json({ message: "Authentication not configured" });
    }

    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader || typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authorization header missing or malformed" });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Authentication token missing" });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);

        const userId = payload.sub || payload.userId || payload.id;

        if (!userId) {
            return res.status(401).json({ message: "Invalid token payload" });
        }

        const user = await User.findById(userId).lean();

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        req.user = user;
        req.tokenPayload = payload;

        return next();
    } catch (error) {
        console.error("JWT verification error:", error);

        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token expired. Please login again." });
        }

        return res.status(401).json({ message: "Invalid token" });
    }
};

module.exports = authMiddleware;

