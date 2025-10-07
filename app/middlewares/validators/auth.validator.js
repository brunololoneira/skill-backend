// app/middlewares/validators/auth.validator.js
const { body } = require('express-validator');

const registerUsuarioValidator = [
  body('nombre').isString().trim().notEmpty(),
  body('pin').isString().trim().isLength({ min: 4, max: 32 })
];

const loginValidator = [
  body('idUsuario').isInt().toInt(),
  body('pin').isString().trim().notEmpty()
];

module.exports = { registerUsuarioValidator, loginValidator };