import CryptoJS from 'crypto-js';
import * as SQLite from 'expo-sqlite';

let dbInstance = null;

const getDB = async () => {
  if (dbInstance) return dbInstance;

  if (SQLite.openDatabaseAsync) {
    dbInstance = await SQLite.openDatabaseAsync('users.db');
  } else if (SQLite.openDatabase) {
    dbInstance = SQLite.openDatabase('users.db');
  } else {
    throw new Error('expo-sqlite no expone openDatabase/openDatabaseAsync');
  }

  return dbInstance;
};

const runSql = async (sql, params = []) => {
  const db = await getDB();

  if (typeof db.transaction === 'function') {
    return new Promise((resolve, reject) => {
      db.transaction(
        tx => {
          tx.executeSql(
            sql,
            params,
            (_, result) => resolve(result),
            (_, error) => {
              reject(error);
              return false;
            }
          );
        },
        err => reject(err)
      );
    });
  }

  if (typeof db.runAsync === 'function') {
    return db.runAsync(sql, params);
  }
  if (typeof db.execAsync === 'function') {
    return db.execAsync(sql, params);
  }
  throw new Error('No compatible method to run SQL (insert/update/delete) found on DB instance');
};

const querySql = async (sql, params = []) => {
  const db = await getDB();

  if (typeof db.transaction === 'function') {
    return new Promise((resolve, reject) => {
      db.transaction(
        tx => {
          tx.executeSql(
            sql,
            params,
            (_, result) => {
              const rows = (result.rows && result.rows._array) ? result.rows._array : [];
              resolve(rows);
            },
            (_, error) => {
              reject(error);
              return false;
            }
          );
        },
        err => reject(err)
      );
    });
  }

  if (typeof db.getAllAsync === 'function') {
    return db.getAllAsync(sql, params);
  }
  if (typeof db.allAsync === 'function') {
    return db.allAsync(sql, params);
  }
  if (typeof db.execAsync === 'function') {
    const execRes = await db.execAsync(sql, params);
    try {
      const first = execRes && execRes[0];
      if (!first) return [];
      if (first.rows && first.rows._array) return first.rows._array;
      if (first.values && first.columns) {
        const cols = first.columns;
        return first.values.map(rowVals => {
          const obj = {};
          cols.forEach((c, i) => (obj[c] = rowVals[i]));
          return obj;
        });
      }
      return execRes;
    } catch (e) {
      return [];
    }
  }

  throw new Error('No compatible method to query SQL (SELECT) found on DB instance');
};

export const initDB = async () => {
  try {
    await runSql(
      `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE,
          password TEXT,
          role TEXT
        );`
    );

    const adminHash = CryptoJS.SHA256('1234').toString();
    await runSql(
      `INSERT OR IGNORE INTO users (id, username, password, role) VALUES (1, ?, ?, ?);`,
      ['admin', adminHash, 'admin']
    );

    return true;
  } catch (err) {
    throw err;
  }
};

export const validateUser = async (username, password) => {
  try {
    const hashed = CryptoJS.SHA256(password).toString();
    const rows = await querySql(
      `SELECT id, username, role FROM users WHERE username = ? AND password = ? LIMIT 1;`,
      [username, hashed]
    );
    return rows && rows.length > 0 ? rows[0] : null;
  } catch (err) {
    throw err;
  }
};

export const createUser = async (username, password, role = 'user') => {
  try {
    const hashed = CryptoJS.SHA256(password).toString();
    const result = await runSql(
      `INSERT INTO users (username, password, role) VALUES (?, ?, ?);`,
      [username, hashed, role]
    );
    const id = result?.insertId ?? result?.lastInsertRowId ?? null;
    return { id, username, role };
  } catch (err) {
    throw err;
  }
};

export const getAllUsers = async () => {
  try {
    const rows = await querySql(`SELECT id, username, role FROM users ORDER BY id;`);
    return rows;
  } catch (err) {
    throw err;
  }
};

export const updateUser = async (id, { username, password, role }) => {
  try {
    const updates = [];
    const values = [];
    if (username) {
      updates.push('username = ?');
      values.push(username);
    }
    if (password) {
      updates.push('password = ?');
      values.push(CryptoJS.SHA256(password).toString());
    }
    if (role) {
      updates.push('role = ?');
      values.push(role);
    }
    if (updates.length === 0) return false;

    values.push(id);

    const result = await runSql(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?;`,
      values
    );

    const rowsAffected = result?.rowsAffected ?? result?.changes?.rowsAffected ?? null;
    if (rowsAffected !== null) return rowsAffected > 0;

    return true;
  } catch (err) {
    throw err;
  }
};

export const deleteUser = async (id) => {
  try {
    if (id === 1) throw new Error('No se puede eliminar el usuario administrador');

    const result = await runSql(`DELETE FROM users WHERE id = ?;`, [id]);
    const rowsAffected = result?.rowsAffected ?? result?.changes?.rowsAffected ?? null;
    if (rowsAffected !== null) return rowsAffected > 0;
    return true;
  } catch (err) {
    throw err;
  }
};
