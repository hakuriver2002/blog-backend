const success = (res, data, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};

const created = (res, data, message = 'Created Successfully') => {
    return success(res, data, message, 201);
};

const error = (res, message = 'Error System', statusCode = 500) => {
    return res.status(statusCode).json({
        success: false,
        message,
    });
};

module.exports = { success, created, error };