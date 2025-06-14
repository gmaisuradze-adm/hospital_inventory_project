import { Router } from 'express';
import { Response } from 'express';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validateRequest, validateQuery } from '../middleware/validation';
import { updateUserSchema } from '../schemas';
import { UserService } from '../services/UserService';
import { z } from 'zod';

const router = Router();
const userService = new UserService();

// Apply authentication to all routes
router.use(authenticate);

const querySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  role: z.string().optional(),
  search: z.string().optional(),
  isActive: z.string().optional()
});

/**
 * @route GET /api/users
 * @desc Get all users with filtering and pagination
 * @access Private (Manager, Admin)
 */
router.get('/',
  authorize(['MANAGER', 'ADMIN']),
  validateQuery(querySchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const filters = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 50,
      role: req.query.role as string,
      search: req.query.search as string,
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined
    };

    const result = await userService.getUsers(filters);
    res.json(result);
  })
);

/**
 * @route GET /api/users/profile
 * @desc Get current user profile
 * @access Private
 */
router.get('/profile',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await userService.getUserById(req.user!.id);
    res.json(user);
  })
);

/**
 * @route PUT /api/users/profile
 * @desc Update current user profile
 * @access Private
 */
router.put('/profile',
  validateRequest(updateUserSchema.omit({ role: true, isActive: true })),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await userService.updateUser(req.user!.id, req.body, req.user!.id);
    res.json(user);
  })
);

/**
 * @route GET /api/users/:id
 * @desc Get user by ID
 * @access Private (Manager, Admin)
 */
router.get('/:id',
  authorize(['MANAGER', 'ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await userService.getUserById(req.params.id);
    res.json(user);
  })
);

/**
 * @route PUT /api/users/:id
 * @desc Update user
 * @access Private (Admin)
 */
router.put('/:id',
  authorize(['ADMIN']),
  validateRequest(updateUserSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await userService.updateUser(req.params.id, req.body, req.user!.id);
    res.json(user);
  })
);

/**
 * @route DELETE /api/users/:id
 * @desc Deactivate user
 * @access Private (Admin)
 */
router.delete('/:id',
  authorize(['ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await userService.deactivateUser(req.params.id, req.user!.id);
    res.json(result);
  })
);

/**
 * @route POST /api/users/:id/activate
 * @desc Activate user
 * @access Private (Admin)
 */
router.post('/:id/activate',
  authorize(['ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await userService.activateUser(req.params.id, req.user!.id);
    res.json(result);
  })
);

/**
 * @route GET /api/users/stats/roles
 * @desc Get user statistics by role
 * @access Private (Manager, Admin)
 */
router.get('/stats/roles',
  authorize(['MANAGER', 'ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const stats = await userService.getUsersByRole();
    res.json(stats);
  })
);

/**
 * @route POST /api/users/:id/reset-password
 * @desc Reset user password
 * @access Private (Admin)
 */
router.post('/:id/reset-password',
  authorize(['ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await userService.resetUserPassword(req.params.id, req.user!.id);
    res.json(result);
  })
);

export { router as userRoutes };
