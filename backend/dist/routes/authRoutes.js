"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const router = express_1.default.Router();
router.post('/login', (req, res) => {
    const { password } = req.body;
    // Get password from environment variable or fallback for development
    // In production, ALWAYS use the environment variable
    const adminPassword = process.env.ADMIN_PASSWORD || 'Narendra16@';
    if (password === adminPassword) {
        res.status(200).json({ success: true, message: 'Authenticated successfully' });
    }
    else {
        res.status(401).json({ success: false, message: 'Incorrect password' });
    }
});
exports.default = router;
