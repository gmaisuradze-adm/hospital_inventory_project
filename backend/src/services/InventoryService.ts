import { prisma } from '../utils/database';
import { CreateInventoryItemInput, UpdateInventoryItemInput } from '../schemas';
import { createError } from '../middleware/errorHandler';
import { AuditService } from './AuditService';
import { NotificationService } from './NotificationService';

export class InventoryService {
  private auditService = new AuditService();
  private notificationService = new NotificationService();

  async createItem(data: CreateInventoryItemInput, userId: string) {
    // Check if serial number already exists
    if (data.serialNumber) {
      const existingItem = await prisma.inventoryItem.findUnique({
        where: { serialNumber: data.serialNumber }
      });

      if (existingItem) {
        throw createError('Serial number already exists', 409);
      }
    }

    const item = await prisma.inventoryItem.create({
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        location: data.location,
        serialNumber: data.serialNumber,
        model: data.model,
        manufacturer: data.manufacturer,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
        warrantyExpiry: data.warrantyExpiry ? new Date(data.warrantyExpiry) : null,
        cost: data.cost,
        quantity: data.quantity,
        minQuantity: data.minQuantity
      }
    });

    // Create audit log
    await this.auditService.createLog({
      action: 'INVENTORY_ITEM_CREATED',
      entityType: 'INVENTORY_ITEM',
      entityId: item.id,
      userId,
      newValues: item
    });

    return item;
  }

  async getItems(filters: {
    category?: string;
    status?: string;
    location?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      category,
      status,
      location,
      search,
      page = 1,
      limit = 50
    } = filters;

    const where: any = {};

    if (category) where.category = category;
    if (status) where.status = status;
    if (location) where.location = { contains: location };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { model: { contains: search } },
        { manufacturer: { contains: search } },
        { serialNumber: { contains: search } }
      ];
    }

    const [items, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.inventoryItem.count({ where })
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getItemById(id: string) {
    const item = await prisma.inventoryItem.findUnique({
      where: { id }
    });

    if (!item) {
      throw createError('Item not found', 404);
    }

    return item;
  }

  async updateItem(id: string, data: UpdateInventoryItemInput, userId: string) {
    const existingItem = await this.getItemById(id);

    // Check serial number uniqueness if updating
    if (data.serialNumber && data.serialNumber !== existingItem.serialNumber) {
      const duplicate = await prisma.inventoryItem.findUnique({
        where: { serialNumber: data.serialNumber }
      });

      if (duplicate) {
        throw createError('Serial number already exists', 409);
      }
    }

    const updatedItem = await prisma.inventoryItem.update({
      where: { id },
      data: {
        ...data,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
        warrantyExpiry: data.warrantyExpiry ? new Date(data.warrantyExpiry) : undefined
      }
    });

    // Create audit log
    await this.auditService.createLog({
      action: 'INVENTORY_ITEM_UPDATED',
      entityType: 'INVENTORY_ITEM',
      entityId: id,
      userId,
      oldValues: existingItem,
      newValues: updatedItem
    });

    // Check for low stock notification
    if (updatedItem.quantity <= (updatedItem.minQuantity || 0)) {
      await this.notificationService.notifyInventoryLowStock(
        updatedItem.id,
        updatedItem.name,
        updatedItem.quantity,
        updatedItem.minQuantity || 0
      );
    }

    return updatedItem;
  }

  async deleteItem(id: string, userId: string) {
    const existingItem = await this.getItemById(id);

    // Check if item is referenced in procurement requests
    const procurementRequests = await prisma.procurementRequest.findMany({
      where: { 
        OR: [
          { itemName: existingItem.name },
          { description: { contains: existingItem.name } }
        ]
      }
    });

    if (procurementRequests.length > 0) {
      throw createError('Cannot delete item that has associated procurement requests', 400);
    }

    await prisma.inventoryItem.delete({
      where: { id }
    });

    // Create audit log
    await this.auditService.createLog({
      action: 'INVENTORY_ITEM_DELETED',
      entityType: 'INVENTORY_ITEM',
      entityId: id,
      userId,
      oldValues: existingItem
    });

    return { message: 'Item deleted successfully' };
  }

  async getLowStockItems(threshold?: number) {
    // For SQLite, we need to fetch all items and filter in JavaScript
    // since it doesn't support comparing fields directly
    const allItems = await prisma.inventoryItem.findMany({
      where: {
        AND: [
          { minQuantity: { not: null } },
          { quantity: { not: null } }
        ]
      }
    });

    const lowStockItems = allItems.filter(item => {
      const minQty = item.minQuantity || 0;
      const currentQty = item.quantity || 0;
      
      if (threshold) {
        return currentQty <= threshold || currentQty <= minQty;
      }
      
      return currentQty <= minQty;
    });

    return lowStockItems.sort((a, b) => (a.quantity || 0) - (b.quantity || 0));
  }

  async getItemsByCategory() {
    const categories = await prisma.inventoryItem.groupBy({
      by: ['category'],
      _count: {
        id: true
      },
      _sum: {
        quantity: true,
        cost: true
      }
    });

    return categories.map(category => ({
      category: category.category,
      itemCount: category._count.id,
      totalQuantity: category._sum.quantity || 0,
      totalCost: category._sum.cost || 0
    }));
  }

  async getItemsByStatus() {
    const statuses = await prisma.inventoryItem.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });

    return statuses.map(status => ({
      status: status.status,
      count: status._count.id
    }));
  }

  async getInventoryValue() {
    const result = await prisma.inventoryItem.aggregate({
      _sum: {
        cost: true
      },
      _count: {
        id: true
      }
    });

    return {
      totalValue: result._sum.cost || 0,
      totalItems: result._count.id
    };
  }

  async searchItems(query: string, limit: number = 10) {
    const items = await prisma.inventoryItem.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { description: { contains: query } },
          { model: { contains: query } },
          { manufacturer: { contains: query } },
          { serialNumber: { contains: query } }
        ]
      },
      take: limit,
      orderBy: { name: 'asc' }
    });

    return items;
  }

  async bulkUpdateStatus(itemIds: string[], status: string, userId: string) {
    const items = await prisma.inventoryItem.findMany({
      where: { id: { in: itemIds } }
    });

    await prisma.inventoryItem.updateMany({
      where: { id: { in: itemIds } },
      data: { status: status as any }
    });

    // Create audit logs for each item
    for (const item of items) {
      await this.auditService.createLog({
        action: 'INVENTORY_ITEM_STATUS_UPDATED',
        entityType: 'INVENTORY_ITEM',
        entityId: item.id,
        userId,
        oldValues: { status: item.status },
        newValues: { status }
      });
    }

    return { message: `${items.length} items updated successfully` };
  }

  async getInventoryStats() {
    const [totalItems, totalValue, lowStockCount, statusBreakdown] = await Promise.all([
      prisma.inventoryItem.count(),
      this.getInventoryValue(),
      this.getLowStockItems().then(items => items.length),
      this.getItemsByStatus()
    ]);

    return {
      totalItems,
      totalValue: totalValue.totalValue,
      lowStockCount,
      statusBreakdown
    };
  }
}
