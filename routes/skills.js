import express from 'express'
import skills from '../controllers/skills.js';
var router = express.Router();

router.get('/skills', skills.getAll)

export default router;

