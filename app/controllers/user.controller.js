const { db } = require('../models/db');

async function associateTutelado(req, res) {
  const idResponsable = req.user?.sub;            // del JWT
  const { idTutelado } = req.body;

  if (!Number.isInteger(idTutelado)) {
    return res.status(400).json({ error: 'idTutelado inválido' });
  }

  // Verificar roles en usuarios
  const getUser = (id) => new Promise((resolve, reject) =>
    db.get('SELECT idUsuario, tipo FROM usuarios WHERE idUsuario=?', [id],
      (e, row) => e ? reject(e) : resolve(row)));

  try {
    const resp = await getUser(idResponsable);
    const tut  = await getUser(idTutelado);
    if (!resp || resp.tipo !== 'responsable') return res.status(403).json({ error: 'No eres responsable' });
    if (!tut  || tut.tipo  !== 'tutelado')    return res.status(400).json({ error: 'El tutelado no existe o no es tutelado' });

    // Evitar duplicados (recomendado índice único en tutorias (idResponsable,idTutelado))
    db.run(
      `INSERT OR IGNORE INTO tutorias (idResponsable, idTutelado) VALUES (?, ?)`,
      [idResponsable, idTutelado],
      function (err) {
        if (err) return res.status(500).json({ error: 'Error insertando relación' });
        const created = this.changes > 0;
        return res.status(created ? 201 : 200).json({ ok: true });
      }
    );
  } catch (e) {
    return res.status(500).json({ error: 'Error interno' });
  }
}

async function myTutelados(req, res) {
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
      return res.json(rows);
    }
  );
}

module.exports = { associateTutelado, myTutelados };