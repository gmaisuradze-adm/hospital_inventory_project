import { prisma } from '../utils/database';
import { UpdateUserInput } from '../schemas';
import { createError } from '../middleware/errorHandler';
import { AuditService } from './AuditService';
import { NotificationService } from './NotificationService';
import { AuthUtils } from '../utils/helpers';

export class UserService {
  private auditService = new AuditService();
  private notificationService = new NotificationService();

  async getUsers(filters: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
    isActive?: boolean;
  }) {
    const {
      page = 1,
      limit = 50,
      role,
      search,
      isActive
    } = filters;

    const where: any = {};

    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive;

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLogin: true
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.user.count({ where })
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLogin: true
      }
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    return user;
  }

  async updateUser(id: string, data: UpdateUserInput, updatedBy: string) {
    const existingUser = await this.getUserById(id);

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });

    // Create audit log
    await this.auditService.createLog({
      action: 'USER_UPDATED',
      entityType: 'USER',
      entityId: id,
      userId: updatedBy,
      oldValues: existingUser,
      newValues: updatedUser
    });

    // Send notification if role changed
    if (data.role && data.role !== existingUser.role) {
      await this.notificationService.createNotification({
        title: 'Role Updated',
        message: `Your role has been updated to: ${data.role}`,
        type: 'INFO',
        userId: id
      });
    }

    return updatedUser;
  }

  async deactivateUser(id: string, deactivatedBy: string) {
    const existingUser = await this.getUserById(id);

    if (!existingUser.isActive) {
      throw createError('User is already inactive', 400);
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: false }
    });

    // Create audit log
    await this.auditService.createLog({
      action: 'USER_DEACTIVATED',
      entityType: 'USER',
      entityId: id,
      userId: deactivatedBy,
      oldValues: { isActive: true },
      newValues: { isActive: false }
    });

    // Send notification
    await this.notificationService.createNotification({
      title: 'Account Deactivated',
      message: 'Your account has been deactivated. Please contact your administrator.',
      type: 'WARNING',
      userId: id
    });

    return { message: 'User deactivated successfully' };
  }

  async activateUser(id: string, activatedBy: string) {
    const existingUser = await this.getUserById(id);

    if (existingUser.isActive) {
      throw createError('User is already active', 400);
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: true }
    });

    // Create audit log
    await this.auditService.createLog({
      action: 'USER_ACTIVATED',
      entityType: 'USER',
      entityId: id,
      userId: activatedBy,
      oldValues: { isActive: false },
      newValues: { isActive: true }
    });

    // Send notification
    await this.notificationService.createNotification({
      title: 'Account Activated',
      message: 'Your account has been activated. You can now access the system.',
      type: 'SUCCESS',
      userId: id
    });

    return { message: 'User activated successfully' };
  }

  async getUsersByRole() {
    const roles = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        id: true
      },
      where: {
        isActive: true
      }
    });

    return roles.map(role => ({
      role: role.role,
      count: role._count.id
    }));
  }

  async resetUserPassword(id: string, resetBy: string) {
    const user = await this.getUserById(id);

    // Generate a new temporary password
    const temporaryPassword = AuthUtils.generateRandomPassword(12);
    const hashedPassword = await AuthUtils.hashPassword(temporaryPassword);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    });

    // Create audit log
    await this.auditService.createLog({
      action: 'PASSWORD_RESET_BY_ADMIN',
      entityType: 'USER',
      entityId: id,
      userId: resetBy,
      newValues: { passwordResetBy: resetBy, resetAt: new Date() }
    });

    // Send notification with temporary password
    await this.notificationService.createNotification({
      title: 'Password Reset',
      message: `Your password has been reset. Temporary password: ${temporaryPassword}. Please change it immediately after login.`,
      type: 'WARNING',
      userId: id
    });

    return { 
      message: 'Password reset successfully',
      temporaryPassword // In production, this should be sent via secure channel
    };
  }

  async searchUsers(query: string, limit: number = 10) {
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        OR: [
          { email: { contains: query } },
          { username: { contains: query } },
          { firstName: { contains: query } },
          { lastName: { contains: query } }
        ]
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true
      },
      take: limit,
      orderBy: { username: 'asc' }
    });

    return users;
  }

  async getUserStats() {
    const [totalUsers, activeUsers, usersByRole] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.groupBy({
        by: ['role'],
        _count: {
          id: true
        }
      })
    ]);

    return {
      totalUsers,
      activeUsers,
      usersByRole: usersByRole.map(item => ({
        role: item.role,
        count: item._count.id
      }))
    };
  }
}
