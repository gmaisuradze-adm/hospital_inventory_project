import { Router } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { validateRequest } from '../middleware/validation';
import { registerSchema, loginSchema } from '../schemas';
import { AuthService } from '../services/AuthService';

const router = Router();
const authService = new AuthService();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', 
  validateRequest(registerSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  })
);

/**
 * @route POST /api/auth/login
 * @desc Login user
 * @access Public
 */
router.post('/login',
  validateRequest(loginSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await authService.login(req.body);
    res.json(result);
  })
);

/**
 * @route POST /api/auth/logout
 * @desc Logout user
 * @access Private
 */
router.post('/logout',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // In a JWT implementation, logout is typically handled client-side
    // Here we could add token to a blacklist if needed
    res.json({ message: 'Logged out successfully' });
  })
);

/**
 * @route POST /api/auth/forgot-password
 * @desc Request password reset
 * @access Public
 */
router.post('/forgot-password',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { email } = req.body;
    await authService.requestPasswordReset(email);
    res.json({ message: 'Password reset email sent if account exists' });
  })
);

/**
 * @route POST /api/auth/reset-password
 * @desc Reset password
 * @access Public
 */
router.post('/reset-password',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { token, password } = req.body;
    await authService.resetPassword(token, password);
    res.json({ message: 'Password reset successfully' });
  })
);

/**
 * @route GET /api/auth/verify-token
 * @desc Verify JWT token
 * @access Public
 */
router.get('/verify-token',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(400).json({ message: 'No token provided' });
    }

    const isValid = await authService.verifyToken(token);
    res.json({ valid: isValid });
  })
);

export { router as authRoutes };
