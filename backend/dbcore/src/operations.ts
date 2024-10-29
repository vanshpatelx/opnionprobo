// processFunctions.ts
import { Pool } from 'pg';
import { User } from './types'; // Adjust the import path according to your structure
import { pool } from './postgres'; // PostgreSQL Pool
import { retryOperation } from './retry'; // Retry Logic
    
async function processUsersBatch(users: User[]): Promise<void> {
    if (users.length === 0) return;

    const query = `
        INSERT INTO Users (username, password, role)
        VALUES ${users.map((_, index) => `($${index * 3 + 1}, $${index * 3 + 2}, $${index * 3 + 3})`).join(', ')}
    `;

    const values = users.flatMap(user => [user.username, user.password, user.role]);

    await pool.query(query, values); // Insert into PostgreSQL
    console.log(`Processed ${users.length} users.`);
}


// Usage example for batch processing
async function processUsersInBatch(users: User[]) {
    // Here you can set a batch size limit
    const batchSize = 10;
    for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize);
        await retryOperation(() => processUsersBatch(batch));
    }
}

export { processUsersBatch, processUsersInBatch };



try {
    await client.connect();
    
    // Prepare the SQL query
    const values: string[] = [];
    const placeholders: string[] = [];
    
    users.forEach((user, index) => {
        const idx = index + 1;
        values.push(`('${user.username}', '${user.email}', '${user.password}', NOW())`);
        placeholders.push(`($${idx}, $${idx + 1}, $${idx + 2}, NOW())`);
    });

    // Join the values
    const sql = `INSERT INTO users (username, email, password, created_at) VALUES ${values.join(', ')}`;

    // Execute the SQL query
    await client.query(sql);
    console.log('Users inserted successfully.');
} catch (error) {
    console.error('Error inserting users:', error);
} finally {
    await client.end();
}
