import express from 'express';
import { initializePostgres } from './db/postgresInit';
import { initializeCassandra } from './db/cassandraInit';
import { startConsuming } from './db/rabbitMQConsumer';

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.send('health!');
});

Promise.all([initializePostgres(), initializeCassandra()])
  .then(() => startConsuming())
  .then(() => {
    const PORT = 3000;
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize:', err);
    process.exit(1);
  });
