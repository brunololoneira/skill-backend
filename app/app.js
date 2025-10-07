// app/app.js
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth.routes');

// Si tus routers “Alexa” están en /routes (carpeta en la raíz del proyecto)
const usuariosRoutes  = require('./routes/usuarios');
const emocionesRoutes = require('./routes/emociones');
const historiasRoutes = require('./routes/historias');
const tecnicasRoutes  = require('./routes/tecnicas');
const tutoriasRoutes = require('./routes/tutorias.routes');

const app = express();

// Middlewares globales
app.use(cors());              // si quieres, restringe origin más adelante
app.use(express.json());

// Servir estáticos (ajuste de ruta porque app.js está en /app)
app.use('../images', express.static(path.join(__dirname, '..', 'images')));

// Healthcheck
app.get('/health', (_req, res) => {
  res.json({ ok: true, status: 'running' });
});

// Rutas Web
app.use('/auth', authRoutes);

// Rutas “Alexa” (tus rutas existentes)
app.use('/usuarios',  usuariosRoutes);
app.use('/emociones', emocionesRoutes);
app.use('/historias', historiasRoutes);
app.use('/tecnicas',  tecnicasRoutes);
app.use('/tutorias', tutoriasRoutes);

module.exports = app;