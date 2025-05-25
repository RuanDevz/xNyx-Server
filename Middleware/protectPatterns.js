const sendAlertEmail = require('../utils/sendAlertEmail');

const blockedPatterns = [
  /\.bak$/i,
  /\.old$/i,
  /\.git/i,
  /\.env/i,
  /\.sql$/i,
  /\.htaccess/i,
  /setup-config\.php/i,
  /phpmyadmin/i,
  /wp-admin/i,
  /wp-login/i,
  /nice ports/i,
  /trinity/i,
  /cgi-bin/i,
  /etc\/passwd/i,
  /passwd/i,
  /id_rsa/i,
  /composer\.(json|lock)/i,
  /package\.json/i,
  /node_modules/i,
  /\.\./i
];

const blockedUserAgents = [
  /curl/i,
  /wget/i,
  /httpclient/i,
  /python/i,
  /scrapy/i,
  /bot/i,
  /spider/i,
  /nikto/i,
  /sqlmap/i,
  /masscan/i,
  /nmap/i
];

module.exports = async function protectPatterns(req, res, next) {
  const url = decodeURIComponent(req.originalUrl);
  const userAgent = req.headers['user-agent'] || '';
  const ip = req.ip;

  // Bloqueio por URL
  for (const pattern of blockedPatterns) {
    if (pattern.test(url)) {
      const msg = `[🚨 BLOQUEIO URL] IP: ${ip}\nURL: ${url}`;
      console.warn(msg);
      await sendAlertEmail('🚨 Tentativa de Acesso Suspeita (URL)', msg);
      return res.status(403).send('Acesso negado.');
    }
  }

  // Bloqueio por User-Agent
  for (const pattern of blockedUserAgents) {
    if (pattern.test(userAgent)) {
      const msg = `[🚨 BLOQUEIO USER-AGENT] IP: ${ip}\nAgente: ${userAgent}`;
      console.warn(msg);
      await sendAlertEmail('🚨 Tentativa de Acesso Suspeita (User-Agent)', msg);
      return res.status(403).send('Forbidden');
    }
  }

  next();
};
