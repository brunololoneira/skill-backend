// db/create_indices.js
// Uso:
//   node db/create_indices.js                               # usa ./bd_autismo.db (en este dir)
//   node db/create_indices.js ./ruta/a/tu/bd_autismo.db     # ruta explícita
//   DB_FILE=/var/data/bd_autismo.db node db/create_indices.js

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

function run(sql) {
  return new Promise((res, rej) => db.run(sql, (err) => (err ? rej(err) : res())));
}
function get(sql, params = []) {
  return new Promise((res, rej) => db.get(sql, params, (err, row) => (err ? rej(err) : res(row))));
}
async function indexExists(name) {
  const row = await get(
    "SELECT name FROM sqlite_master WHERE type IN ('index','trigger','view','table') AND name = ?",
    [name]
  );
  return !!row;
}
async function ensureIndex(name, createSql) {
  const exists = await indexExists(name);
  if (exists) {
    console.log(`↷ Índice ya existe: ${name}`);
    return;
  }
  await run(createSql);
  console.log(`✔ Índice creado: ${name}`);
}

(async () => {
  try {
    console.log('→ BD:', dbPath);

    // Índices para acelerar listados por usuario + orden temporal
    await ensureIndex(
      'ix_emociones_user_ts',
      'CREATE INDEX IF NOT EXISTS ix_emociones_user_ts ON emociones (idUsuario, timestamp)'
    );
    await ensureIndex(
      'ix_tecnicas_user_ts',
      'CREATE INDEX IF NOT EXISTS ix_tecnicas_user_ts ON tecnicas (idUsuario, timestamp)'
    );
    await ensureIndex(
      'ix_historias_user_ts',
      'CREATE INDEX IF NOT EXISTS ix_historias_user_ts ON historias (idUsuario, timestamp)'
    );

    // Búsquedas inversas: quién tutela a X (opcional pero útil)
    await ensureIndex(
      'ix_tutorias_tutelado',
      'CREATE INDEX IF NOT EXISTS ix_tutorias_tutelado ON tutorias (idTutelado)'
    );

    // Por robustez: asegurar los índices únicos de ventana (si no existieran)
    await ensureIndex(
      'ux_emociones_user_ventana',
      'CREATE UNIQUE INDEX IF NOT EXISTS ux_emociones_user_ventana ON emociones (idUsuario, idVentana)'
    );
    await ensureIndex(
      'ux_tecnicas_user_ventana',
      'CREATE UNIQUE INDEX IF NOT EXISTS ux_tecnicas_user_ventana ON tecnicas (idUsuario, idVentana)'
    );

    console.log('✅ Todo listo.');
    process.exit(0);
  } catch (e) {
    console.error('❌ Error creando índices:', e.message);
    process.exit(1);
  } finally {
    db.close();
  }
})();