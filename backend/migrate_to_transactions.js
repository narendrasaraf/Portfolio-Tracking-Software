const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
    try {
        console.log('Starting migration to transactions...');
        const assets = await prisma.asset.findMany({
            include: { transactions: true }
        });

        for (const asset of assets) {
            if (asset.transactions.length === 0) {
                console.log(`Migrating asset: ${asset.name} (${asset.symbol})`);

                // If it's CASH, we treat it as a deposit/BUY
                // If quantity is missing but investedAmount is present (common in earlier versions or specific types), 
                // we handle appropriately.
                const qty = asset.quantity || 1;
                const inv = asset.investedAmount || 0;

                await prisma.assetTransaction.create({
                    data: {
                        assetId: asset.id,
                        type: 'BUY',
                        quantity: qty,
                        pricePerUnit: inv / qty,
                        fees: 0,
                        notes: 'Initial migration from legacy manual balance',
                        date: asset.createdAt || new Date()
                    }
                });
                console.log(`Created BUY transaction for ${asset.name}`);
            } else {
                console.log(`Skipping asset ${asset.name}, transactions already exist.`);
            }
        }
        console.log('Migration completed successfully!');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

migrate();
