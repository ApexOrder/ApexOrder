import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const dataDir = path.resolve(process.env.DATA_DIR || path.join(projectRoot, 'data'));
const databasePath = path.join(dataDir, 'apexorder.sqlite');
const port = Number(process.env.PORT || 3001);

fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(databasePath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS entities (
    entity_type TEXT NOT NULL,
    id TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (entity_type, id)
  );

  CREATE INDEX IF NOT EXISTS idx_entities_type_created
    ON entities (entity_type, created_at DESC);
`);

const listEntities = db.prepare(`
  SELECT id, data, created_at, updated_at
  FROM entities
  WHERE entity_type = ?
`);

const getEntity = db.prepare(`
  SELECT id, data, created_at, updated_at
  FROM entities
  WHERE entity_type = ? AND id = ?
`);

const insertEntity = db.prepare(`
  INSERT INTO entities (entity_type, id, data, created_at, updated_at)
  VALUES (@entityType, @id, @data, @createdAt, @updatedAt)
`);

const updateEntity = db.prepare(`
  UPDATE entities
  SET data = @data, updated_at = @updatedAt
  WHERE entity_type = @entityType AND id = @id
`);

const deleteEntity = db.prepare(`
  DELETE FROM entities
  WHERE entity_type = ? AND id = ?
`);

function normaliseEntityType(value) {
  const entityType = String(value || '').trim();

  if (!/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(entityType)) {
    throw new Error('Invalid entity type.');
  }

  return entityType;
}

function parseRow(row) {
  if (!row) return null;

  const data = JSON.parse(row.data);

  return {
    ...data,
    id: row.id,
    created_date: data.created_date || row.created_at,
    updated_date: row.updated_at,
  };
}

function matchesFilters(item, filters) {
  return Object.entries(filters).every(([key, expected]) => {
    const actual = item[key];

    if (Array.isArray(expected)) {
      return expected.includes(actual);
    }

    if (expected && typeof expected === 'object') {
      if ('$in' in expected && Array.isArray(expected.$in)) {
        return expected.$in.includes(actual);
      }

      if ('$ne' in expected) {
        return actual !== expected.$ne;
      }
    }

    return actual === expected;
  });
}

function sortItems(items, sortExpression) {
  if (!sortExpression) return items;

  const descending = sortExpression.startsWith('-');
  const key = descending ? sortExpression.slice(1) : sortExpression;

  return [...items].sort((left, right) => {
    const a = left[key];
    const b = right[key];

    if (a === b) return 0;
    if (a === undefined || a === null) return 1;
    if (b === undefined || b === null) return -1;

    const result = String(a).localeCompare(String(b), undefined, {
      numeric: true,
      sensitivity: 'base',
    });

    return descending ? -result : result;
  });
}

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_request, response) => {
  response.json({
    ok: true,
    database: databasePath,
  });
});

app.get('/api/entities/:entityType', (request, response) => {
  try {
    const entityType = normaliseEntityType(request.params.entityType);
    let items = listEntities.all(entityType).map(parseRow);

    if (request.query.filters) {
      const filters = JSON.parse(String(request.query.filters));
      items = items.filter((item) => matchesFilters(item, filters));
    }

    items = sortItems(items, String(request.query.sort || ''));
    response.json(items);
  } catch (error) {
    response.status(400).json({ error: error.message });
  }
});

app.get('/api/entities/:entityType/:id', (request, response) => {
  try {
    const entityType = normaliseEntityType(request.params.entityType);
    const item = parseRow(getEntity.get(entityType, request.params.id));

    if (!item) {
      return response.status(404).json({ error: 'Item not found.' });
    }

    response.json(item);
  } catch (error) {
    response.status(400).json({ error: error.message });
  }
});

app.post('/api/entities/:entityType', (request, response) => {
  try {
    const entityType = normaliseEntityType(request.params.entityType);
    const id = String(request.body?.id || crypto.randomUUID());
    const now = new Date().toISOString();
    const data = {
      ...(request.body || {}),
      id,
      created_date: request.body?.created_date || now,
      updated_date: now,
    };

    insertEntity.run({
      entityType,
      id,
      data: JSON.stringify(data),
      createdAt: data.created_date,
      updatedAt: now,
    });

    response.status(201).json(data);
  } catch (error) {
    const status = String(error.message).includes('UNIQUE') ? 409 : 400;
    response.status(status).json({ error: error.message });
  }
});

app.put('/api/entities/:entityType/:id', (request, response) => {
  try {
    const entityType = normaliseEntityType(request.params.entityType);
    const existing = parseRow(getEntity.get(entityType, request.params.id));

    if (!existing) {
      return response.status(404).json({ error: 'Item not found.' });
    }

    const now = new Date().toISOString();
    const data = {
      ...existing,
      ...(request.body || {}),
      id: request.params.id,
      created_date: existing.created_date,
      updated_date: now,
    };

    updateEntity.run({
      entityType,
      id: request.params.id,
      data: JSON.stringify(data),
      updatedAt: now,
    });

    response.json(data);
  } catch (error) {
    response.status(400).json({ error: error.message });
  }
});

app.delete('/api/entities/:entityType/:id', (request, response) => {
  try {
    const entityType = normaliseEntityType(request.params.entityType);
    const result = deleteEntity.run(entityType, request.params.id);

    if (!result.changes) {
      return response.status(404).json({ error: 'Item not found.' });
    }

    response.status(204).end();
  } catch (error) {
    response.status(400).json({ error: error.message });
  }
});

const distDir = path.join(projectRoot, 'dist');

if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));

  app.get('*', (request, response, next) => {
    if (request.path.startsWith('/api/')) return next();
    response.sendFile(path.join(distDir, 'index.html'));
  });
}

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ error: 'Internal server error.' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`ApexOrder running on http://0.0.0.0:${port}`);
  console.log(`SQLite database: ${databasePath}`);
});
