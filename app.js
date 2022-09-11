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
import routerHomePage from './routes/homepage.js'
import {requireAuth, checkUser} from './middleware/authMiddleware.js'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import bodyParser from 'body-parser'
var app = express();
dotenv.config();

// var refreshTokens = [];
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// app.use(bodyParser.json());
// app.use(express.static(path.join(__dirname, 'public')));
// const buffer = readFileSync(new URL('./public', import.meta.url));


// function authenToken(req, res, next) {
//   const authorizationHeader = req.headers['authorization']
//   const token = authorizationHeader.split(' ')[1]
//   if (!token) res.sendStatus(401);

//   jwt.verify(token, process.env.ACCESS_TOKEN, (err, data) => {
//     console.log(err, data)
//     if (err) res.sendStatus(403);
//     next();
//   })
// }

// app.post('/refreshToken', (req, res, next) => {
//   const refreshToken = req.body.token;
//   if (!refreshToken) res.sendStatus(401); //unauthorized
//   if (!refreshTokens.include(refreshToken)) res.sendStatus(403) //forbiden
//   jwt.verify(refreshTokens, process.env.REFRESH_TOKEN, (err, data) => {
//     console.log(err, data)
//     if (err) res.sendStatus(403);
//     const accessToken = jwt.sign({userName: data.userName}, process.env.ACCESS_TOKEN, {expiresIn: '30s'})
//     res.json({accessToken})
//   })
// })

app.post('/services', checkUser);
app.get('/services/myService', checkUser);
app.get('/services/myService/detail/:service_id', checkUser);
app.put('/services/:service_id', checkUser);

app.post('/jobs', checkUser);
app.get('/jobs/myJob', checkUser);
app.get('/jobs/myJob/detail/:job_id', checkUser);
app.put('/jobs/:job_id', checkUser);

app.get('/offers/:job_id', checkUser)
app.post('/offers/:job_id', checkUser)
app.patch('/offers/:job_id', checkUser)
app.delete('/offers/:job_id', checkUser)
app.get('/offers',checkUser)

app.get('/homepage', routerHomePage);
app.use(routerAuth);
app.use(routerCategories)
app.use(routerSkills)
app.use(routerServices)
app.use(routerJobs)
app.use(routerOffers)


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
