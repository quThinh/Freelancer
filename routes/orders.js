import express from 'express'
import orders from '../controllers/orders.js';
var router = express.Router();

router.get('/order', orders.getAllOrder)
router.post('/order/acceptOffer/:job_offer_id', orders.acceptOffer)
router.post('/order/cancel/:order_id', orders.cancelOrder)
router.post('/order/conplete/:order_id', orders.completeOrder)
router.post('/order/complain/:order_id', orders.complainOrder)
router.get('/order/all', orders.getAllOrderAdmin)
router.get('/order/:order_id', orders.getSpecificOrder)
router.post('/order/confirm/:order_id', orders.confirmOrder)
// router.post('/order/complete/:order_id', offers.getAllOrder)
router.post('/order/request/:service_id', orders.requestService)
router.post('/order/finishMentor/:order_id', orders.finishMentor)

//will do later
// router.patch('/offers/:job_id', offers.changeById)
// router.delete('/offers/:job_id', offers.deleteById)
// router.get('/offers', offers.getAllUserOffer)


export default router;

