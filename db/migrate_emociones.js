// db/migrate_emociones_idVentana.js
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Usa la misma ruta que tu backend
const dbPath = path.resolve(__dirname, 'bd_autismo.db');
const db = new sqlite3.Database(dbPath);

function hasTable(name) {
  return new Promise((res, rej) => {
    db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`, [name],
      (err, row) => err ? rej(err) : res(!!row));
  });
}
function hasColumn(table, col) {
  return new Promise((res, rej) => {
    db.all(`PRAGMA table_info(${table})`, (err, rows) => {
      if (err) return rej(err);
      res(rows.some(r => r.name === col));
    });
  });
}
function hasIndex(name) {
  return new Promise((res, rej) => {
    db.get(`SELECT 1 FROM sqlite_master WHERE type='index' AND name=?`, [name],
      (err, row) => err ? rej(err) : res(!!row));
  });
}
function run(sql, params = []) {
  return new Promise((res, rej) => {
    db.run(sql, params, err => err ? rej(err) : res());
  });
}
function get(sql, params = []) {
  return new Promise((res, rej) => {
    db.get(sql, params, (err, row) => err ? rej(err) : res(row));
  });
}

(async () => {
  try {
    console.log('→ Abriendo BD:', dbPath);

    // 0) Validar que existe la tabla
    const tableExists = await hasTable('emociones');
    if (!tableExists) {
      throw new Error("La tabla 'emociones' no existe. Crea la tabla antes de migrar.");
    }

    // 1) Añadir columna idVentana si no existe
    const hasIdVentana = await hasColumn('emociones', 'idVentana');
    if (!hasIdVentana) {
      await run(`ALTER TABLE emociones ADD COLUMN idVentana INTEGER`);
      console.log('✔ Añadida columna idVentana (INTEGER) en emociones');
    } else {
      console.log('↷ idVentana ya existía en emociones');
    }

    // 2) Si existe bucket, copiar valores donde idVentana sea NULL
    const hasBucket = await hasColumn('emociones', 'bucket');
    if (hasBucket) {
      await run(`UPDATE emociones SET idVentana = bucket WHERE idVentana IS NULL AND bucket IS NOT NULL`);
      const row = await get(`SELECT COUNT(*) AS n FROM emociones WHERE idVentana IS NULL`);
      console.log(`✔ Copiados valores de bucket → idVentana (pendientes NULL: ${row.n})`);
    } else {
      console.log('↷ No existe columna bucket; nada que copiar');
    }

    // 3) Crear índice único nuevo (idUsuario, idVentana)
    const newIndex = 'ux_emociones_user_ventana';
    const hasNewIdx = await hasIndex(newIndex);
    if (!hasNewIdx) {
      await run(`CREATE UNIQUE INDEX ${newIndex} ON emociones (idUsuario, idVentana)`);
      console.log(`✔ Índice único creado: ${newIndex} (idUsuario, idVentana)`);
    } else {
      console.log(`↷ Índice ${newIndex} ya existía`);
    }

    // 4) Eliminar índice antiguo si existiera
    const oldIndex = 'ux_emociones_user_bucket';
    const hasOldIdx = await hasIndex(oldIndex);
    if (hasOldIdx) {
      await run(`DROP INDEX ${oldIndex}`);
      console.log(`✔ Índice antiguo eliminado: ${oldIndex}`);
    } else {
      console.log('↷ No se encontró índice antiguo ux_emociones_user_bucket (ok)');
    }

    console.log('✅ Migración de emociones a idVentana completada.');
  } catch (e) {
    console.error('❌ Error migrando emociones:', e.message || e);
  } finally {
    db.close();
  }
})();
