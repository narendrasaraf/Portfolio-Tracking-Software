"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
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
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/api/assets', assetRoutes_1.default);
app.use('/api/stocks', stockRoutes_1.default);
app.use('/api/transactions', transactionRoutes_1.default);
app.use('/api/portfolio', portfolioRoutes_1.default);
app.use('/api/backup', backupRoutes_1.default);
app.use('/api/alerts', alertRoutes_1.default);
app.use('/api/auth', authRoutes_1.default);
app.get('/health', (req, res) => {
    res.send('OK');
});
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
