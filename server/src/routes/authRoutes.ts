import { Router } from 'express';
import { login, register } from '../controllers/authController';
import { validateLogin, validateRegister } from '../middleware/validator';

const router = Router();

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

export default router;
