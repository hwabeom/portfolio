import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envFile = path.join(root, '.env');
if (existsSync(envFile)) process.loadEnvFile(envFile);

const env = process.env;

export const config = {
  root,
  publicDir: path.join(root, 'public'),
  dataDir: path.resolve(root, env.DATA_DIR || 'data'),
  port: Number(env.PORT) || 3000,
  isProd: env.NODE_ENV === 'production'
};
