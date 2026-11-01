export class IndexedDbKeyValueStore {
  constructor(
    private readonly databaseName: string,
    private readonly storeName: string
  ) {}

  private open(): Promise<IDBDatabase | null> {
    return new Promise(resolve => {
      const factory = globalThis.indexedDB;
      if (!factory) {
        resolve(null);
        return;
      }

      try {
        const request = factory.open(this.databaseName, 1);
        request.onupgradeneeded = () => {
          const database = request.result;
          if (!database.objectStoreNames.contains(this.storeName)) {
            database.createObjectStore(this.storeName);
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
        request.onblocked = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  async get<T>(key: string): Promise<T | null> {
    const database = await this.open();
    if (!database) return null;

    return new Promise(resolve => {
      try {
        const transaction = database.transaction(this.storeName, 'readonly');
        const request = transaction.objectStore(this.storeName).get(key);
        request.onsuccess = () => resolve((request.result as T | undefined) ?? null);
        request.onerror = () => resolve(null);
        transaction.oncomplete = () => database.close();
        transaction.onabort = () => database.close();
      } catch {
        database.close();
        resolve(null);
      }
    });
  }

  async set<T>(key: string, value: T): Promise<boolean> {
    const database = await this.open();
    if (!database) return false;

    return new Promise(resolve => {
      try {
        const transaction = database.transaction(this.storeName, 'readwrite');
        transaction.objectStore(this.storeName).put(value, key);
        transaction.oncomplete = () => {
          database.close();
          resolve(true);
        };
        transaction.onerror = () => {
          database.close();
          resolve(false);
        };
        transaction.onabort = () => {
          database.close();
          resolve(false);
        };
      } catch {
        database.close();
        resolve(false);
      }
    });
  }

  async delete(key: string): Promise<boolean> {
    const database = await this.open();
    if (!database) return false;

    return new Promise(resolve => {
      try {
        const transaction = database.transaction(this.storeName, 'readwrite');
        transaction.objectStore(this.storeName).delete(key);
        transaction.oncomplete = () => {
          database.close();
          resolve(true);
        };
        transaction.onerror = () => {
          database.close();
          resolve(false);
        };
        transaction.onabort = () => {
          database.close();
          resolve(false);
        };
      } catch {
        database.close();
        resolve(false);
      }
    });
  }
}
