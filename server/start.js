import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import express from 'express';
import { createIdentityService } from './identity/identityService.js';
import { registerIdentityRoutes } from './identity/routes.js';
import { initialiseIdentitySchema } from './identity/schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const dataDir = path.resolve(process.env.DATA_DIR || path.join(projectRoot, 'data'));
const databasePath = path.join(dataDir, 'apexorder.sqlite');

let application = null;
const originalInit = express.application.init;
express.application.init = function patchedInit(...args) {
  const result = originalInit.apply(this, args);
  application = this;
  return result;
};

await import('./index.js');
express.application.init = originalInit;

if (!application) {
  throw new Error('Unable to initialise the ApexOrder Express application.');
}

fs.mkdirSync(dataDir, { recursive: true });
const identityDb = new Database(databasePath);
identityDb.pragma('journal_mode = WAL');
identityDb.pragma('foreign_keys = ON');
identityDb.pragma('busy_timeout = 5000');

initialiseIdentitySchema(identityDb);
const identityService = createIdentityService(identityDb);
registerIdentityRoutes(application, identityService);

console.log('Player identity API: enabled');
