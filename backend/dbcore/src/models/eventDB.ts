import { pool } from '../db/postgresInit';

interface Event {
    id: string;
    name: string;
    endTime: Date;
    description: string;
    sourceOfTruth: string;
}

const events: Event[] = [];
let timer: NodeJS.Timeout;

timer = setInterval(() => {
    if (events.length >= 10) {
        processEventsBatch("INSERT", [...events]);
        events.length = 0;
    }
}, 1000);

function processEvent(event: Event) {
    events.push(event);
    if (events.length >= 10) {
        processEventsBatch("INSERT", [...events]);
        events.length = 0;
    }
}

function buildQuery(operation: string, eventsBatch: Event[]): string {
    switch (operation) {
        case "INSERT":
            const values = eventsBatch.map(event =>
                `('${event.name}', '${event.endTime.toISOString()}', '${event.description}', '${event.sourceOfTruth}')`
            ).join(', ');
            return `INSERT INTO Events (name, endTime, description, sourceOfTruth) VALUES ${values} RETURNING *`;

        case "UPDATE_NAME":
            return eventsBatch.map(event =>
                `UPDATE Events SET name = '${event.name}' WHERE id = '${event.id}'`
            ).join("; ");
    }
    return '';
}

async function processEventsBatch(
    operation: string,
    eventsBatch: Event[],
    retryCount = 0,
    maxRetries = 3,
    retryDelay = 2000
) {
    const client = await pool.connect();
    try {
        const sql = buildQuery(operation, eventsBatch);
        if (sql) {
            await client.query(sql);
            console.log(`Events batch ${operation.toLowerCase()}d successfully.`);
        } else {
            console.error('No valid SQL query generated.');
        }
    } catch (error) {
        console.error(`Error ${operation.toLowerCase()}ing events (attempt ${retryCount + 1}):`, error);

        if (retryCount < maxRetries) {
            console.log(`Retrying in ${retryDelay / 1000} seconds...`);
            setTimeout(() => processEventsBatch(operation, eventsBatch, retryCount + 1, maxRetries, retryDelay), retryDelay);
        } else {
            console.error(`Max retry attempts reached. Events could not be ${operation.toLowerCase()}d.`);
        }
    } finally {
        client.release();
    }
}

async function updateEventName(events: Event[]) {
    await processEventsBatch("UPDATE_NAME", events);
}

export { processEvent, updateEventName };
