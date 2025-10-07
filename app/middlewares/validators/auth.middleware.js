const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET); // { sub, tipo, iat, exp }
    return next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

module.exports = { requireAuth };