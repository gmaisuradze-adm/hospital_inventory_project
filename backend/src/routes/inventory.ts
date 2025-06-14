import { Router } from 'express';
import { Response } from 'express';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validateRequest, validateQuery } from '../middleware/validation';
import { 
  createInventoryItemSchema,
  updateInventoryItemSchema
} from '../schemas';
import { InventoryService } from '../services/InventoryService';
import { z } from 'zod';

const router = Router();
const inventoryService = new InventoryService();

// Apply authentication to all routes
router.use(authenticate);

const querySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  location: z.string().optional(),
  search: z.string().optional()
});

/**
 * @route GET /api/inventory
 * @desc Get all inventory items with filtering and pagination
 * @access Private
 */
router.get('/',
  validateQuery(querySchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const filters = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 50,
      category: req.query.category as string,
      status: req.query.status as string,
      location: req.query.location as string,
      search: req.query.search as string
    };

    const result = await inventoryService.getItems(filters);
    res.json(result);
  })
);

/**
 * @route POST /api/inventory
 * @desc Create a new inventory item
 * @access Private (Manager, Admin)
 */
router.post('/',
  authorize(['MANAGER', 'ADMIN']),
  validateRequest(createInventoryItemSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const item = await inventoryService.createItem(req.body, req.user!.id);
    res.status(201).json(item);
  })
);

/**
 * @route GET /api/inventory/:id
 * @desc Get inventory item by ID
 * @access Private
 */
router.get('/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const item = await inventoryService.getItemById(req.params.id);
    res.json(item);
  })
);

/**
 * @route PUT /api/inventory/:id
 * @desc Update inventory item
 * @access Private (Manager, Admin)
 */
router.put('/:id',
  authorize(['MANAGER', 'ADMIN']),
  validateRequest(updateInventoryItemSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const item = await inventoryService.updateItem(req.params.id, req.body, req.user!.id);
    res.json(item);
  })
);

/**
 * @route DELETE /api/inventory/:id
 * @desc Delete inventory item
 * @access Private (Admin)
 */
router.delete('/:id',
  authorize(['ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await inventoryService.deleteItem(req.params.id, req.user!.id);
    res.json(result);
  })
);

/**
 * @route GET /api/inventory/stats/categories
 * @desc Get inventory statistics by category
 * @access Private
 */
router.get('/stats/categories',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const stats = await inventoryService.getItemsByCategory();
    res.json(stats);
  })
);

/**
 * @route GET /api/inventory/stats/status
 * @desc Get inventory statistics by status
 * @access Private
 */
router.get('/stats/status',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const stats = await inventoryService.getItemsByStatus();
    res.json(stats);
  })
);

/**
 * @route GET /api/inventory/stats/value
 * @desc Get total inventory value
 * @access Private (Manager, Admin)
 */
router.get('/stats/value',
  authorize(['MANAGER', 'ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const value = await inventoryService.getInventoryValue();
    res.json(value);
  })
);

/**
 * @route GET /api/inventory/low-stock
 * @desc Get low stock items
 * @access Private (Manager, Admin)
 */
router.get('/low-stock',
  authorize(['MANAGER', 'ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const threshold = parseInt(req.query.threshold as string);
    const items = await inventoryService.getLowStockItems(threshold);
    res.json(items);
  })
);

/**
 * @route GET /api/inventory/search
 * @desc Search inventory items
 * @access Private
 */
router.get('/search',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const query = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 10;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const items = await inventoryService.searchItems(query, limit);
    res.json(items);
  })
);

/**
 * @route PATCH /api/inventory/bulk-status
 * @desc Bulk update item status
 * @access Private (Manager, Admin)
 */
router.patch('/bulk-status',
  authorize(['MANAGER', 'ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { itemIds, status } = req.body;
    
    if (!itemIds || !Array.isArray(itemIds) || !status) {
      return res.status(400).json({ message: 'Item IDs and status are required' });
    }

    const result = await inventoryService.bulkUpdateStatus(itemIds, status, req.user!.id);
    res.json(result);
  })
);

export { router as inventoryRoutes };
