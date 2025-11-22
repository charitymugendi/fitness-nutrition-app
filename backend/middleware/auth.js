// middleware/auth.js
const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET; 

const protect = (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1]; 
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token provided' });
    }

    try {
        const decoded = jwt.verify(token, secret);
        req.userId = decoded.id; 
        next();
    } catch (error) {
        console.error("Token verification failed:", error.message);
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

// Fix the export - you had module.exports = router; which was wrong
module.exports = { protect };