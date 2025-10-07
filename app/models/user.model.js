const { db } = require('./db'); 

function createUsuario({ nombre, pin, tipo }) {
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO usuarios (nombre, PIN, tipo) VALUES (?, ?, ?)`;
    db.run(sql, [nombre, pin, tipo], function (err) {
      if (err) return reject(err);
      resolve({ idUsuario: this.lastID, nombre, tipo });
    });
  });
}

function verificarUsuario(idUsuario, pin) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM usuarios WHERE idUsuario = ? AND PIN = ?`;
    db.get(sql, [idUsuario, pin], (err, row) => {
      if (err) return reject(err);
      resolve(row || null); // row incluirá 'tipo' si existe en la tabla
    });
  });
}

module.exports = { createUsuario, verificarUsuario };