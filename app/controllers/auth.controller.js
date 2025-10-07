// app/controllers/auth.controller.js (CommonJS)
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { createUsuario, verificarUsuario } = require('../models/user.model');

const { JWT_SECRET, JWT_EXPIRES } = require('../config/auth.config');

async function registerResponsable(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { nombre, pin } = req.body;
  try {
    const { idUsuario, tipo } = await createUsuario({ nombre, pin, tipo: 'responsable' });
    res.status(201).json({ idUsuario, nombre, tipo });
  } catch (e) {
    console.error('Error registrando responsable:', e.message);
    res.status(500).json({ error: 'No se pudo registrar el responsable' });
  }
}

async function registerTutelado(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { nombre, pin } = req.body;
  try {
    const { idUsuario, tipo } = await createUsuario({ nombre, pin, tipo: 'tutelado' });
    res.status(201).json({ idUsuario, nombre, tipo });
  } catch (e) {
    console.error('Error registrando tutelado:', e.message);
    res.status(500).json({ error: 'No se pudo registrar el tutelado' });
  }
}

async function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { idUsuario, pin } = req.body;
  try {
    const user = await verificarUsuario(idUsuario, pin);
    if (!user) return res.status(401).json({ error: 'Usuario o PIN incorrecto' });

    const token = jwt.sign({ sub: user.idUsuario, tipo: user.tipo }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    res.json({ token, idUsuario: user.idUsuario, nombre: user.nombre ?? null, tipo: user.tipo ?? null });
  } catch (e) {
    console.error('Error en login:', e.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = { registerResponsable, registerTutelado, login };