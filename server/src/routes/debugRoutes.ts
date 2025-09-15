import { Router } from 'express';
import { protect, authorizeRoles } from '../middleware/authMiddleware';
import { checkOtpConfig, checkMapsConfig } from '../controllers/debugController';

const router = Router();

// Debug routes (admin only)
router.get('/otp-config', protect, authorizeRoles('admin'), checkOtpConfig);
router.get('/maps-config', protect, authorizeRoles('admin'), checkMapsConfig);

export default router;