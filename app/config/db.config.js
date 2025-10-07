const path = require('path');

const DB_FILE = process.env.DB_FILE || path.join(__dirname, '..', '..', 'data', 'bd_autismo.db');

module.exports = { DB_FILE };
