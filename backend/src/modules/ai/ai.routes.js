const express = require('express');
const AiController = require('./ai.controller');
const { softAuthMiddleware } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.post('/consult', softAuthMiddleware, AiController.consult);

module.exports = router;
