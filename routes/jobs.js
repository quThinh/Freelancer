import express from 'express'
import jobs from '../controllers/jobs.js';
var router = express.Router();

/* GET users listing. */
router.post('/jobs', jobs.createNew)
router.get('/jobs', jobs.getAll)
router.get('/jobs/myjob', jobs.getAllCurrentUser)
router.get('/jobs/myjob/detail/:job_id', jobs.getUserJobById)
router.get('/jobs/others/detail/:job_id', jobs.getOtherJobById)
router.put('/jobs/:job_id', jobs.changeById)
router.patch('/jobs/toggle/:job_id', jobs.toggleById)
router.delete('/jobs/:job_id', jobs.deleteById)
router.patch('/jobs/approve/:job_id', jobs.browsingjob)

// router.get('/login', users);

export default router;

