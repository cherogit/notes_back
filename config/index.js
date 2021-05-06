exports.DB_HOST = process.env.DB_HOST
exports.DB_PORT = process.env.DB_PORT
exports.DB_NAME = process.env.DB_NAME

exports.HOST = process.env.HOST || `127.0.0.1`
exports.PORT = parseInt(process.env.PORT || 8000)

exports.PWD_SALT = process.env.PWD_SALT