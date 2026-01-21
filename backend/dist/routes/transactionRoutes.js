"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const transactionController_1 = require("../controllers/transactionController");
const router = (0, express_1.Router)();
router.post('/', transactionController_1.addTransaction);
router.delete('/:id', transactionController_1.deleteTransaction);
exports.default = router;
