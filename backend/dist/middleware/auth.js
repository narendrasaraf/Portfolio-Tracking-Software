"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyJWT = void 0;
const passport_1 = __importDefault(require("passport"));
const context_1 = require("../utils/context");
const verifyJWT = (req, res, next) => {
    passport_1.default.authenticate('jwt', { session: false }, (err, user, info) => {
        if (err || !user) {
            return res.status(401).json({ error: 'Unauthorized', details: info === null || info === void 0 ? void 0 : info.message });
        }
        req.user = user;
        // Wrap the next call in the user context
        context_1.userContext.run({ userId: user.id }, () => {
            next();
        });
    })(req, res, next);
};
exports.verifyJWT = verifyJWT;
