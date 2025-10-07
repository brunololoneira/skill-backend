// db/migrate_add_foreign_keys_cascade.js
// Uso:
//   node db/migrate_add_foreign_keys_cascade.js
//   node db/migrate_add_foreign_keys_cascade.js ./ruta/bd_autismo.db
//   DB_FILE=/var/data/bd_autismo.db node db/migrate_add_foreign_keys_cascade.js
//
// Qué hace:
// - Crea *_new con FKs ON DELETE CASCADE hacia usuarios(idUsuario)
// - Copia datos válidos (descarta huérfanos)
// - DROP tablas antiguas y RENAME *_new
// - Recrea índices usados por tu app
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
  return new Promise((res, rej) => db.run(sql, params, function (err) { err ? rej(err) : res(this); }));
}
function exec(sql) {
  return new Promise((res, rej) => db.exec(sql, (err) => (err ? rej(err) : res())));
}
function all(sql, params = []) {
  return new Promise((res, rej) => db.all(sql, params, (err, rows) => (err ? rej(err) : res(rows))));
}
async function tableExists(name) {
  const rows = await all("SELECT name FROM sqlite_master WHERE type='table' AND name=?", [name]);
  return rows.length > 0;
}

(async () => {
  console.log('→ BD:', dbPath);
  try {
    // Comprobaciones mínimas
    for (const t of ['usuarios', 'emociones', 'tecnicas', 'historias', 'tutorias']) {
      if (!(await tableExists(t))) {
        throw new Error(`Falta la tabla '${t}'. Estructura inesperada.`);
      }
    }

    // Transacción y FKs OFF para poder reemplazar tablas
    await exec('BEGIN IMMEDIATE;');
    await run('PRAGMA foreign_keys = OFF');

    // Elimina restos de intentos previos
    await run('DROP TABLE IF EXISTS emociones_new');
    await run('DROP TABLE IF EXISTS tecnicas_new');
    await run('DROP TABLE IF EXISTS historias_new');
    await run('DROP TABLE IF EXISTS tutorias_new');

    // ===== 1) EMOCIONES con FK CASCADE =====
    await run(`
      CREATE TABLE emociones_new (
        idUsuario INTEGER NOT NULL,
        timestamp TEXT NOT NULL,
        emocion   TEXT NOT NULL,
        causa     TEXT,
        idVentana INTEGER,
        FOREIGN KEY (idUsuario) REFERENCES usuarios(idUsuario) ON DELETE CASCADE
      )
    `);
    await run(`
      INSERT INTO emociones_new (idUsuario, timestamp, emocion, causa, idVentana)
      SELECT e.idUsuario, e.timestamp, e.emocion, e.causa, e.idVentana
      FROM emociones e
      WHERE EXISTS (SELECT 1 FROM usuarios u WHERE u.idUsuario = e.idUsuario)
    `);
    await run('DROP TABLE emociones');
    await run('ALTER TABLE emociones_new RENAME TO emociones');

    // ===== 2) TECNICAS con FK CASCADE =====
    await run(`
      CREATE TABLE tecnicas_new (
        idUsuario INTEGER NOT NULL,
        timestamp TEXT NOT NULL,
        tecnica   TEXT NOT NULL,
        idVentana INTEGER,
        FOREIGN KEY (idUsuario) REFERENCES usuarios(idUsuario) ON DELETE CASCADE
      )
    `);
    await run(`
      INSERT INTO tecnicas_new (idUsuario, timestamp, tecnica, idVentana)
      SELECT t.idUsuario, t.timestamp, t.tecnica, t.idVentana
      FROM tecnicas t
      WHERE EXISTS (SELECT 1 FROM usuarios u WHERE u.idUsuario = t.idUsuario)
    `);
    await run('DROP TABLE tecnicas');
    await run('ALTER TABLE tecnicas_new RENAME TO tecnicas');

    // ===== 3) HISTORIAS con FK CASCADE =====
    await run(`
      CREATE TABLE historias_new (
        idUsuario INTEGER NOT NULL,
        timestamp TEXT NOT NULL,
        historiaId TEXT NOT NULL,
        FOREIGN KEY (idUsuario) REFERENCES usuarios(idUsuario) ON DELETE CASCADE
      )
    `);
    await run(`
      INSERT INTO historias_new (idUsuario, timestamp, historiaId)
      SELECT h.idUsuario, h.timestamp, h.historiaId
      FROM historias h
      WHERE EXISTS (SELECT 1 FROM usuarios u WHERE u.idUsuario = h.idUsuario)
    `);
    await run('DROP TABLE historias');
    await run('ALTER TABLE historias_new RENAME TO historias');

    // ===== 4) TUTORIAS con FKs CASCADE y PK compuesta =====
    await run(`
      CREATE TABLE tutorias_new (
        idResponsable INTEGER NOT NULL,
        idTutelado    INTEGER NOT NULL,
        PRIMARY KEY (idResponsable, idTutelado),
        FOREIGN KEY (idResponsable) REFERENCES usuarios(idUsuario) ON DELETE CASCADE,
        FOREIGN KEY (idTutelado)    REFERENCES usuarios(idUsuario) ON DELETE CASCADE
      )
    `);
    await run(`
      INSERT INTO tutorias_new (idResponsable, idTutelado)
      SELECT t.idResponsable, t.idTutelado
      FROM tutorias t
      WHERE EXISTS (SELECT 1 FROM usuarios u WHERE u.idUsuario = t.idResponsable)
        AND EXISTS (SELECT 1 FROM usuarios u WHERE u.idUsuario = t.idTutelado)
    `);
    await run('DROP TABLE tutorias');
    await run('ALTER TABLE tutorias_new RENAME TO tutorias');

    // ===== 5) Recrear índices necesarios =====
    await run(`
      CREATE UNIQUE INDEX IF NOT EXISTS ux_emociones_user_ventana
      ON emociones (idUsuario, idVentana)
    `);
    await run(`
      CREATE UNIQUE INDEX IF NOT EXISTS ux_tecnicas_user_ventana
      ON tecnicas (idUsuario, idVentana)
    `);
    await run(`
      CREATE INDEX IF NOT EXISTS ix_emociones_user_ts
      ON emociones (idUsuario, timestamp)
    `);
    await run(`
      CREATE INDEX IF NOT EXISTS ix_tecnicas_user_ts
      ON tecnicas (idUsuario, timestamp)
    `);
    await run(`
      CREATE INDEX IF NOT EXISTS ix_historias_user_ts
      ON historias (idUsuario, timestamp)
    `);
    await run(`
      CREATE INDEX IF NOT EXISTS ix_tutorias_tutelado
      ON tutorias (idTutelado)
    `);

    // Reactivar FKs y cerrar transacción
    await run('PRAGMA foreign_keys = ON');
    await exec('COMMIT;');

    // Verificación rápida
    const fkEmo = await all("PRAGMA foreign_key_list('emociones')");
    const fkTec = await all("PRAGMA foreign_key_list('tecnicas')");
    const fkHis = await all("PRAGMA foreign_key_list('historias')");
    const fkTut = await all("PRAGMA foreign_key_list('tutorias')");
    console.log('✔ FKs emociones:', fkEmo);
    console.log('✔ FKs tecnicas :', fkTec);
    console.log('✔ FKs historias:', fkHis);
    console.log('✔ FKs tutorias :', fkTut);
    console.log('✅ Migración completada con ON DELETE CASCADE.');
    process.exit(0);
  } catch (e) {
    console.error('❌ Error en la migración:', e.message);
    try { await exec('ROLLBACK;'); } catch {}
    process.exit(1);
  } finally {
    db.close();
  }
})();