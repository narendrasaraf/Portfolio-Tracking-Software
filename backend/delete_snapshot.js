
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const assets = await prisma.asset.findMany({
        include: { transactions: true }
    });
    console.log('--- EXHAUSTIVE DEBUG ---');
    assets.forEach(a => {
        console.log(`ASSET: ${a.name} (${a.type})`);
        console.log(`  ManualPrice: ${a.manualPrice}`);
        console.log(`  ManualCurrentValue: ${a.manualCurrentValue}`);
        a.transactions.forEach(t => {
            console.log(`  TX: ${t.type} | Qty: ${t.quantity} | PPU: ${t.pricePerUnit} | Date: ${t.date}`);
        });
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
