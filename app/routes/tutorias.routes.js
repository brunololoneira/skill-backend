const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/validators/auth.middleware');
const { asociarTutoriaValidator } = require('../middlewares/validators/tutorias.validator');
const { associateTutelado, myTutelados } = require('../controllers/tutorias.controller');
console.log ({ requireAuth, asociarTutoriaValidator, associateTutelado, myTutelados });

router.post('/asociar', requireAuth, asociarTutoriaValidator, associateTutelado);
router.get('/tutelados',  requireAuth, myTutelados);

module.exports = router;