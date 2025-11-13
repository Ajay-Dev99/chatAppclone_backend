const mongoose = require("mongoose");

const ROOM_TYPES = ["direct", "group"];

const roomSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ROOM_TYPES,
            default: "direct",
            required: true,
        },
        name: {
            type: String,
            trim: true,
            maxlength: 120,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
        ],
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        lastMessageAt: {
            type: Date,
        },
        metadata: {
            type: Map,
            of: String,
        },
        admins: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
    },
    {
        timestamps: true,
    }
);


const Room = mongoose.model("Room", roomSchema);

module.exports = Room;

