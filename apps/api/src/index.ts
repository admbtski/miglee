import { config } from './env';
// import { startOtel, stopOtel } from './lib/otel';
import { createServer } from './server';

async function start() {
  // await startOtel();
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
    // await stopOtel();
    console.error('Error starting server:', error);
  }

  const shutdown = async () => {
    server.log.info('Shutting down...');

    try {
      await server.close();
    } catch {}
    try {
      // await stopOtel();
    } catch {}
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start();
