// db/migrate_tecnicas.js
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const dbPath = path.resolve(__dirname, 'bd_autismo.db');
const db = new sqlite3.Database(dbPath);

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
    db.get(
      `SELECT 1 FROM sqlite_master WHERE type='index' AND name=?`,
      [name],
      (err, row) => (err ? rej(err) : res(!!row))
    );
  });
}

(async () => {
  try {
    console.log('-> Abriendo BD:', dbPath);

    // 1) Comprobar que la tabla 'tecnicas' existe (opcional, pero informativo)
    await new Promise((res, rej) => {
      db.get(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='tecnicas'`,
        (err, row) => {
          if (err) return rej(err);
          if (!row) {
            console.error("✖ La tabla 'tecnicas' no existe. Crea la tabla antes de migrar.");
            return rej(new Error("Tabla 'tecnicas' no encontrada"));
          }
          res();
        }
      );
    });

    // 2) Añadir columna idVentana si no existe
    const hasIdVentana = await hasColumn('tecnicas', 'idVentana');
    if (!hasIdVentana) {
      await new Promise((res, rej) =>
        db.run(`ALTER TABLE tecnicas ADD COLUMN idVentana INTEGER`, err =>
          err ? rej(err) : res()
        )
      );
      console.log('✔ Añadida columna idVentana (INTEGER) en tecnicas');
    } else {
      console.log('↷ idVentana ya existía en tecnicas');
    }

    // 3) Crear índice único (idUsuario, idVentana) si no existe
    const indexName = 'ux_tecnicas_user_ventana';
    const existsIdx = await hasIndex(indexName);
    if (!existsIdx) {
      await new Promise((res, rej) =>
        db.run(
          `CREATE UNIQUE INDEX ${indexName}
           ON tecnicas (idUsuario, idVentana)`,
          err => (err ? rej(err) : res())
        )
      );
      console.log(`✔ Índice único (${indexName}) sobre (idUsuario, idVentana) creado`);
    } else {
      console.log(`↷ Índice ${indexName} ya existía`);
    }

    console.log('✅ Migración de tecnicas completada correctamente.');
  } catch (e) {
    console.error('❌ Error migrando tecnicas:', e.message || e);
  } finally {
    db.close();
  }
})();

