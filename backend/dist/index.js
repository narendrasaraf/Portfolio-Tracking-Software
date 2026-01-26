"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const passport_1 = __importDefault(require("./utils/passport"));
const auth_1 = require("./middleware/auth");
const assetRoutes_1 = __importDefault(require("./routes/assetRoutes"));
const stockRoutes_1 = __importDefault(require("./routes/stockRoutes"));
const transactionRoutes_1 = __importDefault(require("./routes/transactionRoutes"));
const portfolioRoutes_1 = __importDefault(require("./routes/portfolioRoutes"));
const backupRoutes_1 = __importDefault(require("./routes/backupRoutes"));
const alertRoutes_1 = __importDefault(require("./routes/alertRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use(passport_1.default.initialize());
// Auth routes don't need verification
app.use('/api/auth', authRoutes_1.default);
// Protected routes
app.use('/api/assets', auth_1.verifyJWT, assetRoutes_1.default);
app.use('/api/stocks', auth_1.verifyJWT, stockRoutes_1.default);
app.use('/api/transactions', auth_1.verifyJWT, transactionRoutes_1.default);
app.use('/api/portfolio', auth_1.verifyJWT, portfolioRoutes_1.default);
app.use('/api/backup', auth_1.verifyJWT, backupRoutes_1.default);
app.use('/api/alerts', auth_1.verifyJWT, alertRoutes_1.default);
app.get('/health', (req, res) => {
    res.send('OK');
});
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
