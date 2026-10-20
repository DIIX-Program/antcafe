import { Router } from 'express';
import { 
  getProducts, 
  getProductById, 
  toggleProductAvailability,
  getOptionGroups 
} from '../controllers/catalogController.js';
import { optionalAuth } from '../middlewares/auth.js';

const router = Router();

// Options structure for customizing drinks
router.get('/options/groups', getOptionGroups);

// Products catalog
router.get('/', getProducts);
router.get('/:id', getProductById);
router.patch('/:id/availability', optionalAuth, toggleProductAvailability);

export default router;
