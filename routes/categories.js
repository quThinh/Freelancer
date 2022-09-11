import express from 'express'
import categories from '../controllers/categories.js';
var router = express.Router();

/* GET users listing. */
router.get('/categories', categories.getAll)
router.post('/categories', categories.createNew)
router.get('/categories/:category_id', categories.getById)
router.put('/categories/:category_id', categories.changeById)
router.delete('/categories/:category_id', categories.deleteById)

// router.get('/login', users);

export default router;

