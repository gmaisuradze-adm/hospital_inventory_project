// Enhanced Error Pages JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Add loading state to Try Again button
    const tryAgainButtons = document.querySelectorAll('[onclick="location.reload()"]');
    tryAgainButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            this.classList.add('btn-loading');
            this.disabled = true;
            
            // Reload after a short delay to show loading state
            setTimeout(() => {
                location.reload();
            }, 500);
        });
    });
    
    // Add subtle animations to error page elements
    const errorCards = document.querySelectorAll('.error-info-card, .error-quick-nav');
    errorCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('animate__animated', 'animate__fadeInUp');
    });
    
    // Enhanced navigation button hover effects
    const navButtons = document.querySelectorAll('.error-nav-btn');
    navButtons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px) scale(1.02)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // Add keyboard navigation support
    document.addEventListener('keydown', function(e) {
        // ESC key to go back
        if (e.key === 'Escape') {
            const backButton = document.querySelector('[onclick="history.back()"]');
            if (backButton) {
                backButton.click();
            }
        }
        
        // Enter key to try again on 500 pages
        if (e.key === 'Enter' && document.querySelector('.error-code-bg')?.textContent === '500') {
            const tryAgainButton = document.querySelector('[onclick="location.reload()"]');
            if (tryAgainButton) {
                tryAgainButton.click();
            }
        }
    });
    
    // Add error reporting functionality
    const reportButtons = document.querySelectorAll('[href*="request_create"]');
    reportButtons.forEach(button => {
        if (button.textContent.includes('Support Request')) {
            button.addEventListener('click', function() {
                // Store error context for the support request
                const errorContext = {
                    errorCode: document.querySelector('.error-code-bg')?.textContent || 'Unknown',
                    timestamp: new Date().toISOString(),
                    userAgent: navigator.userAgent,
                    url: window.location.href
                };
                
                sessionStorage.setItem('errorContext', JSON.stringify(errorContext));
            });
        }
    });
    
    // Auto-refresh functionality for 500 errors (optional)
    if (document.querySelector('.error-code-bg')?.textContent === '500') {
        let autoRefreshInterval;
        let countdown = 30; // 30 seconds
        
        // Create countdown display
        const countdownElement = document.createElement('div');
        countdownElement.className = 'alert alert-info mt-3 text-center';
        countdownElement.innerHTML = `
            <i class="ti ti-clock me-2"></i>
            Page will auto-refresh in <span id="countdown">${countdown}</span> seconds
            <button type="button" class="btn btn-sm btn-outline-primary ms-2" id="cancelAutoRefresh">
                Cancel
            </button>
        `;
        
        const container = document.querySelector('.error-page-container .empty');
        if (container) {
            container.appendChild(countdownElement);
            
            autoRefreshInterval = setInterval(() => {
                countdown--;
                document.getElementById('countdown').textContent = countdown;
                
                if (countdown <= 0) {
                    clearInterval(autoRefreshInterval);
                    location.reload();
                }
            }, 1000);
            
            // Cancel auto-refresh
            document.getElementById('cancelAutoRefresh').addEventListener('click', () => {
                clearInterval(autoRefreshInterval);
                countdownElement.remove();
            });
        }
    }
});

// Utility function to handle network errors
function handleNetworkError() {
    const errorCards = document.querySelectorAll('.error-info-card');
    errorCards.forEach(card => {
        const offlineMessage = document.createElement('div');
        offlineMessage.className = 'alert alert-warning mt-2';
        offlineMessage.innerHTML = `
            <i class="ti ti-wifi-off me-2"></i>
            You appear to be offline. Please check your internet connection.
        `;
        card.appendChild(offlineMessage);
    });
}

// Check for network connectivity
window.addEventListener('online', () => {
    document.querySelectorAll('.alert-warning').forEach(alert => {
        if (alert.textContent.includes('offline')) {
            alert.remove();
        }
    });
});

window.addEventListener('offline', handleNetworkError);