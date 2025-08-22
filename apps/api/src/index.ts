import { config } from './env';
import { createServer } from './server';

async function start() {
  try {
    const server = await createServer();

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
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

start();
