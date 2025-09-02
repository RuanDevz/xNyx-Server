const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(express.json());

app.use(cors());

const webhookRouter = require('./routes/webhook');
app.use('/webhook', webhookRouter);



// Bloquear bots e agentes suspeitos
app.use((req, res, next) => {
  const ua = req.headers['user-agent'] || '';
  if (/curl|wget|bot|spider/i.test(ua)) {
    return res.status(403).send('Forbidden');
  }
  next();
});

// Bloqueios de URLs maliciosas
app.use((req, res, next) => {
  const url = decodeURIComponent(req.originalUrl);
  const bloqueios = [
    /\.bak$/i,
    /\.old$/i,
    /nice ports/i,
    /trinity/i,
    /\.git/i,
    /\.env/i,
    /wp-admin/i,
    /phpmyadmin/i,
  ];
  for (const pattern of bloqueios) {
    if (pattern.test(url)) {
      console.warn(`Tentativa suspeita: ${url}`);
      return res.status(403).send('Access denied.');
    }
  }
  next();
});

// Middlewares personalizados
const checkApiKey = require('./Middleware/Checkapikey');
const protectPatterns = require('./Middleware/protectPatterns');
app.use(protectPatterns);

// Rotas
const userRouter = require('./routes/user');
const FreeRouter = require('./routes/Free');
const payRouter = require('./routes/payment');
const VipRouter = require('./routes/Vip');
const Forgotpass = require('./routes/forgotpassword');
const ResetPasswordRouter = require('./routes/resetpassword');
const StatsRouter = require('./routes/stats');
const RequestsRouter = require('./routes/requests');
const recommendationsRouter = require('./routes/recommendations');
const FilteroptionsRouter = require('./routes/filter_options');
const authRoutes = require('./routes/authRoutes');
const renewVipRouter = require('./routes/Renewvip');
const CancelRouter = require('./routes/Cancelsubscription');
const contentRouter = require('./routes/content');
const reportRouter = require('./routes/Report');
const StripePortal = require('./routes/stripeportal')
// Uso das rotas com verificação de API key
app.use('/auth', checkApiKey, authRoutes);
app.use('/auth', checkApiKey, userRouter);
app.use('/auth', checkApiKey, renewVipRouter);

app.use('/cancel-subscription', checkApiKey, CancelRouter);
app.use('/freecontent', checkApiKey, FreeRouter);
app.use('/vipcontent', checkApiKey, VipRouter);
app.use('/pay', checkApiKey, payRouter);
app.use('/forgot-password', checkApiKey, Forgotpass);
app.use('/reset-password', checkApiKey, ResetPasswordRouter);
app.use('/api/stats', checkApiKey, StatsRouter);
app.use('/admin/requests', checkApiKey, RequestsRouter);
app.use('/recommendations', recommendationsRouter);
app.use('/filteroptions', FilteroptionsRouter);
app.use('/content', checkApiKey, contentRouter);
app.use('/reports', checkApiKey, reportRouter);
app.use('/stripe-portal', StripePortal);

// PostgreSQL (via Pool)
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

app.set('trust proxy', true); //
pool.connect((err, client, done) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
    return;
  }
  console.log('Conexão bem-sucedida ao banco de dados');
  done();
});

// Sequelize
const db = require('./models');
db.sequelize.authenticate()
  .then(() => {
    console.log('Conexão com o banco de dados Sequelize estabelecida com sucesso.');
    return db.sequelize.sync();
  })
  .then(() => {
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}...`);
    });
  })
  .catch(err => {
    console.error('Erro ao conectar ao banco de dados Sequelize:', err);
  });
