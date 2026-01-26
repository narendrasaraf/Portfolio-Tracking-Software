import { User } from './src/models/User';
import { Asset } from './src/models/Asset';
import { AssetTransaction } from './src/models/AssetTransaction';
import { PriceCache } from './src/models/PriceCache';
import { PortfolioSnapshot } from './src/models/PortfolioSnapshot';
import { AlertRule } from './src/models/AlertRule';
import { AlertEvent } from './src/models/AlertEvent';
import { connectMongo } from './src/db/mongo';
import mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function migrate() {
    await connectMongo();

    // 1. Create default admin user
    const email = 'admin@portfolio.com';
    let user = await User.findOne({ email });
    if (!user) {
        const passwordHash = await bcrypt.hash('admin123', 10);
        user = await User.create({ email, passwordHash });
        console.log('Created default admin user: admin@portfolio.com / admin123');
    }

    const userId = user._id;

    // 2. Assign all existing data to this user
    const models: any[] = [Asset, AssetTransaction, PriceCache, PortfolioSnapshot, AlertRule, AlertEvent];

    for (const model of models) {
        const result = await model.updateMany(
            { userId: { $exists: false } },
            { $set: { userId } }
        );
        console.log(`Updated records in ${model.modelName}`);
    }

    console.log('Migration complete');
    process.exit(0);
}

migrate().catch(err => {
    console.error(err);
    process.exit(1);
});
