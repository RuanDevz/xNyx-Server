require('dotenv').config();

const checkApiKey = (req, res, next) => {
  const key = req.headers['x-api-key'];

  if (!key || key !== process.env.VITE_FRONTEND_API_KEY) {
    return res.status(403).json({ error: 'Access Denied' });
  }

  next();
};

module.exports = checkApiKey;