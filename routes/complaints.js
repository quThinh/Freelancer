import express from 'express'
import complaint from '../controllers/complaints.js';
var router = express.Router();

/* GET users listing. */
router.get('/orderComplain', complaint.complaintsInfo)
router.get('/orderComplain/order/:orderId', complaint.orderComplaints)
router.get('/orderComplain/my', complaint.myComplaints)
router.put('/orderComplain/:orderComplainId/resolve', complaint.resolvedComplaint)
router.get('/orderComplain/:orderComplainId/detail', complaint.specificComplaint)

// router.get('/login', users);

export default router;

