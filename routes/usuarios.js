const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/bd_autismo.db');

// Ruta GET /usuarios → Devuelve todos los usuarios
router.get('/', (req, res) => {
  db.all('SELECT * FROM usuarios', (err, rows) => {
    if (err) {
      console.error('Error al obtener usuarios:', err.message);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    res.json(rows);
  });
});

// Ruta GET /usuarios/login?idUsuario=...&pin=...
router.get('/login', (req, res) => {
  const { idUsuario, pin } = req.query;

  if (!idUsuario || !pin) {
    return res.status(400).json({ error: 'Faltan parámetros: idUsuario y pin son obligatorios.' });
  }

  const sql = `SELECT * FROM usuarios WHERE idUsuario = ? AND PIN = ?`;
  db.get(sql, [idUsuario, pin], (err, row) => {
    if (err) {
      console.error('Error en login:', err.message);
      return res.status(500).json({ error: 'Error interno del servidor.' });
    }

    if (!row) {
      return res.status(401).json({ error: 'Usuario o PIN incorrecto.' });
    }

    res.json({
      idUsuario: row.idUsuario,
      nombre: row.nombre
    });
  });
});

// Ruta GET /usuarios/tutelados/:idResponsable → devuelve los niños tutelados por un responsable
router.get('/tutelados/:idResponsable', (req, res) => {
  const { idResponsable } = req.params;

  const sql = `
    SELECT u.idUsuario, u.nombre, u.tipo
    FROM usuarios u
    JOIN tutorias t ON u.idUsuario = t.idTutelado
    WHERE t.idResponsable = ?
  `;

  db.all(sql, [idResponsable], (err, rows) => {
    if (err) {
      console.error('Error al obtener tutelados:', err.message);
      return res.status(500).json({ error: 'Error al obtener tutelados.' });
    }

    res.json(rows); // Devuelve un array con los niños asociados
  });
});




module.exports = router;