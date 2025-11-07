const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Ruta a tu base de datos
const dbPath = path.join(__dirname, 'data', 'bd_autismo.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error al conectar con la base de datos:', err.message);
  } else {
    console.log('✅ Conexión establecida con la base de datos.');
    actualizarTabla();
  }
});

function actualizarTabla() {
  db.all("PRAGMA table_info(historias)", (err, columns) => {
    if (err) {
      console.error("❌ Error al obtener información de la tabla:", err.message);
      return cerrarConexion();
    }

    const colNames = columns.map(c => c.name);

    // --- Añadir columnas si no existen ---
    const promesas = [];

    if (!colNames.includes('idVentana')) {
      promesas.push(
        new Promise((resolve, reject) => {
          db.run("ALTER TABLE historias ADD COLUMN idVentana INTEGER;", (err) => {
            if (err) {
              console.error("⚠️ Error al añadir idVentana:", err.message);
              reject(err);
            } else {
              console.log("✅ Columna 'idVentana' añadida correctamente.");
              resolve();
            }
          });
        })
      );
    } else {
      console.log("ℹ️ La columna 'idVentana' ya existe. No se modifica.");
    }

    if (!colNames.includes('respuesta')) {
      promesas.push(
        new Promise((resolve, reject) => {
          db.run("ALTER TABLE historias ADD COLUMN respuesta TEXT NOT NULL DEFAULT '';", (err) => {
            if (err) {
              console.error("⚠️ Error al añadir respuesta:", err.message);
              reject(err);
            } else {
              console.log("✅ Columna 'respuesta' añadida correctamente (NOT NULL).");
              resolve();
            }
          });
        })
      );
    } else {
      console.log("ℹ️ La columna 'respuesta' ya existe. No se modifica.");
    }

    // --- Crear índice si no existe ---
    promesas.push(
      new Promise((resolve, reject) => {
        db.get("SELECT name FROM sqlite_master WHERE type='index' AND name='ux_historias_user_ventana';", (err, row) => {
          if (err) {
            console.error("⚠️ Error al comprobar el índice:", err.message);
            reject(err);
          } else if (!row) {
            db.run("CREATE UNIQUE INDEX ux_historias_user_ventana ON historias(idUsuario, idVentana);", (err) => {
              if (err) {
                console.error("⚠️ Error al crear el índice:", err.message);
                reject(err);
              } else {
                console.log("✅ Índice único 'ux_historias_user_ventana' creado correctamente.");
                resolve();
              }
            });
          } else {
            console.log("ℹ️ El índice 'ux_historias_user_ventana' ya existe.");
            resolve();
          }
        });
      })
    );

    // --- Esperar a que todas las operaciones terminen ---
    Promise.allSettled(promesas).then(() => {
      cerrarConexion();
    });
  });
}

function cerrarConexion() {
  db.close((err) => {
    if (err) {
      console.error('❌ Error al cerrar la conexión:', err.message);
    } else {
      console.log('✅ Modificaciones completadas y conexión cerrada correctamente.');
    }
  });
}
