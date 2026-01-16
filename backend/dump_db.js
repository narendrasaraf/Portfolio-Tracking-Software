const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const assets = await prisma.asset.findMany();
    const prices = await prisma.priceCache.findMany();

    console.log('JSON_START');
    console.log(JSON.stringify({ assets, prices }, null, 2));
    console.log('JSON_END');
}

main().catch(console.error).finally(() => prisma.$disconnect());
