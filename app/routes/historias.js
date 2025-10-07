const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/bd_autismo.db');

router.post('/',(req, res) => {
    const { idUsuario, timestamp, historiaId } = req.body; //Extraigo los parámetros de la petición y los almaceno en variables
    // Validación básica
    if (!idUsuario || !historiaId || !timestamp) { //Si falta alguno que no sea causa, devuelvo un error
        return res.status(400).json({ error: 'Faltan campos obligatorios: idUsuario, timestamp, historiaId.'});
    }
    const sql = `INSERT INTO historias (idUsuario, timestamp, historiaId) VALUES (?, ?, ?)`; //Consulta SQL para emocion registrada
    const values = [idUsuario, timestamp, historiaId];

    db.run(sql, values, function(err) { //Utilizado para modificar base de datos (INSERT,UPDATE o DELETE), le paso la consulta
        if (err) {
            console.error('Error al insertar emoción:', err.message);
            return res.status(500).json({ error: 'Error al insertar la historia.' });
        }
        res.status(201).json({ message: 'Historia registrada correctamente.' });
        });
    });

// Ruta GET /historias/:idUsuario → Devuelve todas las tecnicas de un usuario
router.get('/:idUsuario', (req, res) => {
  const { idUsuario } = req.params;

  const sql = `SELECT * FROM historias WHERE idUsuario = ? ORDER BY timestamp ASC`;

  db.all(sql, [idUsuario], (err, rows) => {
    if (err) {
      console.error('Error al obtener historias:', err.message);
      return res.status(500).json({ error: 'Error al consultar las historias.' });
    }

    res.json(rows); // Devuelve un array de emociones (vacío si no hay)
  });
});

module.exports = router;