// db/migrate_emociones_bucket.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/bd_autismo.db');

function hasColumn(table, col) {
  return new Promise((res, rej) => {
    db.all(`PRAGMA table_info(${table})`, (err, rows) => {
      if (err) return rej(err);
      res(rows.some(r => r.name === col));
    });
  });
}

(async () => {
  try {
    const hasBucket = await hasColumn('emociones', 'bucket');
    if (!hasBucket) {
      await new Promise((res, rej) =>
        db.run(`ALTER TABLE emociones ADD COLUMN bucket INTEGER`, err => err ? rej(err) : res())
      );
      console.log('✔ Añadida columna bucket');
    } else {
      console.log('↷ bucket ya existía');
    }

    await new Promise((res, rej) =>
      db.run(
        `CREATE UNIQUE INDEX IF NOT EXISTS ux_emociones_user_bucket
         ON emociones (idUsuario, bucket)`,
        err => err ? rej(err) : res()
      )
    );
    console.log('✔ Índice único (idUsuario, bucket) OK');
  } catch (e) {
    console.error('Error migrando:', e);
  } finally {
    db.close();
  }
})();