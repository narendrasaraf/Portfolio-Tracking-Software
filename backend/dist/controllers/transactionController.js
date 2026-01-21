"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTransaction = exports.addTransaction = void 0;
const db_1 = require("../utils/db");
const priceService_1 = require("../services/priceService");
const addTransaction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { assetId, type, quantity, pricePerUnit, fees, notes, date } = req.body;
        const transaction = yield db_1.prisma.assetTransaction.create({
            data: {
                assetId,
                type,
                quantity: Number(quantity),
                pricePerUnit: Number(pricePerUnit),
                fees: Number(fees || 0),
                notes,
                date: date ? new Date(date) : new Date()
            }
        });
        // Trigger price refresh just in case it's a new symbol
        (0, priceService_1.refreshPrices)().catch(console.error);
        res.json(transaction);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
exports.addTransaction = addTransaction;
const deleteTransaction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        yield db_1.prisma.assetTransaction.delete({ where: { id } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
exports.deleteTransaction = deleteTransaction;
