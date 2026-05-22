const express = require('express');
const NewsletterController = require('./newsletter.controller');

const router = express.Router();

router.post('/subscribe', NewsletterController.subscribe);

module.exports = router;
