import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { createApp } from './app.js';

async function startServer(): Promise<void> {
  await connectDatabase();
  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`Procurement backend listening on http://localhost:${env.PORT}${env.API_PREFIX}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start backend', error);
  process.exit(1);
});
