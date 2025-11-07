const express = require('express');
const router = express.Router();
const { db } = require('../models/db'); // Ajusta la ruta si tu estructura es distinta

// --- POST /historias ---
router.post('/', (req, res) => {
  const { idUsuario, historiaId, respuesta, timestamp } = req.body;

  // Validación básica
  if (!idUsuario || !historiaId || !respuesta || !timestamp) {
    return res.status(400).json({ error: 'Faltan campos obligatorios: idUsuario, historiaId, respuesta o timestamp.' });
  }

  // Generar idVentana (ventanas de 5 segundos, mismo criterio que en emociones y técnicas)
  const VENTANA_MS = 5000;
  const idVentana = Math.floor(Date.now() / VENTANA_MS);

  const sql = `
    INSERT INTO historias (idUsuario, historiaId, timestamp, idVentana, respuesta)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(idUsuario, idVentana) DO UPDATE SET
      historiaId = excluded.historiaId,
      respuesta  = excluded.respuesta,
      timestamp  = excluded.timestamp
  `;
  
  const values = [idUsuario, historiaId, timestamp, idVentana, respuesta];

  db.run(sql, values, function (err) {
    if (err) {
      console.error('Error al insertar historia:', err.message);
      return res.status(500).json({ error: 'Error al insertar la historia.' });
    }

    const deduped = this.changes === 0;
    res.status(201).json({
      message: 'Historia registrada correctamente.',
      deduplicada: deduped
    });
  });
});

// --- GET /historias/:idUsuario ---
router.get('/:idUsuario', (req, res) => {
  const { idUsuario } = req.params;
  const sql = `SELECT * FROM historias WHERE idUsuario = ? ORDER BY timestamp ASC`;

  db.all(sql, [idUsuario], (err, rows) => {
    if (err) {
      console.error('Error al obtener historias:', err.message);
      return res.status(500).json({ error: 'Error al consultar las historias.' });
    }

    res.json(rows);
  });
});

module.exports = router;