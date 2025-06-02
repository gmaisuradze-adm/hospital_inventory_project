"""
Custom security middleware for hospital inventory system
"""
import logging
from django.http import HttpResponseForbidden
from django.shortcuts import render
from django.conf import settings

logger = logging.getLogger('django.security')


class SecurityLoggingMiddleware:
    """
    Custom middleware to log security events
    """
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Log failed authentication attempts
        if request.path == '/login/' and request.method == 'POST':
            logger.info(f"Login attempt from IP: {self.get_client_ip(request)}")

        response = self.get_response(request)

        # Log failed authorization attempts (403 responses)
        if response.status_code == 403:
            logger.warning(f"403 Forbidden - IP: {self.get_client_ip(request)}, "
                         f"Path: {request.path}, User: {request.user}")

        # Log suspicious activity
        if response.status_code == 404 and self.is_suspicious_path(request.path):
            logger.warning(f"Suspicious 404 - IP: {self.get_client_ip(request)}, "
                         f"Path: {request.path}")

        return response

    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

    def is_suspicious_path(self, path):
        """Check if path looks suspicious"""
        suspicious_patterns = [
            'admin', 'wp-admin', 'phpmyadmin', '.env', 'config',
            'backup', 'sql', 'database', 'phpinfo'
        ]
        return any(pattern in path.lower() for pattern in suspicious_patterns)


class RateLimitExceededMiddleware:
    """
    Custom handling for rate limit exceeded responses
    """
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Handle rate limit exceeded (429 status)
        if response.status_code == 429:
            logger.warning(f"Rate limit exceeded - IP: {self.get_client_ip(request)}, "
                         f"Path: {request.path}")
            
            # Return custom rate limit page
            return render(request, 'core/rate_limit_exceeded.html', status=429)

        return response

    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
