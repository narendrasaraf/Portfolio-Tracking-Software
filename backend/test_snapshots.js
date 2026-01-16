const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { createDailySnapshot } = require('./src/controllers/portfolioController');

async function test() {
    console.log('--- Testing Portfolio Snapshot ---');

    // 1. Manually trigger snapshot
    await createDailySnapshot();

    // 2. Verify in DB
    const snapshots = await prisma.portfolioSnapshot.findMany();
    console.log('Snapshots found:', JSON.stringify(snapshots, null, 2));

    if (snapshots.length > 0) {
        console.log('SUCCESS: Snapshot created successfully.');
    } else {
        console.log('FAILURE: No snapshots found.');
    }
}

test()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
