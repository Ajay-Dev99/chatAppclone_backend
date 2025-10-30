
const userRoutes = require('express').Router();
const { listUsers } = require('../../controllers/userController');

userRoutes.get('/list', listUsers);

module.exports = userRoutes;