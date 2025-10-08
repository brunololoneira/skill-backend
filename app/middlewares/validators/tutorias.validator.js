const { body } = require('express-validator');

const asociarTutoriaValidator = [
  body('idTutelado').isInt({ min: 1 }).toInt(),
  body('pin').isString().trim().isLength({ min: 4, max: 32 }),
];

module.exports = { asociarTutoriaValidator };