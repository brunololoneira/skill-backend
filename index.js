const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Middleware para que Express entienda JSON en peticiones POST
app.use(express.json());

// Línea que expone la carpeta "images"
app.use('/images', express.static(path.join(__dirname, 'images')));

// Importar rutas desde /routes
const usuariosRoutes = require('./routes/usuarios');
const emocionesRoutes = require('./routes/emociones');
const historiasRoutes = require('./routes/historias');
const tecnicasRoutes = require('./routes/tecnicas');

// Registrar rutas
app.use('/usuarios', usuariosRoutes);
app.use('/emociones', emocionesRoutes);
app.use('/historias', historiasRoutes);
app.use('/tecnicas', tecnicasRoutes);

// Iniciar el servidor
app.listen(port, () => {
  console.log(`🚀 Servidor Express escuchando en http://localhost:${port}`);
});