// app/models/db.js
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Lee la ruta desde el entorno (Render/local). Usa un fallback.
const { DB_FILE } = require('../config/db.config');

// Asegura que exista la carpeta donde está el archivo .db
const dir = path.dirname(DB_FILE);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

// Abre la conexión (instancia única)
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) {
    console.error('Error abriendo BD:', err.message);
  } else {
    console.log('Conectado a SQLite:', DB_FILE);
  }
});

// Opcional: espera hasta 5s si el archivo está temporalmente bloqueado
try { db.configure?.('busyTimeout', 5000); } catch {}

// Activa FOREIGN KEYs (SQLite las trae OFF por defecto)
db.serialize(() => db.run('PRAGMA foreign_keys = ON'));

module.exports = { db };