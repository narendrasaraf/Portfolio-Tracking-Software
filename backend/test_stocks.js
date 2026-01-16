const { fetchYahooStockQuotes } = require('./src/services/stockService');

async function test() {
    const symbols = ['RELIANCE.NS', 'TCS.NS', 'INFY.NS'];
    console.log('Fetching quotes for:', symbols);
    const quotes = await fetchYahooStockQuotes(symbols);
    console.log('Quotes received:');
    quotes.forEach((price, symbol) => {
        console.log(`${symbol}: ₹${price}`);
    });
}

test().catch(console.error);
