import express from 'express'
import services from '../controllers/services.js';
var router = express.Router();

/* GET users listing. */
router.post('/services', services.createNew)
router.get('/services', services.getAll)
router.get('/services/myService', services.getAllCurrentUser)
router.get('/services/myService/detail/:service_id', services.getUserServiceById)
router.get('/services/others/detail/:service_id', services.getOtherServiceById)
router.put('/services/:service_id', services.changeById)
router.patch('/services/toggle/:service_id', services.toggleById)
router.delete('/services/:service_id', services.deleteById)
router.patch('/services/approve/:service_id', services.browsingService)

// router.get('/login', users);

export default router;

