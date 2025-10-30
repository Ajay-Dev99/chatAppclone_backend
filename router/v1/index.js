const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");

const v1Routes = require("express").Router();

v1Routes.use("/auth", authRoutes);
v1Routes.use("/users", userRoutes);


module.exports = v1Routes;