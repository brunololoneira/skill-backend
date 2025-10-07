// app/routes/auth.routes.js
const express = require('express');
const router = express.Router();

const {
  registerResponsable,
  registerTutelado,
  login,
} = require('../controllers/auth.controller');

const {
  registerUsuarioValidator,
  loginValidator,
} = require('../middlewares/validators/auth.validator');

router.post('/register/responsable', registerUsuarioValidator, registerResponsable);
router.post('/register/tutelado',    registerUsuarioValidator, registerTutelado);
router.post('/login',                loginValidator,           login);

module.exports = router;