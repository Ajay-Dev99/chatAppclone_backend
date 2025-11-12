const User = require("../model/userModel");

const listUsers = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    let { limit = 10, page = 1 } = req.query;
    limit = Number(limit) || 10;
    page = Number(page) || 1;
    if (limit < 1) limit = 10;
    if (page < 1) page = 1;

    try {
        const total = await User.countDocuments();

        const users = await User.find({}, { __v: 0, password: 0 })
            .limit(limit)
            .skip((page - 1) * limit)
            .lean();

        const totalPages = Math.ceil(total / limit);
        const hasMore = page < totalPages;
        const nextPage = hasMore ? page + 1 : null;
        return res.status(200).json({
            data: users,
            page,
            limit,
            total,
            totalPages,
            hasMore,
            nextPage,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

module.exports = { listUsers };