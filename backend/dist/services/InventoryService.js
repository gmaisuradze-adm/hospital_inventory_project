"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryService = void 0;
const database_1 = require("../utils/database");
const errorHandler_1 = require("../middleware/errorHandler");
const AuditService_1 = require("./AuditService");
const NotificationService_1 = require("./NotificationService");
class InventoryService {
    constructor() {
        this.auditService = new AuditService_1.AuditService();
        this.notificationService = new NotificationService_1.NotificationService();
    }
    async createItem(data, userId) {
        // Check if serial number already exists
        if (data.serialNumber) {
            const existingItem = await database_1.prisma.inventoryItem.findUnique({
                where: { serialNumber: data.serialNumber }
            });
            if (existingItem) {
                throw (0, errorHandler_1.createError)('Serial number already exists', 409);
            }
        }
        const item = await database_1.prisma.inventoryItem.create({
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
    async getItems(filters) {
        const { category, status, location, search, page = 1, limit = 50 } = filters;
        const where = {};
        if (category)
            where.category = category;
        if (status)
            where.status = status;
        if (location)
            where.location = { contains: location };
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
            database_1.prisma.inventoryItem.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit
            }),
            database_1.prisma.inventoryItem.count({ where })
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
    async getItemById(id) {
        const item = await database_1.prisma.inventoryItem.findUnique({
            where: { id }
        });
        if (!item) {
            throw (0, errorHandler_1.createError)('Item not found', 404);
        }
        return item;
    }
    async updateItem(id, data, userId) {
        const existingItem = await this.getItemById(id);
        // Check serial number uniqueness if updating
        if (data.serialNumber && data.serialNumber !== existingItem.serialNumber) {
            const duplicate = await database_1.prisma.inventoryItem.findUnique({
                where: { serialNumber: data.serialNumber }
            });
            if (duplicate) {
                throw (0, errorHandler_1.createError)('Serial number already exists', 409);
            }
        }
        const updatedItem = await database_1.prisma.inventoryItem.update({
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
            await this.notificationService.notifyInventoryLowStock(updatedItem.id, updatedItem.name, updatedItem.quantity, updatedItem.minQuantity || 0);
        }
        return updatedItem;
    }
    async deleteItem(id, userId) {
        const existingItem = await this.getItemById(id);
        // Check if item is referenced in procurement requests
        const procurementRequests = await database_1.prisma.procurementRequest.findMany({
            where: {
                OR: [
                    { itemName: existingItem.name },
                    { description: { contains: existingItem.name } }
                ]
            }
        });
        if (procurementRequests.length > 0) {
            throw (0, errorHandler_1.createError)('Cannot delete item that has associated procurement requests', 400);
        }
        await database_1.prisma.inventoryItem.delete({
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
    async getLowStockItems(threshold) {
        // For SQLite, we need to fetch all items and filter in JavaScript
        // since it doesn't support comparing fields directly
        const allItems = await database_1.prisma.inventoryItem.findMany({
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
        const categories = await database_1.prisma.inventoryItem.groupBy({
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
        const statuses = await database_1.prisma.inventoryItem.groupBy({
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
        const result = await database_1.prisma.inventoryItem.aggregate({
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
    async searchItems(query, limit = 10) {
        const items = await database_1.prisma.inventoryItem.findMany({
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
    async bulkUpdateStatus(itemIds, status, userId) {
        const items = await database_1.prisma.inventoryItem.findMany({
            where: { id: { in: itemIds } }
        });
        await database_1.prisma.inventoryItem.updateMany({
            where: { id: { in: itemIds } },
            data: { status: status }
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
            database_1.prisma.inventoryItem.count(),
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
exports.InventoryService = InventoryService;
//# sourceMappingURL=InventoryService.js.map