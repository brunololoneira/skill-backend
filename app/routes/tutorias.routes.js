const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/validators/auth.middleware');
const { associateTutelado, myTutelados } = require('../controllers/tutorias.controller');

router.post('/asociar', requireAuth, associateTutelado);
router.get('/tutelados',  requireAuth, myTutelados);

module.exports = router;