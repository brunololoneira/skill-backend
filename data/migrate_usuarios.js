// db/migrate_usuarios_tipo_tutelado.js
// Uso:
//   node db/migrate_usuarios_tipo_tutelado.js                # usa ./bd_autismo.db (en este directorio)
//   node db/migrate_usuarios_tipo_tutelado.js ./ruta/db.sqlite
//   DB_FILE=/var/data/bd_autismo.db node db/migrate_usuarios_tipo_tutelado.js
//
// Qué hace:
// 1) Crea 'usuarios_app' con CHECK (tipo IN ('tutelado','responsable')).
// 2) Copia datos desde 'usuarios', mapeando 'niño' → 'tutelado'.
// 3) DROP de 'usuarios' y RENAME de 'usuarios_app' → 'usuarios'.
// 4) Ajusta sqlite_sequence para mantener el AUTOINCREMENT.
//
// ⚠️ Haz backup del .db antes de ejecutar.

const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const DEFAULT_DB = path.resolve(__dirname, 'bd_autismo.db');
const dbPath = process.argv[2] || process.env.DB_FILE || DEFAULT_DB;

if (!fs.existsSync(dbPath)) {
  console.error('❌ No se encontró la BD en:', dbPath);
  process.exit(1);
}

const db = new sqlite3.Database(dbPath);

function run(sql, params = []) {
  return new Promise((res, rej) => db.run(sql, params, function (err) {
    if (err) rej(err); else res(this);
  }));
}
function exec(sql) {
  return new Promise((res, rej) => db.exec(sql, (err) => err ? rej(err) : res()));
}
function get(sql, params = []) {
  return new Promise((res, rej) => db.get(sql, params, (err, row) => err ? rej(err) : res(row)));
}
function all(sql, params = []) {
  return new Promise((res, rej) => db.all(sql, params, (err, rows) => err ? rej(err) : res(rows)));
}
async function tableExists(name) {
  const row = await get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", [name]);
  return !!row;
}

(async () => {
  console.log('→ BD:', dbPath);

  try {
    // Comprobaciones previas
    if (!(await tableExists('usuarios'))) {
      throw new Error("No existe la tabla 'usuarios'. Nada que migrar.");
    }

    const info = await all('PRAGMA table_info(usuarios)');
    const cols = info.map(c => c.name);
    for (const c of ['idUsuario', 'nombre', 'PIN', 'tipo']) {
      if (!cols.includes(c)) {
        throw new Error(`La tabla 'usuarios' no tiene la columna esperada: ${c}`);
      }
    }

    // Transacción y FKs OFF para poder reemplazar tabla
    await exec('BEGIN IMMEDIATE;');
    await run('PRAGMA foreign_keys = OFF');

    // Elimina si ya existiera de un intento previo
    await run('DROP TABLE IF EXISTS usuarios_app');

    // Crea nueva tabla con el CHECK deseado
    await run(`
      CREATE TABLE usuarios_app (
        idUsuario INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre    TEXT NOT NULL UNIQUE,
        PIN       TEXT NOT NULL,
        tipo      TEXT NOT NULL CHECK (tipo IN ('tutelado','responsable'))
      )
    `);

    // Copia de datos con mapeo niño → tutelado
    const inserted = await run(`
      INSERT INTO usuarios_app (idUsuario, nombre, PIN, tipo)
      SELECT
        idUsuario,
        nombre,
        PIN,
        CASE WHEN tipo = 'niño' THEN 'tutelado' ELSE tipo END
      FROM usuarios
    `);
    console.log('→ Filas copiadas desde usuarios → usuarios_app');

    // Sustituye tabla original
    await run('DROP TABLE usuarios');
    await run('ALTER TABLE usuarios_app RENAME TO usuarios');

    // Ajusta AUTOINCREMENT para no reutilizar ids pasados
    await run("DELETE FROM sqlite_sequence WHERE name='usuarios'");
    await run(`
      INSERT OR REPLACE INTO sqlite_sequence(name, seq)
      VALUES ('usuarios', (SELECT IFNULL(MAX(idUsuario), 0) FROM usuarios))
    `);

    // Reactiva FKs y cierra transacción
    await run('PRAGMA foreign_keys = ON');
    await exec('COMMIT;');

    // Verificación rápida
    const tipos = await all("SELECT DISTINCT tipo FROM usuarios ORDER BY tipo");
    console.log('✔ Migración completada. Tipos presentes ahora:', tipos.map(r => r.tipo).join(', ') || '(ninguno)');
    process.exit(0);
  } catch (e) {
    console.error('❌ Error en migración:', e.message);
    try { await exec('ROLLBACK;'); } catch {}
    process.exit(1);
  } finally {
    db.close();
  }
})();