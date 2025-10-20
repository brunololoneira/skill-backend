const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Ruta de tu base de datos
const dbPath = path.join(__dirname, 'bd_autismo.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log('🧹 Limpiando todas las tablas...');

  // Desactivar restricciones temporales para poder borrar sin problemas
  db.run('PRAGMA foreign_keys = OFF;');

  // Borrar el contenido de todas las tablas
  const tablas = ['emociones', 'historias', 'tecnicas', 'tutorias', 'usuarios'];

  tablas.forEach((tabla) => {
    db.run(`DELETE FROM ${tabla};`, (err) => {
      if (err) console.error(`❌ Error al limpiar ${tabla}:`, err.message);
      else console.log(`✅ Tabla ${tabla} limpiada correctamente`);
    });
  });

  // Reiniciar autoincrementos
  db.run(`DELETE FROM sqlite_sequence;`, (err) => {
    if (err) console.error('⚠️ Error al reiniciar secuencia:', err.message);
    else console.log('🔢 Contadores autoincrement reiniciados');
  });

  // Volver a activar las claves foráneas
  db.run('PRAGMA foreign_keys = ON;');
});

db.close((err) => {
  if (err) console.error('❌ Error al cerrar la base de datos:', err.message);
  else console.log('✅ Base de datos cerrada correctamente');
});