import express from 'express'
import transactions from '../controllers/transactions.js';
var router = express.Router();

router.get('/transaction/external', transactions.external)
router.get('/transaction/internal', transactions.internal)
router.get('/transaction', transactions.adminGetList)
router.get('/transaction/deposits', transactions.adminDepositHistory)
router.get('/transaction/:transaction_id', transactions.specificTransaction)
router.get('/transaction/order/:order_id', transactions.orderTransaction)
router.post('/transaction/accept/:transaction_id', transactions.acceptTransaction)
router.post('/transaction/accept_withdraw/:transaction_id', transactions.acceptWithdraw)
router.post('/transaction/accept_deposit/:transaction_id', transactions.acceptDeposit)

export default router;

