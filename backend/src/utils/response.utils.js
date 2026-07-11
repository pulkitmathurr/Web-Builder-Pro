const sendSuccess = (res, message, data = null, statusCode = 200) => {
    const response = {
        success: true,
        message,
    };

    if (data !== null) {
        response.data = data;
    }

    return res.status(statusCode).json(response);
};

const sendError = (res, message, statusCode = 500, errors = null) => {
    const response = {
        success: false,
        message,
    };

    if (errors !== null) {
        response.errors = errors;
    }

    return res.status(statusCode).json(response);
};

module.exports = { sendSuccess, sendError };