import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('tena.db');
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS pending_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        value REAL NOT NULL,
        reading_type TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        symptoms TEXT,
        synced INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS cache (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
  }
  return db;
}

export interface LocalLog {
  id?: number;
  value: number;
  reading_type: string;
  timestamp: string;
  symptoms: string | null;
  synced: boolean;
}

export const dbService = {
  async saveLog(log: Omit<LocalLog, 'id' | 'synced'> & { synced?: boolean }): Promise<void> {
    const database = await getDb();
    await database.runAsync(
      'INSERT INTO pending_logs (value, reading_type, timestamp, symptoms, synced) VALUES (?, ?, ?, ?, ?)',
      [log.value, log.reading_type, log.timestamp, log.symptoms, log.synced ? 1 : 0]
    );
  },

  async getPendingLogs(): Promise<LocalLog[]> {
    const database = await getDb();
    const rows = await database.getAllAsync<any>(
      'SELECT * FROM pending_logs WHERE synced = 0 ORDER BY id ASC'
    );
    return rows.map((r: any) => ({
      id: r.id,
      value: r.value,
      reading_type: r.reading_type,
      timestamp: r.timestamp,
      symptoms: r.symptoms,
      synced: !!r.synced,
    }));
  },

  async markSynced(id: number): Promise<void> {
    const database = await getDb();
    await database.runAsync('UPDATE pending_logs SET synced = 1 WHERE id = ?', [id]);
  },

  async clearSynced(): Promise<void> {
    const database = await getDb();
    await database.runAsync('DELETE FROM pending_logs WHERE synced = 1');
  },

  async cacheSet(key: string, value: string): Promise<void> {
    const database = await getDb();
    await database.runAsync('INSERT OR REPLACE INTO cache (key, value) VALUES (?, ?)', [key, value]);
  },

  async cacheGet(key: string): Promise<string | null> {
    const database = await getDb();
    const row = await database.getFirstAsync<any>('SELECT value FROM cache WHERE key = ?', [key]);
    return row?.value ?? null;
  },

  async clearAllLogs(): Promise<void> {
    const database = await getDb();
    await database.runAsync('DELETE FROM pending_logs');
  },

  async getAllLogs(): Promise<LocalLog[]> {
    const database = await getDb();
    const rows = await database.getAllAsync<any>('SELECT * FROM pending_logs ORDER BY id ASC');
    return rows.map((r: any) => ({
      id: r.id,
      value: r.value,
      reading_type: r.reading_type,
      timestamp: r.timestamp,
      symptoms: r.symptoms,
      synced: !!r.synced,
    }));
  },
};
