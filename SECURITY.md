# Security Implementation Guide

## Overview
This document outlines the security measures implemented in the Hospital Inventory Management System.

## Implemented Security Features

### 1. Authentication & Authorization
- **Strong Password Policy**: Minimum 12 characters with complexity requirements
- **Rate Limiting**: Login attempts limited to 5 per minute per IP
- **Session Security**: 1-hour session timeout with secure cookies
- **CSRF Protection**: All forms protected against Cross-Site Request Forgery

### 2. Database Security
- **Environment Variables**: All sensitive data stored in .env file
- **Database Credentials**: Secure random passwords
- **Connection Security**: SSL connections for production databases

### 3. Security Headers
- **HTTPS Enforcement**: Automatic redirect to HTTPS in production
- **HSTS**: HTTP Strict Transport Security enabled
- **Content Security Policy**: Prevents XSS attacks
- **X-Frame-Options**: Prevents clickjacking (set to DENY)
- **X-Content-Type-Options**: Prevents MIME type sniffing

### 4. Static Files & Media
- **WhiteNoise**: Secure static file serving
- **Media Upload Validation**: File type and size restrictions
- **Static File Compression**: Reduced attack surface

### 5. Logging & Monitoring
- **Security Logging**: All security events logged to separate file
- **Failed Login Tracking**: IP-based tracking of failed attempts
- **Suspicious Activity Detection**: 404 errors on suspicious paths logged
- **Rate Limit Violations**: All rate limit exceeded events logged

### 6. Custom Security Middleware
- **SecurityLoggingMiddleware**: Logs authentication and authorization events
- **RateLimitExceededMiddleware**: Custom handling for rate limit violations

## Configuration Files

### Environment Variables (.env)
```env
# Security Configuration
SECRET_KEY=django-insecure-hm9x$k8n#v2@w!7q$z&e*r5t^y6u8i0o-p3a4s5d6f7g8h9j
DEBUG=False
ALLOWED_HOSTS=127.0.0.1,localhost,your-domain.com

# Database Configuration  
DB_ENGINE=django.db.backends.postgresql
DB_NAME=hospital_inventory_secure_2025
DB_USER=hospital_admin_user
DB_PASSWORD=HospSecure2025#Medical$Inv789!
DB_HOST=localhost
DB_PORT=5432

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@domain.com
EMAIL_HOST_PASSWORD=your-app-specific-password

# Other Security Settings
ADMIN_EMAIL=admin@hospital.local
DEFAULT_FROM_EMAIL=noreply@hospital.local
DEFAULT_IT_EMAIL=it-support@hospital.local
SERVER_EMAIL=django-errors@hospital.local

# Rate Limiting (requests per minute)
RATELIMIT_ENABLE=True
LOGIN_RATE_LIMIT=5
API_RATE_LIMIT=60
```

## Security Checklist for Production

### Pre-Deployment
- [ ] Set `DEBUG=False`
- [ ] Configure proper database with strong credentials
- [ ] Set up SSL/TLS certificates
- [ ] Configure email settings for notifications
- [ ] Review and update `ALLOWED_HOSTS`
- [ ] Generate new `SECRET_KEY`

### Server Configuration
- [ ] Configure firewall rules
- [ ] Set up regular backups
- [ ] Configure log rotation
- [ ] Set up monitoring alerts
- [ ] Configure fail2ban for intrusion prevention

### Database Security
- [ ] Use separate database user with minimal permissions
- [ ] Enable database SSL connections
- [ ] Configure database firewall rules
- [ ] Set up database backups with encryption

### Monitoring & Maintenance
- [ ] Set up log monitoring
- [ ] Configure security alerts
- [ ] Regular security updates
- [ ] Periodic security audits
- [ ] Monitor failed login attempts

## Security Commands

### Create Secure Admin User
```bash
python manage.py createsuperuser --username secure_admin --email admin@hospital.local
```

### Check Security Configuration
```bash
python manage.py check --deploy
```

### Collect Static Files
```bash
python manage.py collectstatic --noinput
```

### Run with Gunicorn (Production)
```bash
gunicorn --bind 0.0.0.0:8000 hospital_inventory.wsgi:application
```

## Log Files
- **Application Logs**: `logs/django.log`
- **Security Logs**: `logs/security.log`

## Rate Limiting Rules
- **Login Attempts**: 5 per minute per IP
- **Registration**: 3 per minute per IP
- **General API**: 60 per minute per IP (configurable)

## Security Headers Implemented
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' cdn.jsdelivr.net
```

## Emergency Procedures

### In Case of Security Breach
1. Immediately change all passwords
2. Review access logs in `logs/security.log`
3. Check for suspicious database activity
4. Update all security configurations
5. Notify relevant stakeholders

### Account Lockout Recovery
Rate limiting is IP-based and resets automatically after the time window expires.

## Contact Information
- **Security Contact**: it-support@hospital.local
- **Admin Contact**: admin@hospital.local
- **Emergency Contact**: As configured in Django settings

---
*This security guide should be reviewed and updated regularly as part of the security maintenance process.*
