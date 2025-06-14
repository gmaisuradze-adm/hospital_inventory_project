"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ITRequestService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
class ITRequestService {
    constructor() {
        this.prisma = new client_1.PrismaClient();
    }
    async getITRequests(page = 1, limit = 10, filters = {}, sort = { field: 'createdAt', order: 'desc' }) {
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
            if (filters.assignedTo) {
                where.assignedTo = filters.assignedTo;
            }
            if (filters.requestedBy) {
                where.requestedBy = filters.requestedBy;
            }
            if (filters.search) {
                where.OR = [
                    { title: { contains: filters.search, mode: 'insensitive' } },
                    { description: { contains: filters.search, mode: 'insensitive' } },
                    { department: { contains: filters.search, mode: 'insensitive' } },
                ];
            }
            // Get total count
            const totalCount = await this.prisma.iTRequest.count({ where });
            // Get requests with pagination
            const requests = await this.prisma.iTRequest.findMany({
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
                        },
                    },
                    assignedToUser: {
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
            logger_1.logger.error('Error fetching IT requests:', error);
            throw new Error('Failed to fetch IT requests');
        }
    }
    async getITRequestById(id) {
        try {
            const request = await this.prisma.iTRequest.findUnique({
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
                    assignedToUser: {
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
            logger_1.logger.error('Error fetching IT request by ID:', error);
            throw new Error('Failed to fetch IT request');
        }
    }
    async createITRequest(data) {
        try {
            const request = await this.prisma.iTRequest.create({
                data: {
                    ...data,
                    status: 'PENDING',
                    requestedDate: data.requestedDate ? new Date(data.requestedDate) : new Date(),
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
            logger_1.logger.info(`IT request created: ${request.id}`);
            return request;
        }
        catch (error) {
            logger_1.logger.error('Error creating IT request:', error);
            throw new Error('Failed to create IT request');
        }
    }
    async updateITRequest(id, data) {
        try {
            const request = await this.prisma.iTRequest.update({
                where: { id },
                data: {
                    ...data,
                    requestedDate: data.requestedDate ? new Date(data.requestedDate) : undefined,
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
                    assignedToUser: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
            });
            logger_1.logger.info(`IT request updated: ${request.id}`);
            return request;
        }
        catch (error) {
            logger_1.logger.error('Error updating IT request:', error);
            throw new Error('Failed to update IT request');
        }
    }
    async deleteITRequest(id) {
        try {
            await this.prisma.iTRequest.delete({
                where: { id },
            });
            logger_1.logger.info(`IT request deleted: ${id}`);
            return true;
        }
        catch (error) {
            logger_1.logger.error('Error deleting IT request:', error);
            throw new Error('Failed to delete IT request');
        }
    }
    async assignITRequest(id, assignedTo, notes) {
        try {
            const request = await this.prisma.iTRequest.update({
                where: { id },
                data: {
                    assignedTo,
                    status: 'IN_PROGRESS',
                    notes: notes || undefined,
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
                    assignedToUser: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
            });
            logger_1.logger.info(`IT request assigned: ${id} to ${assignedTo}`);
            return request;
        }
        catch (error) {
            logger_1.logger.error('Error assigning IT request:', error);
            throw new Error('Failed to assign IT request');
        }
    }
    async updateITRequestStatus(id, status, notes, actualCost) {
        try {
            const updateData = {
                status,
                updatedAt: new Date(),
            };
            if (notes) {
                updateData.notes = notes;
            }
            if (actualCost !== undefined) {
                updateData.actualCost = actualCost;
            }
            if (status === 'COMPLETED') {
                updateData.completedAt = new Date();
            }
            const request = await this.prisma.iTRequest.update({
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
                    assignedToUser: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
            });
            logger_1.logger.info(`IT request status updated: ${id} to ${status}`);
            return request;
        }
        catch (error) {
            logger_1.logger.error('Error updating IT request status:', error);
            throw new Error('Failed to update IT request status');
        }
    }
    async getITRequestStats() {
        try {
            const [totalRequests, pendingRequests, approvedRequests, inProgressRequests, completedRequests, urgentRequests,] = await Promise.all([
                this.prisma.iTRequest.count(),
                this.prisma.iTRequest.count({ where: { status: 'PENDING' } }),
                this.prisma.iTRequest.count({ where: { status: 'APPROVED' } }),
                this.prisma.iTRequest.count({ where: { status: 'IN_PROGRESS' } }),
                this.prisma.iTRequest.count({ where: { status: 'COMPLETED' } }),
                this.prisma.iTRequest.count({ where: { priority: 'URGENT' } }),
            ]);
            return {
                total: totalRequests,
                pending: pendingRequests,
                approved: approvedRequests,
                inProgress: inProgressRequests,
                completed: completedRequests,
                urgent: urgentRequests,
            };
        }
        catch (error) {
            logger_1.logger.error('Error fetching IT request stats:', error);
            throw new Error('Failed to fetch IT request statistics');
        }
    }
    async getRequestsByCategory() {
        try {
            const result = await this.prisma.iTRequest.groupBy({
                by: ['category'],
                _count: {
                    category: true,
                },
            });
            return result.map((item) => ({
                category: item.category,
                count: item._count.category,
            }));
        }
        catch (error) {
            logger_1.logger.error('Error fetching requests by category:', error);
            throw new Error('Failed to fetch requests by category');
        }
    }
    async getRequestsByDepartment() {
        try {
            const result = await this.prisma.iTRequest.groupBy({
                by: ['department'],
                _count: {
                    department: true,
                },
            });
            return result.map((item) => ({
                department: item.department,
                count: item._count.department,
            }));
        }
        catch (error) {
            logger_1.logger.error('Error fetching requests by department:', error);
            throw new Error('Failed to fetch requests by department');
        }
    }
    async getOverdueRequests() {
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const overdueRequests = await this.prisma.iTRequest.findMany({
                where: {
                    status: {
                        in: ['PENDING', 'APPROVED', 'IN_PROGRESS'],
                    },
                    createdAt: {
                        lt: thirtyDaysAgo,
                    },
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
                    assignedToUser: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'asc',
                },
            });
            return overdueRequests;
        }
        catch (error) {
            logger_1.logger.error('Error fetching overdue requests:', error);
            throw new Error('Failed to fetch overdue requests');
        }
    }
}
exports.ITRequestService = ITRequestService;
//# sourceMappingURL=ITRequestService.js.map