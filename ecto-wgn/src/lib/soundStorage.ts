import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export interface SoundRecord {
  id: string;
  name: string;
  mimeType: string;
  buffer: ArrayBuffer;
}

interface SoundDB extends DBSchema {
  sounds: { key: string; value: SoundRecord };
}

let dbPromise: Promise<IDBPDatabase<SoundDB>> | null = null;

function getDb(): Promise<IDBPDatabase<SoundDB>> {
  if (!dbPromise) {
    dbPromise = openDB<SoundDB>('ecto-wgn-sounds', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('sounds')) {
          db.createObjectStore('sounds', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export async function saveSound(record: SoundRecord): Promise<IDBValidKey> {
  return (await getDb()).put('sounds', record);
}

export async function getAllSounds(): Promise<SoundRecord[]> {
  return (await getDb()).getAll('sounds');
}

export async function deleteSound(id: string): Promise<void> {
  return (await getDb()).delete('sounds', id);
}