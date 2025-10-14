const authRoutes = require("./authRoutes");

const v1Routes = require("express").Router();

v1Routes.use("/auth", authRoutes);


module.exports = v1Routes;