function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    error: `Resource not found: ${req.method} ${req.originalUrl}`
  });
}

function errorHandler(err, req, res, next) {
  console.error('[Error]', err.stack || err.message);

  // SQLite foreign key constraint violation
  if (err.message && err.message.includes('FOREIGN KEY constraint failed')) {
    return res.status(400).json({
      success: false,
      error: 'Invalid reference: Related entity does not exist.'
    });
  }

  // SQLite unique constraint violation
  if (err.message && err.message.includes('UNIQUE constraint failed')) {
    return res.status(409).json({
      success: false,
      error: 'Conflict: An item with this unique value already exists.'
    });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
