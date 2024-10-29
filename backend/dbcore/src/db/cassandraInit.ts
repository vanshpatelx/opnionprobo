import { Client } from 'cassandra-driver';

const client = new Client({
    contactPoints: ['localhost'],
    localDataCenter: 'datacenter1',
    pooling: {
        coreConnectionsPerHost: {
            [0]: 2,
        },
        maxRequestsPerConnection: 2,
        heartBeatInterval: 30000,
        warmup: true,
    },
});

async function initializeCassandra() {
    try {
        await client.connect();
        
        const createKeyspace = `
            CREATE KEYSPACE IF NOT EXISTS mykeyspace
            WITH REPLICATION = {
                'class': 'SimpleStrategy',
                'replication_factor': 1
            }
        `;
        await client.execute(createKeyspace);
        console.log('Keyspace created or already exists.');

        const createOrdersTable = `
            CREATE TABLE IF NOT EXISTS mykeyspace.orders (
                id UUID PRIMARY KEY,
                eventId UUID,
                side TEXT,
                type TEXT,
                qty INT,
                price DECIMAL,
                timestamp TIMESTAMP,
                filledQuantity INT,
                status TEXT
            )
        `;

        const createTradesTable = `
            CREATE TABLE IF NOT EXISTS mykeyspace.trades (
                id UUID PRIMARY KEY,
                buyerId UUID,
                sellerId UUID,
                qty INT,
                price DECIMAL,
                eventId UUID,
                timestamp TIMESTAMP
            )
        `;

        await client.execute(createOrdersTable);
        await client.execute(createTradesTable);

        console.log('Cassandra initialized and tables created successfully.');
    } catch (error) {
        console.error('Error initializing Cassandra:', error);
    }
}

export { client, initializeCassandra };
