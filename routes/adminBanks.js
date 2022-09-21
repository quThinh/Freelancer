import express from 'express'
import adminBanks from '../controllers/adminBanks.js';
var router = express.Router();

router.get('/admin_bank/my', adminBanks.myAdminBankList)
router.post('/admin_bank/create', adminBanks.createAdminBank)
router.delete('/admin_bank/delete/:id', adminBanks.deleteById)
router.get('/admin_bank/all', adminBanks.allAdminBankList)

export default router;

