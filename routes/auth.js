import express from 'express'
import auth from '../controllers/auth.js'
var router = express.Router();

router.post('/auth/login', auth.logIn);
// router.post('/auth/logout', auth.logOut);

//register
router.post('/user', auth.register);

export default router;

