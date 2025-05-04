const express = require('express');
const cors = require('cors');
const db = require('./models');
require('dotenv').config();
const { Pool } = require('pg');
const app = express();


app.use(cors())

const webhookRouter = require('./routes/webhook');

app.use('/webhook', webhookRouter)


app.use((req, res, next) => {
  if (req.originalUrl === '/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

// Rotas
const userRouter = require('./routes/user');
const FreeRouter = require('./routes/Free');
const payRouter = require('./routes/payment');
const VipRouter = require('./routes/Vip');
const Forgotpass = require('./routes/forgotpassword');
const ResetPasswordRouter = require('./routes/resetpassword');
const UpdateVipStatus = require('./routes/updatevipstatus');
const StatsRouter = require('./routes/stats');  
const RequestsRouter = require('./routes/requests');  
const recommendationsRouter = require('./routes/recommendations');
const FilteroptionsRouter = require('./routes/filter_options');
const authRoutes = require('./routes/authRoutes');
const renewVipRouter = require('./routes/Renewvip');
const CancelRouter = require('./routes/webhook');


app.use('/auth', userRouter);
app.use('/cancel-subscription', CancelRouter);
app.use('/auth', authRoutes);
app.use('/freecontent', FreeRouter);
app.use('/vipcontent', VipRouter);
app.use('/pay', payRouter);
app.use('/forgot-password', Forgotpass);
app.use('/reset-password', ResetPasswordRouter);
app.use('/update-vip-status', UpdateVipStatus);
app.use('/api/stats', StatsRouter);  
app.use('/admin/requests', RequestsRouter);
app.use('/recommendations', recommendationsRouter);
app.use('/filteroptions', FilteroptionsRouter);
app.use('/auth', renewVipRouter);

// Banco
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL, 
});

pool.connect((err, client, done) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
    return;
  }
  console.log('Conexão bem-sucedida ao banco de dados');
  done();
});

db.sequelize.authenticate()
  .then(() => {
    console.log('Conexão com o banco de dados estabelecida com sucesso.');
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
