const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/bd_autismo.db');

router.post('/',(req, res) => {
    const { idUsuario, emocion, causa, timestamp } = req.body; //Extraigo los parámetros de la petición y los almaceno en variables
    // Validación básica
    if (!idUsuario || !emocion || !timestamp) { //Si falta alguno que no sea causa, devuelvo un error
        return res.status(400).json({ error: 'Faltan campos obligatorios: idUsuario, emocion, timestamp.' });
    }

    const VENTANA_MS = 3000;
    const bucket = Math.floor(Date.now() / VENTANA_MS);

    const sql = `INSERT OR IGNORE INTO emociones (idUsuario, timestamp, emocion, causa, bucket)
    VALUES (?, ?, ?, ?, ?)`; //SQL para emocion registrada
    const values = [idUsuario, timestamp, emocion, causa || null, bucket];//si no hay causa entrego null

    db.run(sql, values, function(err) { //Utilizado para modificar base de datos (INSERT,UPDATE o DELETE), le paso la consulta
        if (err) {
            console.error('Error al insertar emoción:', err.message);
            return res.status(500).json({ error: 'Error al insertar la emoción.' });
        }
        const deduped = this.changes === 0;
        res.status(201).json({ message: 'Emoción registrada correctamente.' });
        });
    });

// Ruta GET /emociones/:idUsuario → Devuelve todas las emociones de un usuario
router.get('/:idUsuario', (req, res) => {
  const { idUsuario } = req.params;

  const sql = `SELECT * FROM emociones WHERE idUsuario = ? ORDER BY timestamp ASC`;

  db.all(sql, [idUsuario], (err, rows) => {
    if (err) {
      console.error('Error al obtener emociones:', err.message);
      return res.status(500).json({ error: 'Error al consultar las emociones.' });
    }

    res.json(rows); // Devuelve un array de emociones (vacío si no hay)
  });
});



module.exports = router;