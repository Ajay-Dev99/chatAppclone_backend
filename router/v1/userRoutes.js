
const userRoutes = require("express").Router();
const { listUsers } = require("../../controllers/userController");
const authenticate = require("../../middleware/authMiddleware");

userRoutes.use(authenticate);
userRoutes.get("/list", listUsers);

module.exports = userRoutes;