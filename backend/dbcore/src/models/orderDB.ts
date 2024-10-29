import { client } from '../db/cassandraInit';
import { v4 as uuidv4 } from 'uuid';

interface Order {
    eventId: string;
    side: 'yes' | 'no';
    type: 'buy' | 'sell';
    qty: number;
    price: number;
    filledQuantity: number;
    status: 'Not Executed' | 'Partial' | 'Done';
}

const orders: Order[] = [];
let timer: NodeJS.Timeout;

timer = setInterval(() => {
    if (orders.length >= 10) {
        processOrdersBatch("INSERT", [...orders]);
        orders.length = 0;
    }
}, 1000);

function processOrder(order: Order) {
    orders.push(order);
    if (orders.length >= 10) {
        processOrdersBatch("INSERT", [...orders]);
        orders.length = 0;
    }
}

function buildQuery(operation: string, ordersBatch: Order[]) : string {
    switch (operation) {
        case "INSERT":
            const values: string[] = ordersBatch.map((order) =>
                `(${uuidv4()}, '${order.eventId}', '${order.side}', '${order.type}', ${order.qty}, ${order.price}, ${order.filledQuantity}, '${order.status}', toTimestamp(now()))`
            );
            return `INSERT INTO mykeyspace.orders (id, eventId, side, type, qty, price, filledQuantity, status, timestamp) VALUES ${values.join(', ')}`;
        
        case "UPDATE_STATUS":
            return ordersBatch.map(order =>
                `UPDATE mykeyspace.orders SET status = '${order.status}' WHERE eventId = '${order.eventId}'`
            ).join("; ");
    }
    return 'NOTHING';
}

async function processOrdersBatch(
    operation: string, 
    ordersBatch: Order[], 
    retryCount = 0, 
    maxRetries = 3, 
    retryDelay = 2000
) {
    try {
        await client.connect();

        const sql = buildQuery(operation, ordersBatch);
        
        await client.execute(sql);
        console.log(`Orders batch ${operation.toLowerCase()}d successfully.`);
    } catch (error) {
        console.error(`Error ${operation.toLowerCase()}ing orders (attempt ${retryCount + 1}):`, error);

        if (retryCount < maxRetries) {
            console.log(`Retrying in ${retryDelay / 1000} seconds...`);
            setTimeout(() => processOrdersBatch(operation, ordersBatch, retryCount + 1, maxRetries, retryDelay), retryDelay);
        } else {
            console.error(`Max retry attempts reached. Orders could not be ${operation.toLowerCase()}d.`);
        }
    } finally {
        await client.shutdown();
    }
}

function updateOrderStatus(orders: Order[]) {
    processOrdersBatch("UPDATE_STATUS", orders);
}

export { processOrder, updateOrderStatus };
