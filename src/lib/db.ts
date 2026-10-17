import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "crypto";
import fs from "fs";
import path from "path";
import { DatabaseSync } from "node:sqlite";
import { isUuid } from "@/lib/ids";
import type { Prayer } from "@/lib/types";

type Row = {
  id: string;
  name: string | null;
  body: string;
  category: string | null;
  prayed_count: number;
  answered: number;
  praise: string | null;
  created_at: string;
  answered_at: string | null;
  owner_token_hash: string;
};

type Seed = {
  id: string;
  name: string | null;
  body: string;
  category: string;
  prayedCount: number;
  answered: boolean;
  praise: string | null;
  hoursAgo: number;
  answeredHoursAgo?: number;
  ownerTokenHash: string;
};

const SEEDS: Seed[] = [
  {
    id: "3f1c2a74-6b0e-4d8a-9c31-0a7e5b1d4c21",
    name: "Miriam",
    category: "gratitude",
    prayedCount: 18,
    answered: true,
    hoursAgo: 1,
    answeredHoursAgo: 0.4,
    ownerTokenHash: "55221d90f8d1e409f45c882cb22cad9b45cb70224ebc475062ef8dfe76977bd3",
    body: "I asked for prayer before my follow-up scan last week. I was more afraid of the waiting room than the results.",
    praise:
      "The scan was clear. We sat in the car and cried, then called my sister. Thank you for holding this with us.",
  },
  {
    id: "8c4e9a12-1d55-4f7b-a6e0-2b9c7d3f8a44",
    name: "Elena",
    category: "health",
    prayedCount: 14,
    answered: false,
    hoursAgo: 5,
    ownerTokenHash: "cfabd0549a33150af8a81b56333a00ba1233cb3763925611eae0eb591bb16b29",
    body: "My dad has a heart procedure on Thursday morning. Please pray for his doctors, and for my mom, who will be in the waiting room alone until I can get there.",
    praise: null,
  },
  {
    id: "e7a1c903-5b28-4e6d-8f14-6c0d2a9b7e55",
    name: null,
    category: "family",
    prayedCount: 7,
    answered: false,
    hoursAgo: 20,
    ownerTokenHash: "d6b6ee8416c14b33a0d112e259d0b7cd6e22e8aff0ad914438b6b19adc081181",
    body: "We need to have a hard conversation with our teenager this weekend. Pray that we listen first, and that they feel safe enough to tell us the truth.",
    praise: null,
  },
  {
    id: "0d6f4b88-9a17-4c3e-b521-7e8a1c4d6f90",
    name: "James",
    category: "work",
    prayedCount: 9,
    answered: false,
    hoursAgo: 30,
    ownerTokenHash: "642208d3c3040ba2417d6cb8c481235b63dcd0fc5a19e5861f72fa82d1f5d2d0",
    body: "After four months of searching, I have a final interview on Tuesday. Pray for a clear mind, and for peace if this is not the right door.",
    praise: null,
  },
  {
    id: "b2e8d451-3c7a-4b9f-9d06-1f5a8c2e7b33",
    name: null,
    category: "grief",
    prayedCount: 21,
    answered: false,
    hoursAgo: 52,
    ownerTokenHash: "438240d03a921cedb8094a2d2e1b167e7519b5be41a942b95fcb4805606f91fc",
    body: "Sunday is the anniversary of my sister's death. Please pray for my parents, especially in the quiet after church.",
    praise: null,
  },
  {
    id: "6a9c1e70-4d2b-4a8e-8c55-3b7f0d1a9e26",
    name: "Priya",
    category: "guidance",
    prayedCount: 4,
    answered: false,
    hoursAgo: 80,
    ownerTokenHash: "42a967c90f20ec41ef40ff295f4b916844df527db24f5e6157838a6bdada123d",
    body: "I'm deciding whether to move closer to my parents. I don't need a sign so much as honesty about what I already know.",
    praise: null,
  },
  {
    id: "f4c0a6d2-8e19-4b7c-a3d4-5e1b9c8a0f77",
    name: "Samuel",
    category: "community",
    prayedCount: 11,
    answered: false,
    hoursAgo: 120,
    ownerTokenHash: "b44bff82e308f56d35553b6ca05d0a58158c36603e966db88b15958bbf4fdaaf",
    body: "Our neighborhood supper is Saturday and we are short a few volunteers. Pray for enough hands, and for anyone who comes in hungry to leave feeling welcome.",
    praise: null,
  },
];

const globalForDb = globalThis as unknown as { hearthDb?: DatabaseSync };

function toPrayer(row: Row): Prayer {
  return {
    id: row.id,
    name: row.name,
    body: row.body,
    category: row.category,
    prayedCount: Number(row.prayed_count),
    answered: Number(row.answered) === 1,
    praise: row.praise,
    createdAt: row.created_at,
    answeredAt: row.answered_at,
  };
}

