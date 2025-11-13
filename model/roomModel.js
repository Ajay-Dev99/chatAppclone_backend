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
        directKey: {
            type: String,
            unique: true,
            sparse: true,
            index: true,
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

roomSchema.path("participants").validate(function (value) {
    if (!Array.isArray(value) || value.length === 0) {
        return false;
    }

    if (this.type === "direct" && value.length !== 2) {
        return false;
    }

    return true;
}, "Participants array is invalid for the selected room type.");

roomSchema.pre("validate", function (next) {
    if (this.type === "group") {
        this.directKey = undefined;
        return next();
    }

    if (!Array.isArray(this.participants) || this.participants.length !== 2) {
        return next(new Error("Direct rooms require exactly two participants."));
    }

    const [first, second] = this.participants
        .map((id) => id.toString())
        .sort((a, b) => (a > b ? 1 : -1));

    this.directKey = `${first}:${second}`;
    return next();
});

const Room = mongoose.model("Room", roomSchema);

module.exports = Room;

