import { prisma } from '../utils/database';
import { AuthUtils, ValidationUtils } from '../utils/helpers';
import { createError } from '../middleware/errorHandler';
import { RegisterInput, LoginInput } from '../schemas';
import { AuditService } from './AuditService';
import { NotificationService } from './NotificationService';

export class AuthService {
  private auditService = new AuditService();
  private notificationService = new NotificationService();

  async register(data: RegisterInput) {
    const { email, username, password, firstName, lastName, role = 'USER' } = data;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { username }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        throw createError('Email already registered', 409);
      }
      if (existingUser.username === username) {
        throw createError('Username already taken', 409);
      }
    }

    // Validate password strength
    if (!ValidationUtils.isStrongPassword(password)) {
      throw createError(
        'Password must contain at least 8 characters, including uppercase, lowercase, number and special character',
        400
      );
    }

    // Hash password
    const hashedPassword = await AuthUtils.hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        username,
        password: hashedPassword,
        firstName,
        lastName,
        role: role as any
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true
      }
    });

    // Create audit log
    await this.auditService.createLog({
      action: 'USER_REGISTERED',
      entityType: 'USER',
      entityId: user.id,
      userId: user.id,
      newValues: { email: user.email, username: user.username, role: user.role }
    });

    // Send welcome notification
    await this.notificationService.createNotification({
      title: 'Welcome to Hospital Inventory System',
      message: 'Your account has been created successfully. You can now access the system.',
      type: 'SUCCESS',
      userId: user.id
    });

    // Generate token
    const token = AuthUtils.generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    return {
      user,
      token,
      message: 'User registered successfully'
    };
  }

  async login(data: LoginInput) {
    const { email, password } = data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user || !user.isActive) {
      throw createError('Invalid credentials', 401);
    }

    // Verify password
    const isValidPassword = await AuthUtils.comparePassword(password, user.password);
    if (!isValidPassword) {
      throw createError('Invalid credentials', 401);
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Create audit log
    await this.auditService.createLog({
      action: 'USER_LOGIN',
      entityType: 'USER',
      entityId: user.id,
      userId: user.id,
      newValues: { lastLogin: new Date() }
    });

    // Generate token
    const token = AuthUtils.generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
      message: 'Login successful'
    };
  }

  async requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      // Don't reveal if email exists for security
      return;
    }

    // Generate reset token (in production, store this in database with expiry)
    const resetToken = AuthUtils.generateToken({
      id: user.id,
      type: 'password_reset'
    });

    // Create audit log
    await this.auditService.createLog({
      action: 'PASSWORD_RESET_REQUESTED',
      entityType: 'USER',
      entityId: user.id,
      userId: user.id,
      newValues: { requestedAt: new Date() }
    });

    // In production, send email with reset link
    console.log(`Password reset token for ${email}: ${resetToken}`);

    return { message: 'Password reset email sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const decoded = AuthUtils.verifyToken(token);
      
      if (decoded.type !== 'password_reset') {
        throw createError('Invalid reset token', 400);
      }

      // Validate new password
      if (!ValidationUtils.isStrongPassword(newPassword)) {
        throw createError(
          'Password must contain at least 8 characters, including uppercase, lowercase, number and special character',
          400
        );
      }

      // Hash new password
      const hashedPassword = await AuthUtils.hashPassword(newPassword);

      // Update user password
      await prisma.user.update({
        where: { id: decoded.id },
        data: { password: hashedPassword }
      });

      // Create audit log
      await this.auditService.createLog({
        action: 'PASSWORD_RESET',
        entityType: 'USER',
        entityId: decoded.id,
        userId: decoded.id,
        newValues: { passwordResetAt: new Date() }
      });

      return { message: 'Password reset successfully' };
    } catch (error) {
      throw createError('Invalid or expired reset token', 400);
    }
  }

  async verifyToken(token: string): Promise<boolean> {
    try {
      const decoded = AuthUtils.verifyToken(token);
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, isActive: true }
      });

      return !!(user && user.isActive);
    } catch (error) {
      return false;
    }
  }
}
