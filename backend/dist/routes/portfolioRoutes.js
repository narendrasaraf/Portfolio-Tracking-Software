"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const portfolioController_1 = require("../controllers/portfolioController");
const router = (0, express_1.Router)();
router.get('/history', portfolioController_1.getHistory);
router.get('/daily-change', portfolioController_1.getDailyChange);
exports.default = router;
