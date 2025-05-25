const db = require('../models');
const sendAlertEmail = require('../utils/sendAlertEmail');

module.exports = async function ipBlocker(req, res, next) {
  const ip = req.ip;
  const url = decodeURIComponent(req.originalUrl || '');
  const userAgent = req.headers['user-agent'] || '';

  // Checar se está banido
  const isBanned = await db.BannedIp.findByPk(ip);
  if (isBanned) {
    console.warn(`🔒 IP PERMANENTEMENTE BLOQUEADO: ${ip}`);
    return res.status(403).send('Acesso negado. IP banido.');
  }

  // Padrões suspeitos
  const padroesURL = [
    /wp-admin/i, /\.env/i, /\.git/i, /phpmyadmin/i, /setup-config/i,
    /nice ports/i, /passwd/i, /\.sql$/i, /id_rsa/i, /node_modules/i
  ];

  const padroesUserAgent = [
    /curl/i, /wget/i, /bot/i, /spider/i, /sqlmap/i, /nmap/i
  ];

  if (
    padroesURL.some(p => p.test(url)) ||
    padroesUserAgent.some(p => p.test(userAgent))
  ) {
    const motivo = `URL: ${url}\nUser-Agent: ${userAgent}`;
    await db.BannedIp.create({ ip, reason: motivo });
    await sendAlertEmail('🚨 IP Banido Permanentemente', `IP: ${ip}\n${motivo}`);
    console.warn(`🚫 IP ${ip} banido permanentemente por: ${motivo}`);
    return res.status(403).send('Acesso negado. IP banido permanentemente.');
  }

  next();
};
