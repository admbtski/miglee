import { createServer } from './server';
import { env } from './env';

async function start() {
  try {
    const server = await createServer();

    await server.listen({
      port: env.PORT,
      host: '0.0.0.0',
    });

    console.log(`🚀 Server running at http://localhost:${env.PORT}`);
    console.log(`📊 GraphQL endpoint: http://localhost:${env.PORT}/graphql`);
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

start();
