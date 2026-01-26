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
exports.prisma = void 0;
const mongo_1 = require("../db/mongo");
const Asset_1 = require("../models/Asset");
const AssetTransaction_1 = require("../models/AssetTransaction");
const PriceCache_1 = require("../models/PriceCache");
const PortfolioSnapshot_1 = require("../models/PortfolioSnapshot");
const AlertRule_1 = require("../models/AlertRule");
const AlertEvent_1 = require("../models/AlertEvent");
const TelegramIntegration_1 = require("../models/TelegramIntegration");
const context_1 = require("./context");
(0, mongo_1.connectMongo)().catch(console.error);
class PrismaModelShim {
    constructor(model) {
        this.model = model;
    }
    convertWhere(where) {
        if (!where)
            where = {};
        // Auto-inject userId from context if not present and not searching for a specific ID
        const context = context_1.userContext.getStore();
        if (context === null || context === void 0 ? void 0 : context.userId) {
            where.userId = context.userId;
        }
        const query = {};
        for (const key of Object.keys(where)) {
            const value = where[key];
            if (key === 'id') {
                query._id = value;
            }
            else if (value && typeof value === 'object' && !(value instanceof Date) && !Array.isArray(value)) {
                const newObj = {};
                let hasOperators = false;
                for (const op of Object.keys(value)) {
                    if (['gte', 'gt', 'lte', 'lt', 'ne', 'in', 'nin'].includes(op)) {
                        newObj[`$${op}`] = value[op];
                        hasOperators = true;
                    }
                    else if (op === 'contains') {
                        newObj['$regex'] = value[op];
                        newObj['$options'] = 'i';
                        hasOperators = true;
                    }
                    else if (op === 'startsWith') {
                        newObj['$regex'] = `^${value[op]}`;
                        hasOperators = true;
                    }
                    else if (op === 'endsWith') {
                        newObj['$regex'] = `${value[op]}$`;
                        hasOperators = true;
                    }
                    else {
                        newObj[op] = value[op];
                    }
                }
                if (hasOperators) {
                    query[key] = newObj;
                }
                else {
                    query[key] = value;
                }
            }
            else {
                query[key] = value;
            }
        }
        return query;
    }
    convertOrderBy(orderBy) {
        if (!orderBy)
            return {};
        const sort = {};
        for (const key of Object.keys(orderBy)) {
            sort[key] = orderBy[key] === 'desc' ? -1 : 1;
        }
        return sort;
    }
    applyInclude(query, include) {
        if (!include)
            return query;
        for (const key of Object.keys(include)) {
            const incVal = include[key];
            let options = undefined;
            if (incVal && typeof incVal === 'object' && incVal.orderBy) {
                options = { sort: this.convertOrderBy(incVal.orderBy) };
            }
            // If the key is 'transactions' for Asset, it is a virtual.
            // Mongoose handles population of virtuals same as fields.
            query = query.populate({ path: key, options });
        }
        return query;
    }
    toPojo(doc) {
        return doc && doc.toJSON ? doc.toJSON() : doc;
    }
    findMany() {
        return __awaiter(this, arguments, void 0, function* (args = {}) {
            let query = this.model.find(this.convertWhere(args.where));
            query = this.applyInclude(query, args.include);
            if (args.orderBy) {
                query = query.sort(this.convertOrderBy(args.orderBy));
            }
            if (args.take) {
                query = query.limit(args.take);
            }
            const docs = yield query.exec();
            return docs.map((d) => this.toPojo(d));
        });
    }
    findUnique(args) {
        return __awaiter(this, void 0, void 0, function* () {
            let query = this.model.findOne(this.convertWhere(args.where));
            query = this.applyInclude(query, args.include);
            const doc = yield query.exec();
            return this.toPojo(doc);
        });
    }
    findFirst(args) {
        return __awaiter(this, void 0, void 0, function* () {
            let query = this.model.findOne(this.convertWhere(args.where));
            if (args.orderBy) {
                query = query.sort(this.convertOrderBy(args.orderBy));
            }
            query = this.applyInclude(query, args.include);
            const doc = yield query.exec();
            return this.toPojo(doc);
        });
    }
    create(args) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = Object.assign({}, args.data);
            const context = context_1.userContext.getStore();
            if ((context === null || context === void 0 ? void 0 : context.userId) && !data.userId) {
                data.userId = context.userId;
            }
            const doc = new this.model(data);
            yield doc.save();
            return this.toPojo(doc);
        });
    }
    update(args) {
        return __awaiter(this, void 0, void 0, function* () {
            const doc = yield this.model.findOneAndUpdate(this.convertWhere(args.where), args.data, { new: true, runValidators: true });
            return this.toPojo(doc);
        });
    }
    delete(args) {
        return __awaiter(this, void 0, void 0, function* () {
            const doc = yield this.model.findOneAndDelete(this.convertWhere(args.where));
            return this.toPojo(doc);
        });
    }
    deleteMany() {
        return __awaiter(this, arguments, void 0, function* (args = {}) {
            return yield this.model.deleteMany(this.convertWhere(args.where));
        });
    }
    upsert(args) {
        return __awaiter(this, void 0, void 0, function* () {
            const context = context_1.userContext.getStore();
            const filter = this.convertWhere(args.where);
            const existing = yield this.model.findOne(filter);
            if (existing) {
                const doc = yield this.model.findOneAndUpdate(filter, args.update, { new: true });
                return this.toPojo(doc);
            }
            else {
                const data = Object.assign({}, args.create);
                if ((context === null || context === void 0 ? void 0 : context.userId) && !data.userId) {
                    data.userId = context.userId;
                }
                const doc = new this.model(data);
                yield doc.save();
                return this.toPojo(doc);
            }
        });
    }
}
exports.prisma = {
    asset: new PrismaModelShim(Asset_1.Asset),
    assetTransaction: new PrismaModelShim(AssetTransaction_1.AssetTransaction),
    priceCache: new PrismaModelShim(PriceCache_1.PriceCache),
    portfolioSnapshot: new PrismaModelShim(PortfolioSnapshot_1.PortfolioSnapshot),
    alertRule: new PrismaModelShim(AlertRule_1.AlertRule),
    alertEvent: new PrismaModelShim(AlertEvent_1.AlertEvent),
    telegramIntegration: new PrismaModelShim(TelegramIntegration_1.TelegramIntegration),
    $transaction: (callback) => __awaiter(void 0, void 0, void 0, function* () {
        // Simple shim for transactions - just run the callback with prisma itself
        return yield callback(exports.prisma);
    })
};
