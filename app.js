import express from 'express'
import cookieParser from 'cookie-parser'
import logger from 'morgan'
import mongoose from 'mongoose'
import routerIndex from './routes/index.js'
import routerAuth from './routes/auth.js'
import routerCategories from './routes/categories.js'
import routerSkills from './routes/skills.js'
import routerServices from './routes/services.js'
import routerJobs from './routes/jobs.js'
import routerOffers from './routes/offers.js'
import routerOrders from './routes/orders.js'
import routerWallets from './routes/wallets.js'
import routerAdminBanks from './routes/adminBanks.js'
import routerTransaction from './routes/transactions.js'
import routerComplain from './routes/complaints.js'
import routerUser from './routes/users.js'
import {requireAuth, checkUser} from './middleware/authMiddleware.js'
import dotenv from 'dotenv'
import Agenda from 'agenda'
import cors from 'cors';
const agenda = new Agenda({db: {address: "mongodb+srv://quangthinhhigh:vladimir1@cluster0.ygznx4h.mongodb.net/Freelancer?retryWrites=true&w=majority"}})
var app = express();
dotenv.config();

// var refreshTokens = [];
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());
// app.use(bodyParser.json());
// app.use(express.static(path.join(__dirname, 'public')));
// const buffer = readFileSync(new URL('./public', import.meta.url));


app.post('/services', checkUser);
app.get('/services/myService', checkUser);
app.get('/services/myService/detail/:service_id', checkUser);
app.put('/services/:service_id', checkUser);

app.post('/jobs', checkUser)
app.get('/jobs', checkUser)
app.get('/jobs/myjob', checkUser)
app.get('/jobs/myjob/detail/:job_id', checkUser)
app.get('/jobs/others/detail/:job_id', checkUser)
app.put('/jobs/:job_id', checkUser)
app.patch('/jobs/toggle/:job_id', checkUser)
app.delete('/jobs/:job_id', checkUser)
app.patch('/jobs/approve/:job_id', checkUser)

app.get('/offers/:job_id', checkUser)
app.post('/offers/:job_id', checkUser)
// app.patch('/offers/:job_id', checkUser)
// app.delete('/offers/:job_id', checkUser)
// app.get('/offers',checkUser)

app.get('/order', checkUser)
app.post('/order/acceptOffer/:job_offer_id', checkUser)
app.post('/order/cancel/:order_id', checkUser)
app.post('/order/conplete/:order_id', checkUser)
app.post('/order/complain/:order_id', checkUser)
app.get('/order/:order_id', checkUser)
app.post('/order/confirm/:order_id', checkUser)
app.post('/order/request/:service_id', checkUser)
app.post('/order/finishMentor/:order_id', checkUser)
app.get('/order/all', checkUser)

app.get('/wallet/my', checkUser)
app.get('/wallet/:user_id', checkUser)
app.get('/wallet', checkUser)
app.patch('/wallet/deposit', checkUser)
app.patch('/wallet/withdraw', checkUser)
app.post('/wallet/lock/:user_id', checkUser)
app.post('/wallet/unlock/:user_id', checkUser)

app.get('/admin_bank/my', checkUser)
app.post('/admin_bank/create', checkUser)
app.delete('/admin_bank/delete/:id', checkUser)
app.get('/admin_bank/all', checkUser)

app.get('/transaction/external', checkUser)
app.get('/transaction/internal', checkUser)
app.get('/transaction', checkUser)
app.get('/transaction/:transaction_id', checkUser)
app.get('/transaction/order/:order_id', checkUser)
app.post('/transaction/accept/:transaction_id', checkUser)
app.post('/transaction/accept_withdraw/:transaction_id', checkUser)
app.post('/transaction/accept_deposit/:transaction_id', checkUser)
app.get('/transaction/deposits', checkUser)

app.get('/orderComplain', checkUser)
app.get('/orderComplain/order/:orderId', checkUser)
app.get('/orderComplain/my', checkUser)
app.put('/orderComplain/:orderComplainId/resolve', checkUser)
app.get('/orderComplain/:orderComplainId/detail', checkUser)

app.get('/users', checkUser)
app.patch('/users/change/password',checkUser)
app.put('/users/change/profile',checkUser)
app.post('/users/verify/:active_token', checkUser)
// router.get('/users/forgot-password', users.resetPassword)
// router.post('/users/forgot-password/verify/:active_token', users.checkActiveToken)
// router.post('/users/forgot-password/verify/updatePassword', users.updatePassword)
app.post('/users/createCrmUser', checkUser)

app.use(routerAuth);
app.use(routerCategories)
app.use(routerSkills)
app.use(routerServices)
app.use(routerJobs)
app.use(routerOffers)
app.use(routerOrders)
app.use(routerWallets)
app.use(routerAdminBanks)
app.use(routerTransaction)
app.use(routerComplain)
app.use(routerUser)


// catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   next(createError(404));
// });

// // error handler
// app.use(function(err, req, res, next) {
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};

//   res.status(err.status || 500);
//   console.log("error")
// });

mongoose.connect('mongodb+srv://quangthinhhigh:vladimir1@cluster0.ygznx4h.mongodb.net/Freelancer?retryWrites=true&w=majority')
.then(() => {
  app.listen(5000);
})
.catch(err => {
  console.log(err)
})
export default app;
