"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const backupController_1 = require("../controllers/backupController");
const router = (0, express_1.Router)();
router.get('/export', backupController_1.exportData);
router.post('/import', backupController_1.importData);
exports.default = router;
