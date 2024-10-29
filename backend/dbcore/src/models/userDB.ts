import { pool } from '../db/postgresInit';

interface User {
    id: string;
    username: string;
    password: string;
    role: string;
}

const users: User[] = [];
let timer: NodeJS.Timeout;

timer = setInterval(() => {
    if (users.length > 0) {
        processUsersBatch("INSERT", [...users]);
        users.length = 0;
    }
}, 1000);

function processUser(user: User) {
    users.push(user);
    if (users.length >= 10) {
        processUsersBatch("INSERT", [...users]);
        users.length = 0;
    }
}

function buildQuery(operation: string, usersBatch: User[]): string {
    switch (operation) {
        case "INSERT":
            const values = usersBatch.map(user =>
                `(${user.id}, ('${user.username}', '${user.password}', '${user.role}')`
            ).join(', ');
            return `INSERT INTO Users (id, username, password, role) VALUES ${values} RETURNING *`;

        case "UPDATE_PASSWORD":
            return usersBatch.map(user =>
                `UPDATE Users SET password = '${user.password}' WHERE id = '${user.id}'`
            ).join("; ");
    }
    return '';
}

async function processUsersBatch(
    operation: string,
    usersBatch: User[],
    retryCount = 0,
    maxRetries = 3,
    retryDelay = 2000
) {
    const client = await pool.connect();
    try {
        const sql = buildQuery(operation, usersBatch);
        if (sql) {
            await client.query(sql);
            console.log(`Users batch ${operation.toLowerCase()}d successfully.`);
        } else {
            console.error('No valid SQL query generated.');
        }
    } catch (error) {
        console.error(`Error ${operation.toLowerCase()}ing users (attempt ${retryCount + 1}):`, error);

        if (retryCount < maxRetries) {
            console.log(`Retrying in ${retryDelay / 1000} seconds...`);
            setTimeout(() => processUsersBatch(operation, usersBatch, retryCount + 1, maxRetries, retryDelay), retryDelay);
        } else {
            console.error(`Max retry attempts reached. Users could not be ${operation.toLowerCase()}d.`);
        }
    } finally {
        client.release();
    }
}

async function updateUserPassword(users: User[]) {
    await processUsersBatch("UPDATE_PASSWORD", users);
}

export { processUser, updateUserPassword };
