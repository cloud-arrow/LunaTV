// src/lib/sqlite.db.ts
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import DatabaseConstructor, { Database as BetterSqliteDatabase } from 'better-sqlite3';
import knex, { Knex } from 'knex';
import { AdminConfig } from './admin.types';
import { hashPassword, verifyPassword } from './crypto';
import { initializeSchema } from './sqlite.schema';
import { Favorite, IStorage, PlayRecord, SkipConfig } from './types';

// 键名常量
const K = {
  ADMIN_CONFIG: 'admin:config',
  USER_HASH: 'user',
  USER_ROLE_HASH: 'user:role',
  PLAYRECORD_HASH_PREFIX: 'playrecord:',
  FAVORITE_HASH_PREFIX: 'favorite:',
  SEARCHHISTORY_SET_PREFIX: 'searchhistory:',
  SKIPCONFIG_HASH_PREFIX: 'skipconfig:',
};

export class SqliteStorage implements IStorage {
  private db: BetterSqliteDatabase;
  private knex: Knex;

  constructor(dbPath: string) {
    this.db = new DatabaseConstructor(dbPath);
    this.knex = knex({
      client: 'better-sqlite3',
      connection: {
        filename: dbPath,
      },
      useNullAsDefault: true,
    });
    console.log(`SQLite 数据库已连接: ${dbPath}`);
    // 自动初始化/检查 Schema
    initializeSchema(this.knex);
    // 自动创建默认管理员
    this.createDefaultAdmin();
  }

  private async createDefaultAdmin() {
    try {
      const adminExists = await this.hget(K.USER_HASH, 'admin');
      if (!adminExists) {
        console.log('未找到管理员，正在创建默认管理员 (admin/admin)...');
        await this.registerUser('admin', 'admin', 'admin');
        console.log('默认管理员已创建。');
      }
    } catch (error) {
      console.error('检查/创建管理员时出错:', error);
    }
  }

  // --- 内部低级方法 (模拟 Redis) ---
  private async get(key: string): Promise<string | null> {
    const result = await this.knex('kv_store').where({ key }).first('value');
    return result ? result.value : null;
  }
  private async set(key: string, value: string): Promise<void> {
    await this.knex('kv_store').insert({ key, value }).onConflict('key').merge();
  }
  private async hget(key: string, field: string): Promise<string | null> {
    const result = await this.knex('hash_store').where({ h_key: key, field }).first('value');
    return result ? result.value : null;
  }
  private async hset(key: string, field: string, value: string): Promise<void> {
    await this.knex('hash_store').insert({ h_key: key, field, value }).onConflict(['h_key', 'field']).merge();
  }
  private async hdel(key: string, field: string): Promise<void> {
    await this.knex('hash_store').where({ h_key: key, field }).del();
  }
  private async hgetall(key: string): Promise<Record<string, string>> {
    const rows = await this.knex('hash_store').where({ h_key: key });
    return rows.reduce((acc, row) => {
      acc[row.field] = row.value;
      return acc;
    }, {} as Record<string, string>);
  }
  private async hkeys(key: string): Promise<string[]> {
    const rows = await this.knex('hash_store').where({ h_key: key }).select('field');
    return rows.map((row) => row.field);
  }
  private async sadd(key: string, member: string): Promise<void> {
    await this.knex('set_store').insert({ s_key: key, member }).onConflict().ignore();
  }
  private async srem(key: string, member: string): Promise<void> {
    await this.knex('set_store').where({ s_key: key, member }).del();
  }
  private async smembers(key: string): Promise<string[]> {
    const rows = await this.knex('set_store').where({ s_key: key }).select('member');
    return rows.map((row) => row.member);
  }
  private async hdelAll(key: string): Promise<void> {
    await this.knex('hash_store').where({ h_key: key }).del();
  }
  private async sdelAll(key: string): Promise<void> {
    await this.knex('set_store').where({ s_key: key }).del();
  }
  private async del(key: string): Promise<void> {
    await this.knex('kv_store').where({ key }).del();
    await this.knex('hash_store').where({ h_key: key }).del();
    await this.knex('set_store').where({ s_key: key }).del();
  }

  // --- IStorage 接口实现 ---

