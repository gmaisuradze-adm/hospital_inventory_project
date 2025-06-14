"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcurementService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
class ProcurementService {
    constructor() {
        this.prisma = new client_1.PrismaClient();
    }
    async getProcurementRequests(page = 1, limit = 10, filters = {}, sort = { field: 'createdAt', order: 'desc' }) {
        try {
            const skip = (page - 1) * limit;
            // Build where clause
            const where = {};
            if (filters.status) {
                where.status = filters.status;
            }
            if (filters.priority) {
                where.priority = filters.priority;
            }
            if (filters.category) {
                where.category = filters.category;
            }
            if (filters.department) {
                where.department = filters.department;
            }
            if (filters.budget) {
                where.budget = filters.budget;
            }
            if (filters.requestedBy) {
                where.requestedBy = filters.requestedBy;
            }
            if (filters.search) {
                where.OR = [
                    { title: { contains: filters.search, mode: 'insensitive' } },
                    { description: { contains: filters.search, mode: 'insensitive' } },
                    { department: { contains: filters.search, mode: 'insensitive' } },
                    { vendor: { contains: filters.search, mode: 'insensitive' } },
                ];
            }
            // Get total count
            const totalCount = await this.prisma.procurementRequest.count({ where });
            // Get requests with pagination
            const requests = await this.prisma.procurementRequest.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    [sort.field]: sort.order,
                },
                include: {
                    requestedByUser: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            department: true,
                        },
                    },
                    approvedByUser: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
            });
            const totalPages = Math.ceil(totalCount / limit);
            return {
                data: requests,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCount,
                    hasNextPage: page < totalPages,
                    hasPreviousPage: page > 1,
                },
            };
        }
        catch (error) {
            logger_1.logger.error('Error fetching procurement requests:', error);
            throw new Error('Failed to fetch procurement requests');
        }
    }
    async getProcurementById(id) {
        try {
            const request = await this.prisma.procurementRequest.findUnique({
                where: { id },
                include: {
                    requestedByUser: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            department: true,
                        },
                    },
                    approvedByUser: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
            });
            return request;
        }
        catch (error) {
            logger_1.logger.error('Error fetching procurement request by ID:', error);
            throw new Error('Failed to fetch procurement request');
        }
    }
    async createProcurement(data) {
        try {
            const request = await this.prisma.procurementRequest.create({
                data: {
                    ...data,
                    status: 'DRAFT',
                    deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null,
                },
                include: {
                    requestedByUser: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
            });
            logger_1.logger.info(`Procurement request created: ${request.id}`);
            return request;
        }
        catch (error) {
            logger_1.logger.error('Error creating procurement request:', error);
            throw new Error('Failed to create procurement request');
        }
    }
    async updateProcurement(id, data) {
        try {
            const request = await this.prisma.procurementRequest.update({
                where: { id },
                data: {
                    ...data,
                    deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : undefined,
                    updatedAt: new Date(),
                },
                include: {
                    requestedByUser: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    approvedByUser: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
            });
            logger_1.logger.info(`Procurement request updated: ${request.id}`);
            return request;
        }
        catch (error) {
            logger_1.logger.error('Error updating procurement request:', error);
            throw new Error('Failed to update procurement request');
        }
    }
    async deleteProcurement(id) {
        try {
            await this.prisma.procurementRequest.delete({
                where: { id },
            });
            logger_1.logger.info(`Procurement request deleted: ${id}`);
            return true;
        }
        catch (error) {
            logger_1.logger.error('Error deleting procurement request:', error);
            throw new Error('Failed to delete procurement request');
        }
    }
    async approveProcurement(id, approved, approvedBy, notes) {
        try {
            const status = approved ? 'APPROVED' : 'REJECTED';
            const updateData = {
                status,
                approvedBy,
                approvedAt: new Date(),
                updatedAt: new Date(),
            };
            if (notes) {
                updateData.notes = notes;
            }
            const request = await this.prisma.procurementRequest.update({
                where: { id },
                data: updateData,
                include: {
                    requestedByUser: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    approvedByUser: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
            });
            logger_1.logger.info(`Procurement request ${approved ? 'approved' : 'rejected'}: ${id}`);
            return request;
        }
        catch (error) {
            logger_1.logger.error('Error approving procurement request:', error);
            throw new Error('Failed to approve procurement request');
        }
    }
    async updateProcurementStatus(id, status, additionalData = {}) {
        try {
            const updateData = {
                status,
                updatedAt: new Date(),
                ...additionalData,
            };
            if (status === 'ORDERED' && additionalData.orderNumber) {
                updateData.orderNumber = additionalData.orderNumber;
                updateData.orderedAt = new Date();
            }
            if (status === 'DELIVERED') {
                updateData.deliveredAt = new Date();
            }
            const request = await this.prisma.procurementRequest.update({
                where: { id },
                data: updateData,
                include: {
                    requestedByUser: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    approvedByUser: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
            });
            logger_1.logger.info(`Procurement status updated: ${id} to ${status}`);
            return request;
        }
        catch (error) {
            logger_1.logger.error('Error updating procurement status:', error);
            throw new Error('Failed to update procurement status');
        }
    }
    async getProcurementStats() {
        try {
            const [totalRequests, draftRequests, pendingRequests, approvedRequests, rejectedRequests, orderedRequests, deliveredRequests, totalEstimatedCost, totalActualCost,] = await Promise.all([
                this.prisma.procurementRequest.count(),
                this.prisma.procurementRequest.count({ where: { status: 'DRAFT' } }),
                this.prisma.procurementRequest.count({ where: { status: 'PENDING_APPROVAL' } }),
                this.prisma.procurementRequest.count({ where: { status: 'APPROVED' } }),
                this.prisma.procurementRequest.count({ where: { status: 'REJECTED' } }),
                this.prisma.procurementRequest.count({ where: { status: 'ORDERED' } }),
                this.prisma.procurementRequest.count({ where: { status: 'DELIVERED' } }),
                this.prisma.procurementRequest.aggregate({
                    _sum: { estimatedCost: true },
                }),
                this.prisma.procurementRequest.aggregate({
                    _sum: { actualCost: true },
                    where: { actualCost: { not: null } },
                }),
            ]);
            return {
                total: totalRequests,
                draft: draftRequests,
                pending: pendingRequests,
                approved: approvedRequests,
                rejected: rejectedRequests,
                ordered: orderedRequests,
                delivered: deliveredRequests,
                totalEstimatedCost: totalEstimatedCost._sum.estimatedCost || 0,
                totalActualCost: totalActualCost._sum.actualCost || 0,
            };
        }
        catch (error) {
            logger_1.logger.error('Error fetching procurement stats:', error);
            throw new Error('Failed to fetch procurement statistics');
        }
    }
    async getBudgetSummary(year, quarter) {
        try {
            const currentYear = year || new Date().getFullYear();
            let startDate = new Date(currentYear, 0, 1);
            let endDate = new Date(currentYear, 11, 31);
            if (quarter) {
                const quarterStartMonth = (quarter - 1) * 3;
                startDate = new Date(currentYear, quarterStartMonth, 1);
                endDate = new Date(currentYear, quarterStartMonth + 3, 0);
            }
            const [budgetAllocated, budgetSpent, budgetPending] = await Promise.all([
                this.prisma.procurementRequest.aggregate({
                    _sum: { estimatedCost: true },
                    where: {
                        createdAt: { gte: startDate, lte: endDate },
                        status: { in: ['APPROVED', 'ORDERED', 'DELIVERED'] },
                    },
                }),
                this.prisma.procurementRequest.aggregate({
                    _sum: { actualCost: true },
                    where: {
                        createdAt: { gte: startDate, lte: endDate },
                        status: 'DELIVERED',
                        actualCost: { not: null },
                    },
                }),
                this.prisma.procurementRequest.aggregate({
                    _sum: { estimatedCost: true },
                    where: {
                        createdAt: { gte: startDate, lte: endDate },
                        status: { in: ['PENDING_APPROVAL', 'APPROVED', 'ORDERED'] },
                    },
                }),
            ]);
            return {
                period: quarter ? `Q${quarter} ${currentYear}` : `${currentYear}`,
                allocated: budgetAllocated._sum.estimatedCost || 0,
                spent: budgetSpent._sum.actualCost || 0,
                pending: budgetPending._sum.estimatedCost || 0,
                remaining: (budgetAllocated._sum.estimatedCost || 0) - (budgetSpent._sum.actualCost || 0),
            };
        }
        catch (error) {
            logger_1.logger.error('Error fetching budget summary:', error);
            throw new Error('Failed to fetch budget summary');
        }
    }
    async getProcurementsByCategory() {
        try {
            const result = await this.prisma.procurementRequest.groupBy({
                by: ['category'],
                _count: { category: true },
                _sum: { estimatedCost: true, actualCost: true },
            });
            return result.map((item) => ({
                category: item.category,
                count: item._count.category,
                estimatedCost: item._sum.estimatedCost || 0,
                actualCost: item._sum.actualCost || 0,
            }));
        }
        catch (error) {
            logger_1.logger.error('Error fetching procurements by category:', error);
            throw new Error('Failed to fetch procurements by category');
        }
    }
    async getProcurementsByDepartment() {
        try {
            const result = await this.prisma.procurementRequest.groupBy({
                by: ['department'],
                _count: { department: true },
                _sum: { estimatedCost: true, actualCost: true },
            });
            return result.map((item) => ({
                department: item.department,
                count: item._count.department,
                estimatedCost: item._sum.estimatedCost || 0,
                actualCost: item._sum.actualCost || 0,
            }));
        }
        catch (error) {
            logger_1.logger.error('Error fetching procurements by department:', error);
            throw new Error('Failed to fetch procurements by department');
        }
    }
    async getOverdueProcurements() {
        try {
            const now = new Date();
            const overdueProcurements = await this.prisma.procurementRequest.findMany({
                where: {
                    deliveryDate: { lt: now },
                    status: { in: ['APPROVED', 'ORDERED'] },
                },
                include: {
                    requestedByUser: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
                orderBy: {
                    deliveryDate: 'asc',
                },
            });
            return overdueProcurements;
        }
        catch (error) {
            logger_1.logger.error('Error fetching overdue procurements:', error);
            throw new Error('Failed to fetch overdue procurements');
        }
    }
    async submitForApproval(id) {
        try {
            const request = await this.prisma.procurementRequest.update({
                where: { id },
                data: {
                    status: 'PENDING_APPROVAL',
                    updatedAt: new Date(),
                },
                include: {
                    requestedByUser: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
            });
            logger_1.logger.info(`Procurement request submitted for approval: ${id}`);
            return request;
        }
        catch (error) {
            logger_1.logger.error('Error submitting procurement for approval:', error);
            throw new Error('Failed to submit procurement for approval');
        }
    }
}
exports.ProcurementService = ProcurementService;
//# sourceMappingURL=ProcurementService.js.map