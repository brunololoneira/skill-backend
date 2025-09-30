const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/bd_autismo.db');

router.post('/',(req, res) => {
    const { idUsuario, timestamp, tecnica } = req.body; //Extraigo los parámetros de la petición y los almaceno en variables
    // Validación básica
    if (!idUsuario || !tecnica || !timestamp) { //Si falta alguno le devuelvo un error
        return res.status(400).json({ error: 'Faltan campos obligatorios: idUsuario, timestamp, tecnica.' });
    }
    const VENTANA_MS = 5000;
    const idVentanta = Math.floor(Date.now() / VENTANA_MS);
    const sql = `
    INSERT INTO tecnicas (idUsuario, timestamp, tecnica, idVentanta)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(idUsuario, idVentanta) DO UPDATE SET
      tecnica   = excluded.tecnica,
      timestamp = excluded.timestamp
  `;
    const values = [idUsuario, timestamp, tecnica, idVentana];

    db.run(sql, values, function(err) { //Utilizado para modificar base de datos (INSERT,UPDATE o DELETE), le paso la consulta
        if (err) {
            console.error('Error al insertar técnica:', err.message);
            return res.status(500).json({ error: 'Error al insertar la historia.' });
        }
        res.status(201).json({ message: 'Técnica registrada correctamente.' });
        });
    });

// Ruta GET /tecnicas/:idUsuario → Devuelve todas las tecnicas de un usuario
router.get('/:idUsuario', (req, res) => {
  const { idUsuario } = req.params;

  const sql = `SELECT * FROM tecnicas WHERE idUsuario = ? ORDER BY timestamp ASC`;

  db.all(sql, [idUsuario], (err, rows) => {
    if (err) {
      console.error('Error al obtener tecnicas:', err.message);
      return res.status(500).json({ error: 'Error al consultar las tecnicas.' });
    }

    res.json(rows); // Devuelve un array de emociones (vacío si no hay)
  });
});

module.exports = router;