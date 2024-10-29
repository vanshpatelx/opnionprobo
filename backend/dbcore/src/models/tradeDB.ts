import { client } from '../db/cassandraInit';
import { v4 as uuidv4 } from 'uuid';

interface Trade {
    buyerId: string;
    sellerId: string;
    qty: number;
    price: number;
    eventId: string;
    timestamp: Date;
}

const trades: Trade[] = [];
let timer: NodeJS.Timeout;

timer = setInterval(() => {
    if (trades.length >= 10) {
        processTradesBatch("INSERT", [...trades]);
        trades.length = 0;
    }
}, 1000);

function processTrade(trade: Trade) {
    trades.push(trade);
    if (trades.length >= 10) {
        processTradesBatch("INSERT", [...trades]);
        trades.length = 0;
    }
}

function buildQuery(operation: string, tradesBatch: Trade[]): string {
    switch (operation) {
        case "INSERT":
            const values = tradesBatch.map(trade =>
                `(${uuidv4()}, '${trade.buyerId}', '${trade.sellerId}', ${trade.qty}, ${trade.price}, '${trade.eventId}', toTimestamp(now()))`
            ).join(', ');
            return `INSERT INTO mykeyspace.trades (id, buyerId, sellerId, qty, price, eventId, timestamp) VALUES ${values}`;
    }
    return 'NOTHING';
}

async function processTradesBatch(
    operation: string,
    tradesBatch: Trade[],
    retryCount = 0,
    maxRetries = 3,
    retryDelay = 2000
) {
    try {
        await client.connect();
        const sql = buildQuery(operation, tradesBatch);
        
        await client.execute(sql);
        console.log(`Trades batch ${operation.toLowerCase()}d successfully.`);
    } catch (error) {
        console.error(`Error ${operation.toLowerCase()}ing trades (attempt ${retryCount + 1}):`, error);

        if (retryCount < maxRetries) {
            console.log(`Retrying in ${retryDelay / 1000} seconds...`);
            setTimeout(() => processTradesBatch(operation, tradesBatch, retryCount + 1, maxRetries, retryDelay), retryDelay);
        } else {
            console.error(`Max retry attempts reached. Trades could not be ${operation.toLowerCase()}d.`);
        }
    } finally {
        await client.shutdown();
    }
}

export { processTrade };
