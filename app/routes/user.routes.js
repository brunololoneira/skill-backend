const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/validators/auth.middleware');
const { associateTutelado, myTutelados } = require('../controllers/user.controller');

router.post('/associate', requireAuth, associateTutelado);
router.get('/tutelados',  requireAuth, myTutelados);

module.exports = router;