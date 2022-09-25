import express from 'express'
import users from '../controllers/user.js';
var router = express.Router();

router.get('/users', users.accountInfo)
router.patch('/users/change/password', users.password)
router.put('/users/change/profile', users.profile)
router.post('/users/verify/:active_token', users.verify)
// router.get('/users/forgot-password', users.resetPassword)
// router.post('/users/forgot-password/verify/:active_token', users.checkActiveToken)
// router.post('/users/forgot-password/verify/updatePassword', users.updatePassword)
router.post('/users/createCrmUser', users.adminAccount)

export default router;

