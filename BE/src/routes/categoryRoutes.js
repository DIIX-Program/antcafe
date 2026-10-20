import { Router } from 'express';
import { getCategories } from '../controllers/catalogController.js';

const router = Router();

router.get('/', getCategories);

export default router;
