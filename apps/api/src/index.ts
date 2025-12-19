import { config } from './env';
import { createServer } from './server';

async function start() {
  const server = await createServer();

  try {
    await server.listen({
      host: config.host,
      port: config.port,
    });

    const infos = [
      `🚀 Server running at http://${config.host}:${config.port}`,
      `🌍 GraphQL endpoint: http://${config.host}:${config.port}/graphql`,
      `🦄 WS endpoint: ws://${config.host}:${config.port}/graphql`,
    ];

    infos.forEach((info) => server.log.info(info));
  } catch (error) {
    server.log.error({ error }, 'Error starting server');
    process.exit(1);
  }

  // Note: Graceful shutdown is handled by graceful-shutdown plugin
}

start();
