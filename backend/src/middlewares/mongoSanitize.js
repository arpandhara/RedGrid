
// Custom MongoDB Sanitization Middleware
// Replaces express-mongo-sanitize to be compatible with Express 5 getters

const sanitize = (obj) => {
    if (obj instanceof Object) {
        for (const key in obj) {
            if (/^\$/.test(key)) {
                delete obj[key];
            } else {
                sanitize(obj[key]);
            }
        }
    }
    return obj;
};

const mongoSanitize = () => {
    return (req, res, next) => {
        if (req.body) sanitize(req.body);
        if (req.params) sanitize(req.params);
        if (req.query) sanitize(req.query);
        next();
    };
};

export default mongoSanitize;
