// index.js
require('dotenv').config();
const app = require('./app/app');

const PORT = process.env.PORT || 3000;   // Render te inyecta PORT; en local usa 3000
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor Express escuchando en http://localhost:${PORT}`);
});