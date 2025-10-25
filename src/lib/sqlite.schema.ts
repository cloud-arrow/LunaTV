// src/lib/sqlite.schema.ts
import { Knex } from 'knex';

export async function initializeSchema(knex: Knex) {
  // 1. 键值(Key-Value)表 (用于 AdminConfig 等)
  if (!(await knex.schema.hasTable('kv_store'))) {
    await knex.schema.createTable('kv_store', (table) => {
      table.string('key').primary();
      table.text('value');
    });
    console.log('已创建表: kv_store');
  }

  // 2. 哈希(Hash)表 (用于 PlayRecord, Favorite, User 等)
  if (!(await knex.schema.hasTable('hash_store'))) {
    await knex.schema.createTable('hash_store', (table) => {
      table.string('h_key'); // 例如 'user' 或 'playrecord:admin'
      table.string('field'); // 例如 'admin' 或 'source+id'
      table.text('value');
      table.primary(['h_key', 'field']);
    });
    console.log('已创建表: hash_store');
  }

  // 3. 集合(Set)表 (用于 SearchHistory)
  if (!(await knex.schema.hasTable('set_store'))) {
    await knex.schema.createTable('set_store', (table) => {
      table.string('s_key'); // 例如 'searchhistory:admin'
      table.string('member'); // 例如 '搜索词'
      table.primary(['s_key', 'member']);
    });
    console.log('已创建表: set_store');
  }
}