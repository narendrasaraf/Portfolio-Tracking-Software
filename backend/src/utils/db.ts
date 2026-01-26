import { connectMongo } from '../db/mongo';
import { Asset } from '../models/Asset';
import { AssetTransaction } from '../models/AssetTransaction';
import { PriceCache } from '../models/PriceCache';
import { PortfolioSnapshot } from '../models/PortfolioSnapshot';
import { AlertRule } from '../models/AlertRule';
import { AlertEvent } from '../models/AlertEvent';
import { TelegramIntegration } from '../models/TelegramIntegration';
import { userContext } from './context';

connectMongo().catch(console.error);

class PrismaModelShim {
    constructor(private model: any) { }

    private convertWhere(where: any) {
        if (!where) where = {};

        // Auto-inject userId from context if not present and not searching for a specific ID
        const context = userContext.getStore();
        if (context?.userId) {
            where.userId = context.userId;
        }

        const query: any = {};
        for (const key of Object.keys(where)) {
            const value = where[key];
            if (key === 'id') {
                query._id = value;
            } else if (value && typeof value === 'object' && !(value instanceof Date) && !Array.isArray(value)) {
                const newObj: any = {};
                let hasOperators = false;

                for (const op of Object.keys(value)) {
                    if (['gte', 'gt', 'lte', 'lt', 'ne', 'in', 'nin'].includes(op)) {
                        newObj[`$${op}`] = value[op];
                        hasOperators = true;
                    } else if (op === 'contains') {
                        newObj['$regex'] = value[op];
                        newObj['$options'] = 'i';
                        hasOperators = true;
                    } else if (op === 'startsWith') {
                        newObj['$regex'] = `^${value[op]}`;
                        hasOperators = true;
                    } else if (op === 'endsWith') {
                        newObj['$regex'] = `${value[op]}$`;
                        hasOperators = true;
                    } else {
                        newObj[op] = value[op];
                    }
                }

                if (hasOperators) {
                    query[key] = newObj;
                } else {
                    query[key] = value;
                }
            } else {
                query[key] = value;
            }
        }
        return query;
    }

    private convertOrderBy(orderBy: any) {
        if (!orderBy) return {};
        const sort: any = {};
        for (const key of Object.keys(orderBy)) {
            sort[key] = orderBy[key] === 'desc' ? -1 : 1;
        }
        return sort;
    }

    private applyInclude(query: any, include: any) {
        if (!include) return query;
        for (const key of Object.keys(include)) {
            const incVal = include[key];
            let options: any = undefined;
            if (incVal && typeof incVal === 'object' && incVal.orderBy) {
                options = { sort: this.convertOrderBy(incVal.orderBy) };
            }

            // If the key is 'transactions' for Asset, it is a virtual.
            // Mongoose handles population of virtuals same as fields.
            query = query.populate({ path: key, options });
        }
        return query;
    }

    private toPojo(doc: any) {
        return doc && doc.toJSON ? doc.toJSON() : doc;
    }

    async findMany(args: any = {}) {
        let query = this.model.find(this.convertWhere(args.where));
        query = this.applyInclude(query, args.include);
        if (args.orderBy) {
            query = query.sort(this.convertOrderBy(args.orderBy));
        }
        if (args.take) {
            query = query.limit(args.take);
        }
        const docs = await query.exec();
        return docs.map((d: any) => this.toPojo(d));
    }

    async findUnique(args: any) {
        let query = this.model.findOne(this.convertWhere(args.where));
        query = this.applyInclude(query, args.include);
        const doc = await query.exec();
        return this.toPojo(doc);
    }

    async findFirst(args: any) {
        let query = this.model.findOne(this.convertWhere(args.where));
        if (args.orderBy) {
            query = query.sort(this.convertOrderBy(args.orderBy));
        }
        query = this.applyInclude(query, args.include);
        const doc = await query.exec();
        return this.toPojo(doc);
    }

    async create(args: any) {
        const data = { ...args.data };
        const context = userContext.getStore();
        if (context?.userId && !data.userId) {
            data.userId = context.userId;
        }
        const doc = new this.model(data);
        await doc.save();
        return this.toPojo(doc);
    }

    async update(args: any) {
        const doc = await this.model.findOneAndUpdate(
            this.convertWhere(args.where),
            args.data,
            { new: true, runValidators: true }
        );
        return this.toPojo(doc);
    }

    async delete(args: any) {
        const doc = await this.model.findOneAndDelete(this.convertWhere(args.where));
        return this.toPojo(doc);
    }

    async deleteMany(args: any = {}) {
        return await this.model.deleteMany(this.convertWhere(args.where));
    }

    async upsert(args: any) {
        const context = userContext.getStore();
        const filter = this.convertWhere(args.where);

        const existing = await this.model.findOne(filter);
        if (existing) {
            const doc = await this.model.findOneAndUpdate(filter, args.update, { new: true });
            return this.toPojo(doc);
        } else {
            const data = { ...args.create };
            if (context?.userId && !data.userId) {
                data.userId = context.userId;
            }
            const doc = new this.model(data);
            await doc.save();
            return this.toPojo(doc);
        }
    }
}

export const prisma = {
    asset: new PrismaModelShim(Asset),
    assetTransaction: new PrismaModelShim(AssetTransaction),
    priceCache: new PrismaModelShim(PriceCache),
    portfolioSnapshot: new PrismaModelShim(PortfolioSnapshot),
    alertRule: new PrismaModelShim(AlertRule),
    alertEvent: new PrismaModelShim(AlertEvent),
    telegramIntegration: new PrismaModelShim(TelegramIntegration),
    $transaction: async (callback: (tx: any) => Promise<any>) => {
        // Simple shim for transactions - just run the callback with prisma itself
        return await callback(prisma);
    }
};
