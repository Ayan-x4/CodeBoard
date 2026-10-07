import { createServer } from './app';
import { existsSync } from 'node:fs';

if (existsSync('.env')) process.loadEnvFile('.env');
const port = Number(process.env.PORT ?? 3001);
createServer().listen(port, () => console.info(`CodeBoard API listening on http://localhost:${port}`));
