const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/validators/auth.middleware');
const { asociarTutoriaValidator } = require('../middlewares/validators/tutorias.validator');
const { crearTutoria, listarMisTutelados} = require('../controllers/tutorias.controller');
console.log ({ requireAuth, asociarTutoriaValidator, associateTutelado, myTutelados });
 
router.post('/asociar', requireAuth, asociarTutoriaValidator, crearTutoria);
router.get('/tutelados',  requireAuth, listarMisTutelados);

module.exports = router;