  async getPlayRecord(userName: string, key: string): Promise<PlayRecord | null> {
    const data = await this.hget(K.PLAYRECORD_HASH_PREFIX + userName, key);
    return data ? JSON.parse(data) : null;
  }
  async setPlayRecord(userName: string, key: string, record: PlayRecord): Promise<void> {
    await this.hset(K.PLAYRECORD_HASH_PREFIX + userName, key, JSON.stringify(record));
  }
  async getAllPlayRecords(userName: string): Promise<{ [key: string]: PlayRecord }> {
    const data = await this.hgetall(K.PLAYRECORD_HASH_PREFIX + userName);
    return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, JSON.parse(v)]));
  }
  async deletePlayRecord(userName: string, key: string): Promise<void> {
    await this.hdel(K.PLAYRECORD_HASH_PREFIX + userName, key);
  }

  async getFavorite(userName: string, key: string): Promise<Favorite | null> {
    const data = await this.hget(K.FAVORITE_HASH_PREFIX + userName, key);
    return data ? JSON.parse(data) : null;
  }
  async setFavorite(userName: string, key: string, favorite: Favorite): Promise<void> {
    await this.hset(K.FAVORITE_HASH_PREFIX + userName, key, JSON.stringify(favorite));
  }
  async getAllFavorites(userName: string): Promise<{ [key: string]: Favorite }> {
    const data = await this.hgetall(K.FAVORITE_HASH_PREFIX + userName);
    return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, JSON.parse(v)]));
  }
  async deleteFavorite(userName: string, key: string): Promise<void> {
    await this.hdel(K.FAVORITE_HASH_PREFIX + userName, key);
  }

  async registerUser(userName: string, password: string, role = 'user'): Promise<void> {
    const hashedPassword = await hashPassword(password);
    await this.hset(K.USER_HASH, userName, hashedPassword);
    await this.hset(K.USER_ROLE_HASH, userName, role);
  }
  async verifyUser(userName: string, password: string): Promise<boolean> {
    const hashedPassword = await this.hget(K.USER_HASH, userName);
    if (!hashedPassword) return false;
    return verifyPassword(password, hashedPassword);
  }
  async checkUserExist(userName: string): Promise<boolean> {
    const user = await this.hget(K.USER_HASH, userName);
    return !!user;
  }
  async changePassword(userName: string, newPassword: string): Promise<void> {
    const hashedPassword = await hashPassword(newPassword);
    await this.hset(K.USER_HASH, userName, hashedPassword);
  }
  async deleteUser(userName: string): Promise<void> {
    await this.hdel(K.USER_HASH, userName);
    await this.hdel(K.USER_ROLE_HASH, userName);
    await this.del(K.PLAYRECORD_HASH_PREFIX + userName);
    await this.del(K.FAVORITE_HASH_PREFIX + userName);
    await this.del(K.SEARCHHISTORY_SET_PREFIX + userName);
    await this.del(K.SKIPCONFIG_HASH_PREFIX + userName);
  }

  async getSearchHistory(userName: string): Promise<string[]> {
    return this.smembers(K.SEARCHHISTORY_SET_PREFIX + userName);
  }
  async addSearchHistory(userName: string, keyword: string): Promise<void> {
    await this.sadd(K.SEARCHHISTORY_SET_PREFIX + userName, keyword);
  }
  async deleteSearchHistory(userName: string, keyword?: string): Promise<void> {
    if (keyword) {
      await this.srem(K.SEARCHHISTORY_SET_PREFIX + userName, keyword);
    } else {
      await this.del(K.SEARCHHISTORY_SET_PREFIX + userName);
    }
  }

  async getAllUsers(): Promise<string[]> {
    return this.hkeys(K.USER_HASH);
  }

  async getAdminConfig(): Promise<AdminConfig | null> {
    const data = await this.get(K.ADMIN_CONFIG);
    return data ? JSON.parse(data) : null;
  }
  async setAdminConfig(config: AdminConfig): Promise<void> {
    await this.set(K.ADMIN_CONFIG, JSON.stringify(config));
  }

  async getSkipConfig(userName: string, source: string, id: string): Promise<SkipConfig | null> {
    const key = `${source}+${id}`;
    const data = await this.hget(K.SKIPCONFIG_HASH_PREFIX + userName, key);
    return data ? JSON.parse(data) : null;
  }
  async setSkipConfig(userName: string, source: string, id: string, config: SkipConfig): Promise<void> {
    const key = `${source}+${id}`;
    await this.hset(K.SKIPCONFIG_HASH_PREFIX + userName, key, JSON.stringify(config));
  }
  async deleteSkipConfig(userName: string, source: string, id: string): Promise<void> {
    const key = `${source}+${id}`;
    await this.hdel(K.SKIPCONFIG_HASH_PREFIX + userName, key);
  }
  async getAllSkipConfigs(userName: string): Promise<{ [key: string]: SkipConfig }> {
    const data = await this.hgetall(K.SKIPCONFIG_HASH_PREFIX + userName);
    return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, JSON.parse(v)]));
  }

  async clearAllData(): Promise<void> {
    await this.knex('kv_store').del();
    await this.knex('hash_store').del();
    await this.knex('set_store').del();
    console.log('已清空所有 SQLite 表');
    // 重建默认管理员
    await this.createDefaultAdmin();
  }

  // SQLite/Knex 不需要显式 quit
  async quit(): Promise<void> {
    this.db.close();
    console.log('SQLite 数据库连接已关闭');
    return Promise.resolve();
  }
}