import express from 'express'
import wallets from '../controllers/wallets.js';
var router = express.Router();

router.get('/wallet/my', wallets.myWallet)
router.get('/wallet/:user_id', wallets.getSpecificUserWallet)
router.get('/wallet', wallets.getUsersWallet)
router.patch('/wallet/deposit', wallets.depositMoney)
// router.patch('/wallet/withdraw', wallets.withdrawMoney)
// router.post('/wallet/lock/:user_id', wallets.lockWallet)
// router.post('/wallet/unlock/{user_id}', wallets.unlockWallet)

export default router;

