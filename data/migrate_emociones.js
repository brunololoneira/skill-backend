// db/drop_emociones_bucket.js
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.resolve(__dirname, 'bd_autismo.db');
const db = new sqlite3.Database(dbPath);

function run(sql, params = []) {
  return new Promise((res, rej) => db.run(sql, params, err => (err ? rej(err) : res())));
}
function columnExists(table, col) {
  return new Promise((res, rej) => {
    db.all(`PRAGMA table_info(${table})`, (err, rows) => {
      if (err) return rej(err);
      res(rows.some(r => r.name === col));
    });
  });
}

(async () => {
  try {
    console.log('→ BD:', dbPath);

    const exists = await columnExists('emociones', 'bucket');
    if (!exists) {
      console.log('↷ La columna "bucket" no existe en "emociones". Nada que eliminar.');
      return;
    }

    await run(`ALTER TABLE emociones DROP COLUMN bucket`);
    console.log('✔ Columna "bucket" eliminada correctamente.');
  } catch (e) {
    console.error('❌ No se pudo eliminar "bucket":', e.message);
    console.error('   Nota: "DROP COLUMN" requiere SQLite ≥ 3.35.');
  } finally {
    db.close();
  }
})();
