import express from 'express'
import offers from '../controllers/offers.js';
var router = express.Router();

/* GET users listing. */
router.get('/offers/:job_id', offers.getAllCurrentJob)
router.post('/offers/:job_id', offers.createNew)

//will do later
// router.patch('/offers/:job_id', offers.changeById)
// router.delete('/offers/:job_id', offers.deleteById)
// router.get('/offers', offers.getAllUserOffer)


export default router;

