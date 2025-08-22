const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    
    const errorResponse = {
    success: false,
    message: err.message || 'Error interno del servidor',
    status: err.status || 500,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
};

res.status(errorResponse.status).json(errorResponse);
};

module.exports = errorHandler;