function seed(db: DatabaseSync) {
  const insert = db.prepare(`
    INSERT INTO requests (
      id, name, body, category, prayed_count, answered, praise, created_at, answered_at, owner_token_hash
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const now = Date.now();
  const iso = (hours: number) => new Date(now - hours * 60 * 60 * 1000).toISOString();

  db.exec("BEGIN");
  try {
    for (const item of SEEDS) {
      if (!isUuid(item.id)) {
        throw new Error(`Invalid seed id ${item.id}`);
      }
      insert.run(
        item.id,
        item.name,
        item.body,
        item.category,
        item.prayedCount,
        item.answered ? 1 : 0,
        item.praise,
        iso(item.hoursAgo),
        item.answered ? iso(item.answeredHoursAgo ?? 1) : null,
        item.ownerTokenHash,
      );
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function getDb(): DatabaseSync {
  if (globalForDb.hearthDb) return globalForDb.hearthDb;

  const dir = path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  const db = new DatabaseSync(path.join(dir, "prayers.db"));
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 3000;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS requests (
      id TEXT PRIMARY KEY,
      name TEXT,
      body TEXT NOT NULL,
      category TEXT,
      prayed_count INTEGER NOT NULL DEFAULT 0,
      answered INTEGER NOT NULL DEFAULT 0,
      praise TEXT,
      created_at TEXT NOT NULL,
      answered_at TEXT,
      owner_token_hash TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS prayers (
      request_id TEXT NOT NULL,
      client_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (request_id, client_id)
    );
    CREATE INDEX IF NOT EXISTS idx_requests_created ON requests (created_at DESC);
  `);

  const count = db.prepare("SELECT COUNT(*) AS n FROM requests").get() as { n: number };
  if (Number(count.n) === 0) seed(db);

  globalForDb.hearthDb = db;
  return db;
}

export function listPrayers(): Prayer[] {
  const rows = getDb()
    .prepare("SELECT * FROM requests ORDER BY created_at DESC LIMIT 200")
    .all() as Row[];
  return rows.map(toPrayer);
}

export function listPrayersByIds(ids: string[]): Prayer[] {
  const unique = [...new Set(ids)].filter(isUuid).slice(0, 50);
  if (unique.length === 0) return [];
  const placeholders = unique.map(() => "?").join(", ");
  const rows = getDb()
    .prepare(`SELECT * FROM requests WHERE id IN (${placeholders})`)
    .all(...unique) as Row[];
  const byId = new Map(rows.map((row) => [row.id, toPrayer(row)]));
  return ids.flatMap((id) => {
    const prayer = byId.get(id);
    return prayer ? [prayer] : [];
  });
}

export function getPrayer(id: string): Prayer | null {
  if (!isUuid(id)) return null;
  const row = getDb().prepare("SELECT * FROM requests WHERE id = ?").get(id) as Row | undefined;
  return row ? toPrayer(row) : null;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function tokenMatches(token: string, expectedHash: string): boolean {
  const actual = Buffer.from(hashToken(token));
  const expected = Buffer.from(expectedHash);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export function createPrayer(input: {
  name: string | null;
  body: string;
  category: string | null;
}): { prayer: Prayer; ownerToken: string } {
  const id = crypto.randomUUID();
  const ownerToken = randomBytes(32).toString("hex");
  const createdAt = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO requests (
        id, name, body, category, prayed_count, answered, praise, created_at, answered_at, owner_token_hash
      ) VALUES (?, ?, ?, ?, 0, 0, NULL, ?, NULL, ?)`,
    )
    .run(id, input.name, input.body, input.category, createdAt, hashToken(ownerToken));

  const prayer = getPrayer(id);
  if (!prayer) throw new Error("Request was not saved.");
  return { prayer, ownerToken };
}

export function recordPrayer(
  id: string,
  clientId: string,
): { prayedCount: number; alreadyPrayed: boolean } | null {
  if (!isUuid(id) || !isUuid(clientId)) return null;
  const db = getDb();
  const existing = db.prepare("SELECT id FROM requests WHERE id = ?").get(id);
  if (!existing) return null;

  db.exec("BEGIN IMMEDIATE");
  try {
    const inserted = db
      .prepare("INSERT OR IGNORE INTO prayers (request_id, client_id, created_at) VALUES (?, ?, ?)")
      .run(id, clientId, new Date().toISOString());
    if (Number(inserted.changes) === 1) {
      db.prepare("UPDATE requests SET prayed_count = prayed_count + 1 WHERE id = ?").run(id);
    }
    const row = db.prepare("SELECT prayed_count FROM requests WHERE id = ?").get(id) as {
      prayed_count: number;
    };
    db.exec("COMMIT");
    return {
      prayedCount: Number(row.prayed_count),
      alreadyPrayed: Number(inserted.changes) === 0,
    };
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function markAnswered(
  id: string,
  ownerToken: string,
  praise: string | null,
):
  | { ok: true; prayer: Prayer }
  | { ok: false; status: number; error: string } {
  if (!isUuid(id)) {
    return { ok: false, status: 404, error: "That request could not be found." };
  }

  const db = getDb();
  db.exec("BEGIN IMMEDIATE");
  try {
    const row = db
      .prepare("SELECT owner_token_hash, answered FROM requests WHERE id = ?")
      .get(id) as { owner_token_hash: string; answered: number } | undefined;
    if (!row) {
      db.exec("ROLLBACK");
      return { ok: false, status: 404, error: "That request could not be found." };
    }
    if (Number(row.answered) === 1) {
      db.exec("ROLLBACK");
      return { ok: false, status: 409, error: "This request is already marked answered." };
    }
    if (!tokenMatches(ownerToken, row.owner_token_hash)) {
      db.exec("ROLLBACK");
      return {
        ok: false,
        status: 403,
        error: "Only the browser that posted this request can mark it answered.",
      };
    }
    db.prepare(
      "UPDATE requests SET answered = 1, praise = ?, answered_at = ? WHERE id = ?",
    ).run(praise, new Date().toISOString(), id);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  const prayer = getPrayer(id);
  if (!prayer) {
    return { ok: false, status: 404, error: "That request could not be found." };
  }
  return { ok: true, prayer };
}
