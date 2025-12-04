const mongoose = require("mongoose");

const connectionSchema = new mongoose.Schema(
    {
        requester: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        status: {
            type: String,
            enum: ["pending", "accepted", "rejected", "blocked"],
            default: "pending",
            index: true,
        },
        message: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        respondedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for finding connections between two users
connectionSchema.index({ requester: 1, recipient: 1 }, { unique: true });

// Index for querying pending requests
connectionSchema.index({ recipient: 1, status: 1 });
connectionSchema.index({ requester: 1, status: 1 });

// Static method to check if two users are connected
connectionSchema.statics.areConnected = async function (userId1, userId2) {
    const connection = await this.findOne({
        $or: [
            { requester: userId1, recipient: userId2, status: "accepted" },
            { requester: userId2, recipient: userId1, status: "accepted" },
        ],
    });
    return !!connection;
};

// Static method to get connection between two users
connectionSchema.statics.getConnection = async function (userId1, userId2) {
    return await this.findOne({
        $or: [
            { requester: userId1, recipient: userId2 },
            { requester: userId2, recipient: userId1 },
        ],
    });
};

// Static method to get all connected users for a user
connectionSchema.statics.getConnectedUsers = async function (userId) {
    const connections = await this.find({
        $or: [
            { requester: userId, status: "accepted" },
            { recipient: userId, status: "accepted" },
        ],
    })
        .populate("requester", "name email profilePicture online")
        .populate("recipient", "name email profilePicture online")
        .lean();

    // Return the other user in each connection
    return connections.map((conn) => {
        if (conn.requester._id.toString() === userId.toString()) {
            return conn.recipient;
        }
        return conn.requester;
    });
};

const Connection = mongoose.model("Connection", connectionSchema);

module.exports = Connection;

