// app/controllers/tutorias.controller.js
const { db } = require('../models/db');

function getUserById(id) {
  return new Promise((resolve, reject) =>
    db.get('SELECT idUsuario, tipo FROM usuarios WHERE idUsuario=?', [id],
      (e, row) => e ? reject(e) : resolve(row))
  );
}

// verificacion de credenciales
function verificarTuteladoCred(idTutelado, pin) {
  return new Promise((resolve, reject) =>
    db.get(
      'SELECT idUsuario, tipo FROM usuarios WHERE idUsuario=? AND PIN=?',
      [idTutelado, pin],
      (e, row) => e ? reject(e) : resolve(row) // row solo existe si PIN coincide
    )
  );
}

async function crearTutoria(req, res) {
  const idResponsable = req.user?.sub; // del JWT
  const idTutelado = req.body.idTutelado;
  const pin = req.body.pin;            

  try {
    const resp = await getUserById(idResponsable);
    if (!resp || resp.tipo !== 'responsable') {
      return res.status(403).json({ error: 'No eres responsable' });
    }

    const tut = await verificarTuteladoCred(idTutelado, pin);
    if (!tut || tut.tipo !== 'tutelado') {
      // No revelar si el fallo fue id o pin (mejor seguridad)
      return res.status(401).json({ error: 'idTutelado o PIN inválidos' });
    }
    
    db.run(
      'INSERT OR IGNORE INTO tutorias (idResponsable, idTutelado) VALUES (?, ?)',
      [idResponsable, idTutelado],
      function (err) {
        if (err) return res.status(500).json({ error: 'Error insertando relación' });
        const created = this.changes > 0;
        return res.status(created ? 201 : 200).json({ ok: true });
      }
    );
  } catch (e) {
    console.error('Error creando tutoría:', e.message);
    return res.status(500).json({ error: 'Error interno' });
  }
}

function listarMisTutelados(req, res) {
  const idResponsable = req.user?.sub;
  db.all(
    `SELECT u.idUsuario, u.nombre, u.tipo
       FROM usuarios u
       JOIN tutorias t ON u.idUsuario = t.idTutelado
      WHERE t.idResponsable = ?
      ORDER BY u.nombre ASC`,
    [idResponsable],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Error consultando tutelados' });
      res.json(rows);
    }
  );
}


module.exports = { crearTutoria, listarMisTutelados};
