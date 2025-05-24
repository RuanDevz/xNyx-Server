// // middleware/checkApiKey.js
// module.exports = function checkApiKey(req, res, next) {
//   const origin = req.headers.origin;
//   const referer = req.headers.referer;
//   const apiKey = req.headers['x-api-key'];

//   // const allowedApiKey = process.env.VITE_FRONTEND_API_KEY;
//   // const allowedOrigins = [
//   //   'https://xnyxleaks.com',
//   //   'http://localhost:5173',
//   // ];

//   // const isAllowedOrigin =
//   //   allowedOrigins.includes(origin) ||
//   //   allowedOrigins.some(o => referer?.startsWith(o));

//   if (apiKey !== allowedApiKey || !isAllowedOrigin) {
//     return res.status(403).json({ error: 'Unauthorized access' });
//   }

//   next();
// };

require('dotenv').config();

const checkApiKey = (req, res, next) => {
  const key = req.headers['x-api-key'];

  if (!key || key !== process.env.VITE_FRONTEND_API_KEY) {
    return res.status(403).json({ error: 'Access Denied' });
  }

  next();
};

module.exports = checkApiKey;