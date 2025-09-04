import { UserProfile } from '@/components/Auth';

// IndexedDB схема для пользователей
const DB_NAME = 'HimoPlatformDB';
const DB_VERSION = 1;
const USER_STORE = 'users';
const MESSAGES_STORE = 'messages';

export interface StoredMessage {
  id: string;
  userId: string;
  text: string;
  isBot: boolean;
  timestamp: string;
  cost?: number;
}

class DatabaseManager {
  private db: IDBDatabase | null = null;

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Ошибка при открытии базы данных'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Создаем хранилище пользователей
        if (!db.objectStoreNames.contains(USER_STORE)) {
          const userStore = db.createObjectStore(USER_STORE, { keyPath: 'id' });
          userStore.createIndex('username', 'username', { unique: true });
          userStore.createIndex('email', 'email', { unique: true });
        }

        // Создаем хранилище сообщений
        if (!db.objectStoreNames.contains(MESSAGES_STORE)) {
          const messagesStore = db.createObjectStore(MESSAGES_STORE, { keyPath: 'id' });
          messagesStore.createIndex('userId', 'userId', { unique: false });
          messagesStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  // Методы для работы с пользователями
  async saveUser(user: UserProfile): Promise<void> {
    if (!this.db) throw new Error('База данных не инициализирована');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([USER_STORE], 'readwrite');
      const store = transaction.objectStore(USER_STORE);
      const request = store.put(user);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Ошибка при сохранении пользователя'));
    });
  }

  async getUser(username: string): Promise<UserProfile | null> {
    if (!this.db) throw new Error('База данных не инициализирована');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([USER_STORE], 'readonly');
      const store = transaction.objectStore(USER_STORE);
      const index = store.index('username');
      const request = index.get(username);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => reject(new Error('Ошибка при получении пользователя'));
    });
  }

  async updateUser(user: UserProfile): Promise<void> {
    return this.saveUser(user); // PUT обновляет существующую запись
  }

  async getAllUsers(): Promise<UserProfile[]> {
    if (!this.db) throw new Error('База данных не инициализирована');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([USER_STORE], 'readonly');
      const store = transaction.objectStore(USER_STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Ошибка при получении пользователей'));
    });
  }

  // Методы для работы с сообщениями
  async saveMessage(message: StoredMessage): Promise<void> {
    if (!this.db) throw new Error('База данных не инициализирована');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([MESSAGES_STORE], 'readwrite');
      const store = transaction.objectStore(MESSAGES_STORE);
      const request = store.put(message);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Ошибка при сохранении сообщения'));
    });
  }

  async getUserMessages(userId: string): Promise<StoredMessage[]> {
    if (!this.db) throw new Error('База данных не инициализирована');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([MESSAGES_STORE], 'readonly');
      const store = transaction.objectStore(MESSAGES_STORE);
      const index = store.index('userId');
      const request = index.getAll(userId);

      request.onsuccess = () => {
        const messages = request.result;
        // Сортируем по времени
        messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        resolve(messages);
      };
      request.onerror = () => reject(new Error('Ошибка при получении сообщений'));
    });
  }

  async clearUserMessages(userId: string): Promise<void> {
    if (!this.db) throw new Error('База данных не инициализирована');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([MESSAGES_STORE], 'readwrite');
      const store = transaction.objectStore(MESSAGES_STORE);
      const index = store.index('userId');
      const request = index.openCursor(IDBKeyRange.only(userId));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(new Error('Ошибка при очистке сообщений'));
    });
  }

  // Статистика
  async getUserStats(userId: string): Promise<{
    totalMessages: number;
    totalSpent: number;
    firstMessageDate?: string;
    lastMessageDate?: string;
  }> {
    const messages = await this.getUserMessages(userId);
    const userMessages = messages.filter(m => !m.isBot);
    
    const totalMessages = userMessages.length;
    const totalSpent = userMessages.reduce((sum, msg) => sum + (msg.cost || 0), 0);
    const firstMessage = userMessages[0];
    const lastMessage = userMessages[userMessages.length - 1];

    return {
      totalMessages,
      totalSpent,
      firstMessageDate: firstMessage?.timestamp,
      lastMessageDate: lastMessage?.timestamp
    };
  }

  // Экспорт данных
  async exportUserData(userId: string): Promise<string> {
    const user = await this.getUser(''); // Нужно будет исправить для поиска по ID
    const messages = await this.getUserMessages(userId);
    const stats = await this.getUserStats(userId);

    const exportData = {
      user,
      messages,
      stats,
      exportDate: new Date().toISOString()
    };

    return JSON.stringify(exportData, null, 2);
  }

  // Очистка всех данных (для отладки)
  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('База данных не инициализирована');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([USER_STORE, MESSAGES_STORE], 'readwrite');
      
      const clearUsers = transaction.objectStore(USER_STORE).clear();
      const clearMessages = transaction.objectStore(MESSAGES_STORE).clear();

      let completed = 0;
      const checkComplete = () => {
        completed++;
        if (completed === 2) resolve();
      };

      clearUsers.onsuccess = checkComplete;
      clearMessages.onsuccess = checkComplete;
      clearUsers.onerror = clearMessages.onerror = () => reject(new Error('Ошибка при очистке данных'));
    });
  }
}

// Экземпляр менеджера базы данных
export const db = new DatabaseManager();

// Инициализируем базу данных при загрузке модуля
let initPromise: Promise<void> | null = null;

export const initializeDatabase = (): Promise<void> => {
  if (!initPromise) {
    initPromise = db.initialize();
  }
  return initPromise;
};

// Вспомогательные функции для использования в компонентах
export const saveUserToDatabase = async (user: UserProfile): Promise<void> => {
  await initializeDatabase();
  await db.saveUser(user);
};

export const getUserFromDatabase = async (username: string): Promise<UserProfile | null> => {
  await initializeDatabase();
  return await db.getUser(username);
};

export const updateUserInDatabase = async (user: UserProfile): Promise<void> => {
  await initializeDatabase();
  await db.updateUser(user);
};

export const saveMessageToDatabase = async (message: StoredMessage): Promise<void> => {
  await initializeDatabase();
  await db.saveMessage(message);
};

export const getUserMessagesFromDatabase = async (userId: string): Promise<StoredMessage[]> => {
  await initializeDatabase();
  return await db.getUserMessages(userId);
};

export default db;