const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        connections: {
            type: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },
            ],
        },
        // Online presence flag used across the app (named `online` to match controllers)
        online: {
            type: Boolean,
            default: false,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        // Last seen timestamp when user goes offline
        lastSeen: {
            type: Date,
            default: Date.now,
        },
        // Optional: profile picture so populates in connectionController don't break
        profilePicture: {
            type: String,
        },
    },
    { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;