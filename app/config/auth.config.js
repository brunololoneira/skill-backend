const JWT_SECRET  = process.env.JWT_SECRET || '819be2c325c2de564ab6c1de16fbe2a664b9a0a37ec4c99e0982efc0912c078607e9a95e964f9aa417455be8155c9cfcf0ca882fd435cd8f45a0b2df2e0ee798';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

module.exports = { JWT_SECRET, JWT_EXPIRES };