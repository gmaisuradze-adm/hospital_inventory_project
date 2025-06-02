#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Global variables
PROJECT_ROOT="/workspaces/hospital_inventory_project"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
BACKEND_DIR="$PROJECT_ROOT/backend"
LOGS_DIR="$PROJECT_ROOT/logs"
BACKUP_DIR="$PROJECT_ROOT/backups/$(date +%Y%m%d_%H%M%S)"
CONFIG_FILE="$FRONTEND_DIR/src/core/config.js"
AUTH_CONTEXT="$FRONTEND_DIR/src/core/auth/AuthContext.js"
LOGIN_FILE="$FRONTEND_DIR/src/core/auth/Login.js"

# Create necessary directories
mkdir -p "$LOGS_DIR" "$BACKUP_DIR"

# Display header
display_header() {
    clear
    echo -e "${YELLOW}╔═════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║       Hospital Inventory System - Authentication Debug      ║${NC}"
    echo -e "${YELLOW}╠═════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${YELLOW}║${NC} User: ${GREEN}gmaisuradze-adm${NC}    Date: ${GREEN}$(date '+%Y-%m-%d %H:%M:%S')${NC} ${YELLOW}║${NC}"
    echo -e "${YELLOW}╚═════════════════════════════════════════════════════════════╝${NC}"
    echo
}

# Function to log messages
log_message() {
    local level=$1
    local message=$2
    local color=$NC
    
    case "$level" in
        "INFO") color=$GREEN ;;
        "WARN") color=$YELLOW ;;
        "ERROR") color=$RED ;;
        "DEBUG") color=$BLUE ;;
    esac
    
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] ${color}${level}${NC}: ${message}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ${level}: ${message}" >> "$LOGS_DIR/debug.log"
}

# Function to create backups of important files
backup_files() {
    log_message "INFO" "Creating backups of important configuration files..."
    
    # Create backup directory structure
    mkdir -p "$BACKUP_DIR/frontend/src/core/auth"
    mkdir -p "$BACKUP_DIR/backend/config"
    
    # Backup frontend files
    if [ -f "$CONFIG_FILE" ]; then
        cp "$CONFIG_FILE" "$BACKUP_DIR/frontend/src/core/config.js"
    fi
    
    if [ -f "$AUTH_CONTEXT" ]; then
        cp "$AUTH_CONTEXT" "$BACKUP_DIR/frontend/src/core/auth/AuthContext.js"
    fi
    
    if [ -f "$LOGIN_FILE" ]; then
        cp "$LOGIN_FILE" "$BACKUP_DIR/frontend/src/core/auth/Login.js"
    fi
    
    # Backup backend config files (adjust paths as needed)
    if [ -d "$BACKEND_DIR/config" ]; then
        cp -r "$BACKEND_DIR/config/"* "$BACKUP_DIR/backend/config/"
    fi
    
    # Backup package.json files
    if [ -f "$FRONTEND_DIR/package.json" ]; then
        cp "$FRONTEND_DIR/package.json" "$BACKUP_DIR/frontend/"
    fi
    
    if [ -f "$BACKEND_DIR/package.json" ]; then
        cp "$BACKEND_DIR/package.json" "$BACKUP_DIR/backend/"
    fi
    
    log_message "INFO" "Backups created at $BACKUP_DIR"
}

# Check if servers are running
check_servers() {
    log_message "INFO" "Checking server status..."
    
    # Check backend server (port 5001)
    if lsof -ti:5001 > /dev/null 2>&1; then
        BACKEND_PID=$(lsof -ti:5001)
        log_message "INFO" "Backend server (port 5001): Running (PID: $BACKEND_PID)"
        # Check how long it's been running
        if command -v ps &> /dev/null; then
            BACKEND_START=$(ps -o lstart= -p $BACKEND_PID 2>/dev/null || echo "Unknown")
            log_message "INFO" "Backend started: $BACKEND_START"
        fi
    else
        log_message "ERROR" "Backend server (port 5001): Not running"
    fi

    # Check frontend server (port 3001)
    if lsof -ti:3001 > /dev/null 2>&1; then
        FRONTEND_PID=$(lsof -ti:3001)
        log_message "INFO" "Frontend server (port 3001): Running (PID: $FRONTEND_PID)"
        # Check how long it's been running
        if command -v ps &> /dev/null; then
            FRONTEND_START=$(ps -o lstart= -p $FRONTEND_PID 2>/dev/null || echo "Unknown")
            log_message "INFO" "Frontend started: $FRONTEND_START"
        fi
    else
        log_message "ERROR" "Frontend server (port 3001): Not running"
    fi
    
    # Check MongoDB connection (common port 27017)
    if lsof -ti:27017 > /dev/null 2>&1; then
        log_message "INFO" "MongoDB (port 27017): Available"
    else
        log_message "WARN" "MongoDB (port 27017): Not detected locally"
    fi
}

# Restart servers with better handling
restart_servers() {
    log_message "INFO" "Restarting servers..."
    
    # First, create backups
    backup_files
    
    # Kill existing processes if they exist
    if lsof -ti:5001 > /dev/null 2>&1; then
        log_message "INFO" "Stopping backend server..."
        kill -15 $(lsof -ti:5001) 2>/dev/null
        sleep 2
        # Force kill if still running
        if lsof -ti:5001 > /dev/null 2>&1; then
            log_message "WARN" "Backend still running, force killing..."
            kill -9 $(lsof -ti:5001) 2>/dev/null
        fi
    fi
    
    if lsof -ti:3001 > /dev/null 2>&1; then
        log_message "INFO" "Stopping frontend server..."
        kill -15 $(lsof -ti:3001) 2>/dev/null
        sleep 2
        # Force kill if still running
        if lsof -ti:3001 > /dev/null 2>&1; then
            log_message "WARN" "Frontend still running, force killing..."
            kill -9 $(lsof -ti:3001) 2>/dev/null
        fi
    fi
    
    # Start backend with better log handling
    log_message "INFO" "Starting backend server..."
    cd "$BACKEND_DIR" || { log_message "ERROR" "Backend directory not found"; return 1; }
    npm start > "$LOGS_DIR/backend.log" 2>&1 &
    
    # Wait a bit for backend to initialize
    sleep 5
    
    # Start frontend with better log handling
    log_message "INFO" "Starting frontend server..."
    cd "$FRONTEND_DIR" || { log_message "ERROR" "Frontend directory not found"; return 1; }
    npm start > "$LOGS_DIR/frontend.log" 2>&1 &
    
    log_message "INFO" "Waiting for servers to start..."
    
    # More intelligent waiting - check for actual availability
    for i in {1..30}; do
        if lsof -ti:5001 > /dev/null 2>&1 && lsof -ti:3001 > /dev/null 2>&1; then
            log_message "INFO" "Both servers started successfully"
            break
        fi
        echo -n "."
        sleep 1
        
        # If we've waited too long, check what's happening
        if [ $i -eq 20 ]; then
            log_message "WARN" "Servers taking longer than expected to start"
            log_message "DEBUG" "Checking startup logs..."
            
            # Print last few lines of logs
            if [ -f "$LOGS_DIR/backend.log" ]; then
                log_message "DEBUG" "Backend logs (last 5 lines):"
                tail -n 5 "$LOGS_DIR/backend.log"
            fi
            
            if [ -f "$LOGS_DIR/frontend.log" ]; then
                log_message "DEBUG" "Frontend logs (last 5 lines):"
                tail -n 5 "$LOGS_DIR/frontend.log"
            fi
        fi
    done
    
    echo # New line after dots
    check_servers
}

# Create enhanced cache clearer
create_cache_clearer() {
    log_message "INFO" "Creating enhanced cache clearer page..."
    
    # Create a more comprehensive HTML page to clear cache
    cat > cache-clearer.html << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Auth Debugger</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            line-height: 1.6;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1, h2, h3 {
            color: #333;
        }
        .header {
            background-color: #4a69bd;
            color: white;
            padding: 15px;
            margin: -20px -20px 20px -20px;
            border-radius: 8px 8px 0 0;
        }
        .button-group {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-bottom: 20px;
        }
        button {
            background-color: #e74c3c;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            transition: background-color 0.2s;
        }
        button:hover {
            background-color: #c0392b;
        }
        button.success {
            background-color: #2ecc71;
        }
        button.success:hover {
            background-color: #27ae60;
        }
        button.info {
            background-color: #3498db;
        }
        button.info:hover {
            background-color: #2980b9;
        }
        button.warning {
            background-color: #f39c12;
        }
        button.warning:hover {
            background-color: #d35400;
        }
        .panel {
            background-color: #f8f9fa;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 15px;
            margin-bottom: 20px;
        }
        .panel-title {
            margin-top: 0;
            margin-bottom: 10px;
            font-size: 16px;
            font-weight: bold;
        }
        pre {
            background-color: #f1f1f1;
            padding: 10px;
            border-radius: 4px;
            overflow-x: auto;
            font-size: 14px;
        }
        .tab-container {
            margin: 20px 0;
        }
        .tab-buttons {
            display: flex;
            border-bottom: 1px solid #ddd;
        }
        .tab-button {
            padding: 10px 15px;
            background-color: #f1f1f1;
            border: none;
            border-radius: 4px 4px 0 0;
            cursor: pointer;
            margin-right: 5px;
        }
        .tab-button.active {
            background-color: #fff;
            border: 1px solid #ddd;
            border-bottom: 1px solid #fff;
            margin-bottom: -1px;
        }
        .tab-content {
            display: none;
            padding: 15px;
            border: 1px solid #ddd;
            border-top: none;
            border-radius: 0 0 4px 4px;
        }
        .tab-content.active {
            display: block;
        }
        .label {
            font-weight: bold;
            margin-right: 5px;
        }
        .network-info {
            margin-top: 10px;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            color: #7f8c8d;
            font-size: 12px;
        }
        .jwt-payload {
            color: #e74c3c;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0;">Hospital Inventory System - Auth Debugger</h1>
            <p style="margin: 5px 0 0 0;">A comprehensive tool for debugging authentication issues</p>
        </div>
        
        <div class="tab-container">
            <div class="tab-buttons">
                <button class="tab-button active" onclick="openTab(event, 'storage-tab')">Storage Manager</button>
                <button class="tab-button" onclick="openTab(event, 'network-tab')">Network Tests</button>
                <button class="tab-button" onclick="openTab(event, 'jwt-tab')">JWT Decoder</button>
                <button class="tab-button" onclick="openTab(event, 'logs-tab')">Console Logs</button>
            </div>
            
            <div id="storage-tab" class="tab-content active">
                <h2>Storage Management</h2>
                <p>Manage browser storage and authentication tokens</p>
                
                <div class="button-group">
                    <button onclick="clearAuthTokens()">Clear Auth Tokens Only</button>
                    <button onclick="clearAllStorage()" class="warning">Clear ALL Storage</button>
                    <button onclick="hardReload()" class="success">Clear & Reload App</button>
                </div>
                
                <div class="panel">
                    <h3 class="panel-title">Current Storage Status:</h3>
                    <pre id="storageStatus">Loading...</pre>
                </div>
            </div>
            
            <div id="network-tab" class="tab-content">
                <h2>Network Diagnostics</h2>
                <p>Test API connectivity and endpoints</p>
                
                <div class="button-group">
                    <button onclick="testAPIConnection()" class="info">Test API Connection</button>
                    <button onclick="testCORS()" class="info">Test CORS Setup</button>
                    <button onclick="testAuthEndpoint()" class="info">Test Auth Endpoint</button>
                </div>
                
                <div class="panel">
                    <h3 class="panel-title">Results:</h3>
                    <div id="networkResults">Run a test to see results</div>
                </div>
            </div>
            
            <div id="jwt-tab" class="tab-content">
                <h2>JWT Token Analysis</h2>
                <p>Decode and analyze JWT tokens</p>
                
                <div class="panel">
                    <div>
                        <label for="jwtInput">Enter JWT Token (or will use token from localStorage):</label>
                        <input type="text" id="jwtInput" style="width: 100%; padding: 8px; margin: 10px 0;" 
                               placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...">
                        <button onclick="decodeJWT()" class="info">Decode Token</button>
                    </div>
                    
                    <div style="margin-top: 15px;">
                        <h3>Decoded Token:</h3>
                        <pre id="jwtResult">No token decoded yet</pre>
                    </div>
                </div>
            </div>
            
            <div id="logs-tab" class="tab-content">
                <h2>Console Logging</h2>
                <p>View console logs related to authentication</p>
                
                <div class="button-group">
                    <button onclick="clearLogs()" class="warning">Clear Logs</button>
                    <button onclick="testAuthFlow()" class="info">Run Auth Flow Test</button>
                </div>
                
                <div class="panel">
                    <pre id="consoleLogs" style="height: 300px; overflow-y: auto;">Console logs will appear here...</pre>
                </div>
            </div>
        </div>
        
        <div id="output" class="panel"></div>
        
        <div class="footer">
            <p>Created for gmaisuradze-adm on ${new Date().toISOString().split('T')[0]}</p>
            <p>Hospital Inventory System - Auth Debugging Tool v2.0</p>
        </div>
    </div>

    <script>
        // Tab functionality
        function openTab(evt, tabName) {
            const tabContents = document.getElementsByClassName("tab-content");
            for (let i = 0; i < tabContents.length; i++) {
                tabContents[i].classList.remove("active");
            }
            
            const tabButtons = document.getElementsByClassName("tab-button");
            for (let i = 0; i < tabButtons.length; i++) {
                tabButtons[i].classList.remove("active");
            }
            
            document.getElementById(tabName).classList.add("active");
            evt.currentTarget.classList.add("active");
        }
        
        // Initialize console logging capture
        const originalConsole = {
            log: console.log,
            error: console.error,
            warn: console.warn,
            info: console.info
        };
        
        const logs = [];
        
        function captureLog(type, args) {
            const text = Array.from(args).map(arg => {
                if (typeof arg === 'object') {
                    try {
                        return JSON.stringify(arg, null, 2);
                    } catch (e) {
                        return String(arg);
                    }
                }
                return String(arg);
            }).join(' ');
            
            logs.push(\`[\${new Date().toISOString()}] [\${type.toUpperCase()}] \${text}\`);
            updateLogs();
            return originalConsole[type].apply(console, args);
        }
        
        console.log = function() { return captureLog('log', arguments); };
        console.error = function() { return captureLog('error', arguments); };
        console.warn = function() { return captureLog('warn', arguments); };
        console.info = function() { return captureLog('info', arguments); };
        
        function updateLogs() {
            const logElement = document.getElementById('consoleLogs');
            logElement.textContent = logs.join('\\n');
            logElement.scrollTop = logElement.scrollHeight;
        }
        
        function clearLogs() {
            logs.length = 0;
            updateLogs();
            document.getElementById('output').textContent = 'Console logs cleared';
        }
        
        // Storage management functions
        function displayStorageStatus() {
            const status = document.getElementById('storageStatus');
            let content = '';
            
            // Function to format values
            const formatValue = (value) => {
                if (!value) return 'null';
                
                // If it looks like a JWT token, format it specially
                if (typeof value === 'string' && value.match(/^eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/)) {
                    return \`<span class="jwt-payload">[JWT Token]</span> \${value.substring(0, 15)}...\`;
                }
                
                // Otherwise do basic formatting
                if (typeof value === 'string' && value.length > 50) {
                    return \`\${value.substring(0, 50)}...\`;
                }
                
                return value;
            };
            
            // Check localStorage
            content += '=== localStorage ===\\n';
            if (localStorage.length === 0) {
                content += 'Empty\\n';
            } else {
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    const value = localStorage.getItem(key);
                    content += \`\${key}: \${formatValue(value)}\\n\`;
                }
            }
            
            // Check sessionStorage
            content += '\\n=== sessionStorage ===\\n';
            if (sessionStorage.length === 0) {
                content += 'Empty\\n';
            } else {
                for (let i = 0; i < sessionStorage.length; i++) {
                    const key = sessionStorage.key(i);
                    const value = sessionStorage.getItem(key);
                    content += \`\${key}: \${formatValue(value)}\\n\`;
                }
            }
            
            // Check cookies
            content += '\\n=== cookies ===\\n';
            if (document.cookie.length === 0) {
                content += 'No cookies\\n';
            } else {
                document.cookie.split(';').forEach(cookie => {
                    cookie = cookie.trim();
                    const [key, ...value] = cookie.split('=');
                    content += \`\${key}: \${formatValue(value.join('='))}\\n\`;
                });
            }
            
            status.innerHTML = content;
        }
        
        function clearAuthTokens() {
            const tokenKeys = ['token', 'authToken', 'auth_token', 'jwt', 'accessToken', 'access_token', 'id_token'];
            
            // Clear from localStorage
            tokenKeys.forEach(key => localStorage.removeItem(key));
            
            // Clear from sessionStorage
            tokenKeys.forEach(key => sessionStorage.removeItem(key));
            
            // Try to clear from cookies (limited by httpOnly)
            tokenKeys.forEach(key => {
                document.cookie = \`\${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;\`;
            });
            
            document.getElementById('output').innerHTML = '<strong>Auth tokens cleared!</strong> Refresh storage tab to see changes.';
            displayStorageStatus();
            console.info('Auth tokens cleared from browser storage');
        }
        
        function clearAllStorage() {
            localStorage.clear();
            sessionStorage.clear();
            
            // Try to clear cookies (limited by httpOnly)
            document.cookie.split(';').forEach(cookie => {
                const key = cookie.trim().split('=')[0];
                document.cookie = \`\${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;\`;
            });
            
            document.getElementById('output').innerHTML = '<strong>All storage cleared!</strong> Refresh storage tab to see changes.';
            displayStorageStatus();
            console.info('All browser storage cleared');
        }
        
        function hardReload() {
            clearAllStorage();
            document.getElementById('output').innerHTML = '<strong>Storage cleared! Reloading app...</strong>';
            console.info('Hard reloading application...');
            
            setTimeout(() => {
                window.location.href = '/login?cache=' + new Date().getTime();
            }, 1000);
        }
        
        // Network testing functions
        async function testAPIConnection() {
            const output = document.getElementById('networkResults');
            output.innerHTML = '<p>Testing API connection...</p>';
            
            try {
                const startTime = performance.now();
                const response = await fetch('http://localhost:5001/api/health', {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });
                const endTime = performance.now();
                
                const responseTime = Math.round(endTime - startTime);
                const data = await response.text();
                
                if (response.ok) {
                    output.innerHTML = \`
                        <div style="color: green;">
                            <p>✅ API Connection Successful</p>
                            <p>Response Time: \${responseTime}ms</p>
                            <p>Status: \${response.status} \${response.statusText}</p>
                            <p>Data: \${data}</p>
                        </div>
                    \`;
                    console.info('API connection test successful', { status: response.status, data });
                } else {
                    output.innerHTML = \`
                        <div style="color: red;">
                            <p>❌ API Connection Failed</p>
                            <p>Status: \${response.status} \${response.statusText}</p>
                            <p>Data: \${data}</p>
                        </div>
                    \`;
                    console.error('API connection test failed', { status: response.status, data });
                }
            } catch (error) {
                output.innerHTML = \`
                    <div style="color: red;">
                        <p>❌ API Connection Error</p>
                        <p>Error: \${error.message}</p>
                        <p>This usually indicates the API server is not running or there's a network/CORS issue</p>
                    </div>
                \`;
                console.error('API connection test error', error);
            }
        }
        
        async function testCORS() {
            const output = document.getElementById('networkResults');
            output.innerHTML = '<p>Testing CORS configuration...</p>';
            
            try {
                const response = await fetch('http://localhost:5001/api/health', {
                    method: 'OPTIONS',
                    headers: {
                        'Origin': window.location.origin,
                        'Access-Control-Request-Method': 'GET',
                        'Access-Control-Request-Headers': 'Content-Type,Authorization'
                    }
                });
                
                const corsHeaders = {
                    'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                    'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                    'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
                };
                
                if (corsHeaders['Access-Control-Allow-Origin']) {
                    output.innerHTML = \`
                        <div style="color: green;">
                            <p>✅ CORS Configuration Appears Correct</p>
                            <p>Allow-Origin: \${corsHeaders['Access-Control-Allow-Origin']}</p>
                            <p>Allow-Methods: \${corsHeaders['Access-Control-Allow-Methods']}</p>
                            <p>Allow-Headers: \${corsHeaders['Access-Control-Allow-Headers']}</p>
                        </div>
                    \`;
                    console.info('CORS test successful', corsHeaders);
                } else {
                    output.innerHTML = \`
                        <div style="color: orange;">
                            <p>⚠️ CORS Headers Not Found</p>
                            <p>This might cause authentication problems. The server should respond with proper CORS headers.</p>
                        </div>
                    \`;
                    console.warn('CORS test: headers not found');
                }
            } catch (error) {
                output.innerHTML = \`
                    <div style="color: red;">
                        <p>❌ CORS Test Error</p>
                        <p>Error: \${error.message}</p>
                        <p>This might indicate a CORS configuration issue on the server</p>
                    </div>
                \`;
                console.error('CORS test error', error);
            }
        }
        
        async function testAuthEndpoint() {
            const output = document.getElementById('networkResults');
            output.innerHTML = '<p>Testing authentication endpoint...</p>';
            
            try {
                // First try to determine the correct endpoint
                const endpoints = [
                    'http://localhost:5001/api/auth/login',
                    'http://localhost:5001/api/login',
                    'http://localhost:5001/api/user/login',
                    'http://localhost:5001/api/users/login',
                    'http://localhost:5001/api/auth/signin'
                ];
                
                const results = [];
                
                for (const endpoint of endpoints) {
                    try {
                        const response = await fetch(endpoint, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ username: 'test', password: 'testpassword' })
                        });
                        
                        const data = await response.text();
                        results.push({
                            endpoint,
                            status: response.status,
                            statusText: response.statusText,
                            data: data.substring(0, 100) + (data.length > 100 ? '...' : '')
                        });
                    } catch (err) {
                        results.push({
                            endpoint,
                            error: err.message
                        });
                    }
                }
                
                // Display results
                let resultsHTML = '<div><h3>Auth Endpoint Test Results:</h3>';
                
                results.forEach(result => {
                    const isSuccess = result.status && (result.status !== 404);
                    const color = isSuccess ? 'green' : 'red';
                    
                    resultsHTML += \`
                        <div style="margin-bottom: 10px; padding: 5px; border-left: 3px solid \${color};">
                            <p><strong>Endpoint:</strong> \${result.endpoint}</p>
                            \${result.status ? 
                                \`<p><strong>Status:</strong> \${result.status} \${result.statusText}</p>\` : 
                                \`<p><strong>Error:</strong> \${result.error}</p>\`
                            }
                            \${result.data ? \`<p><strong>Response:</strong> \${result.data}</p>\` : ''}
                        </div>
                    \`;
                });
                
                resultsHTML += '<p><strong>Note:</strong> A non-404 response usually indicates the correct endpoint, even if login fails due to invalid credentials.</p></div>';
                
                output.innerHTML = resultsHTML;
                console.info('Auth endpoint test completed', results);
            } catch (error) {
                output.innerHTML = \`
                    <div style="color: red;">
                        <p>❌ Auth Endpoint Test Error</p>
                        <p>Error: \${error.message}</p>
                    </div>
                \`;
                console.error('Auth endpoint test error', error);
            }
        }
        
        // JWT Token functions
        function decodeJWT() {
            const inputField = document.getElementById('jwtInput');
            let token = inputField.value.trim();
            
            // If no token provided, try to get from localStorage
            if (!token) {
                const possibleKeys = ['token', 'authToken', 'auth_token', 'jwt', 'accessToken'];
                for (const key of possibleKeys) {
                    const storedToken = localStorage.getItem(key);
                    if (storedToken) {
                        token = storedToken;
                        inputField.value = token;
                        break;
                    }
                }
                
                if (!token) {
                    document.getElementById('jwtResult').textContent = 'No token found in input or localStorage';
                    return;
                }
            }
            
            try {
                // Split the token into parts
                const parts = token.split('.');
                if (parts.length !== 3) {
                    throw new Error('Not a valid JWT token format (should have 3 parts separated by dots)');
                }
                
                // Decode the header and payload
                const header = JSON.parse(atob(parts[0]));
                const payload = JSON.parse(atob(parts[1]));
                
                // Calculate expiration status
                let expirationStatus = '';
                if (payload.exp) {
                    const expDate = new Date(payload.exp * 1000);
                    const now = new Date();
                    if (expDate < now) {
                        expirationStatus = \`EXPIRED on \${expDate.toLocaleString()}\`;
                    } else {
                        const diff = expDate - now;
                        const minutes = Math.floor(diff / 60000);
                        const hours = Math.floor(minutes / 60);
                        const days = Math.floor(hours / 24);
                        
                        if (days > 0) {
                            expirationStatus = \`Valid for \${days} days, \${hours % 24} hours\`;
                        } else if (hours > 0) {
                            expirationStatus = \`Valid for \${hours} hours, \${minutes % 60} minutes\`;
                        } else {
                            expirationStatus = \`Valid for \${minutes} minutes\`;
                        }
                    }
                }
                
                // Format the result
                const result = {
                    header,
                    payload,
                    expirationStatus,
                    issuedAt: payload.iat ? new Date(payload.iat * 1000).toLocaleString() : 'Not specified',
                    expiresAt: payload.exp ? new Date(payload.exp * 1000).toLocaleString() : 'Not specified'
                };
                
                document.getElementById('jwtResult').innerHTML = \`
                    <div>
                        <p><strong>Token Status:</strong> <span style="color: \${expirationStatus.includes('EXPIRED') ? 'red' : 'green'}">\${expirationStatus || 'No expiration specified'}</span></p>
                        <p><strong>Issued At:</strong> \${result.issuedAt}</p>
                        <p><strong>Expires At:</strong> \${result.expiresAt}</p>
                        <p><strong>Header:</strong></p>
                        <pre>\${JSON.stringify(header, null, 2)}</pre>
                        <p><strong>Payload:</strong></p>
                        <pre>\${JSON.stringify(payload, null, 2)}</pre>
                    </div>
                \`;
                
                console.info('JWT token decoded successfully', { header, payload });
            } catch (error) {
                document.getElementById('jwtResult').textContent = \`Error decoding token: \${error.message}\`;
                console.error('JWT decoding error', error);
            }
        }
        
        // Auth flow test
        async function testAuthFlow() {
            const output = document.getElementById('consoleLogs');
            console.info('Starting authentication flow test...');
            
            try {
                // First clear any existing tokens
                clearAuthTokens();
                console.info('Cleared existing tokens');
                
                // Get API URL from local storage or use default
                const storedApiUrl = localStorage.getItem('apiUrl');
                const apiUrl = storedApiUrl || 'http://localhost:5001/api';
                console.info(\`Using API URL: \${apiUrl}\`);
                
                // 1. Try to determine the correct login endpoint
                const endpoints = [
                    \`\${apiUrl}/auth/login\`,
                    \`\${apiUrl}/login\`,
                    \`\${apiUrl}/user/login\`,
                    \`\${apiUrl}/users/login\`,
                    \`\${apiUrl}/auth/signin\`
                ];
                
                let workingEndpoint = null;
                let endpointResponse = null;
                
                console.info('Testing authentication endpoints...');
                
                for (const endpoint of endpoints) {
                    try {
                        console.info(\`Trying endpoint: \${endpoint}\`);
                        
                        const response = await fetch(endpoint, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ username: 'test', password: 'testpassword' })
                        });
                        
                        const data = await response.text();
                        console.info(\`Response from \${endpoint}: Status \${response.status} \${response.statusText}\`);
                        
                        // Any response that's not 404 is potentially the right endpoint
                        if (response.status !== 404) {
                            workingEndpoint = endpoint;
                            endpointResponse = { status: response.status, data };
                            console.info(\`Found potential auth endpoint: \${endpoint}\`);
                            break;
                        }
                    } catch (err) {
                        console.warn(\`Error testing endpoint \${endpoint}: \${err.message}\`);
                    }
                }
                
                if (workingEndpoint) {
                    console.info(\`Auth flow test - Found endpoint: \${workingEndpoint}\`);
                    console.info('Response:', endpointResponse);
                    
                    // Try to determine expected payload format based on error message
                    let credentialFormat = { username: 'username', password: 'password' };
                    
                    if (endpointResponse.data.includes('email')) {
                        credentialFormat = { email: 'email', password: 'password' };
                        console.info('Credential format appears to use email instead of username');
                    }
                    
                    console.info(\`Detected credential format: \${JSON.stringify(credentialFormat)}\`);
                    
                    // Save the working endpoint info for future reference
                    localStorage.setItem('authEndpoint', workingEndpoint);
                    localStorage.setItem('credentialFormat', JSON.stringify(credentialFormat));
                    
                    console.info('Auth flow test completed - endpoint information saved to localStorage');
                } else {
                    console.error('Auth flow test - Could not find a working authentication endpoint');
                }
            } catch (error) {
                console.error('Auth flow test error:', error);
            }
        }
        
        // Initialize on page load
        window.onload = function() {
            // Initialize storage display
            displayStorageStatus();
            
            // Log page initialization
            console.info('Auth debugger initialized');
            console.info('Browser:', navigator.userAgent);
            console.info('Current URL:', window.location.href);
            
            // Get any existing credentials format from localStorage
            const storedFormat = localStorage.getItem('credentialFormat');
            if (storedFormat) {
                try {
                    const format = JSON.parse(storedFormat);
                    console.info('Found stored credential format:', format);
                } catch (e) {
                    console.warn('Error parsing stored credential format');
                }
            }
            
            // Output a helpful message
            document.getElementById('output').innerHTML = \`
                <p>Welcome to the Auth Debugger. Use the tabs above to:</p>
                <ul>
                    <li>Manage browser storage and tokens</li>
                    <li>Test API connectivity and CORS configuration</li>
                    <li>Decode and analyze JWT tokens</li>
                    <li>View console logs for debugging</li>
                </ul>
                <p>Start by running the <strong>Test Auth Flow</strong> under the Console Logs tab to automatically detect your authentication endpoint.</p>
            \`;
        };
    </script>
</body>
</html>
EOF

    log_message "INFO" "Enhanced cache clearer created: cache-clearer.html"
    
    # Try to open the file directly
    if command -v xdg-open &> /dev/null; then
        xdg-open "cache-clearer.html"
    elif command -v open &> /dev/null; then
        open "cache-clearer.html"
    fi
}

# Enhanced authentication issue fixing
fix_auth_issues() {
    log_message "INFO" "Checking and fixing common authentication issues..."
    
    # 1. Check and fix config.js file
    if [ -f "$CONFIG_FILE" ]; then
        log_message "INFO" "Examining API URL in config.js..."
        
        # Check current API URL
        CURRENT_API_URL=$(grep -o "API_URL.*=.*'[^']*'" "$CONFIG_FILE" | cut -d "'" -f 2)
        log_message "INFO" "Current API URL: $CURRENT_API_URL"
        
        # Determine if the URL needs updating
        if [[ "$CURRENT_API_URL" != *":5001/api"* ]]; then
            log_message "WARN" "API URL doesn't match expected backend port (5001)"
            
            # Create backup
            cp "$CONFIG_FILE" "$CONFIG_FILE.bak"
            log_message "INFO" "Created backup of config.js"
            
            # Update API URL
            echo "export const API_URL = 'http://localhost:5001/api';" > "$CONFIG_FILE.new"
            echo "export const AUTH_TOKEN_KEY = 'authToken';" >> "$CONFIG_FILE.new"
            mv "$CONFIG_FILE.new" "$CONFIG_FILE"
            log_message "INFO" "Updated config.js with correct API URL"
        else
            log_message "INFO" "API URL looks correct"
        fi
    else
        log_message "ERROR" "Config file not found: $CONFIG_FILE"
    fi
    
    # 2. Check and fix Auth Context
    if [ -f "$AUTH_CONTEXT" ]; then
        log_message "INFO" "Analyzing AuthContext.js..."
        
        # Check for common issues
        TOKEN_KEY_ISSUE=$(grep -c "AUTH_TOKEN_KEY" "$AUTH_CONTEXT")
        if [ "$TOKEN_KEY_ISSUE" -eq 0 ]; then
            log_message "WARN" "AuthContext.js doesn't use AUTH_TOKEN_KEY constant"
            
            # Create backup
            cp "$AUTH_CONTEXT" "$AUTH_CONTEXT.bak"
            log_message "INFO" "Created backup of AuthContext.js"
            
            # Fix the token key issue
            sed -i 's/localStorage.getItem("token")/localStorage.getItem(AUTH_TOKEN_KEY)/g' "$AUTH_CONTEXT"
            sed -i 's/localStorage.getItem(\'token\')/localStorage.getItem(AUTH_TOKEN_KEY)/g' "$AUTH_CONTEXT"
            sed -i 's/localStorage.removeItem("token")/localStorage.removeItem(AUTH_TOKEN_KEY)/g' "$AUTH_CONTEXT"
            sed -i 's/localStorage.removeItem(\'token\')/localStorage.removeItem(AUTH_TOKEN_KEY)/g' "$AUTH_CONTEXT"
            
            log_message "INFO" "Updated AuthContext.js to use AUTH_TOKEN_KEY constant"
        else
            log_message "INFO" "AuthContext.js correctly uses AUTH_TOKEN_KEY"
        fi
        
        # Check for profile verification endpoint
        PROFILE_API_ISSUE=$(grep -c "auth/profile" "$AUTH_CONTEXT")
        if [ "$PROFILE_API_ISSUE" -eq 0 ]; then
            log_message "WARN" "AuthContext.js might be using incorrect profile endpoint"
            log_message "INFO" "Recommend checking the user profile verification endpoint"
        else
            log_message "INFO" "Profile verification endpoint looks correct"
        fi
    else
        log_message "ERROR" "AuthContext file not found: $AUTH_CONTEXT"
    fi
    
    # 3. Check and fix Login.js
    if [ -f "$LOGIN_FILE" ]; then
        log_message "INFO" "Analyzing Login.js..."
        
        # Check for login endpoint
        LOGIN_ENDPOINT=$(grep -o "axios.post(\`\${API_URL}/[^'\"]\+" "$LOGIN_FILE" | cut -d '`' -f 2)
        log_message "INFO" "Current login endpoint: $LOGIN_ENDPOINT"
        
        # Check for credentials format
        if grep -q "username" "$LOGIN_FILE"; then
            log_message "INFO" "Login.js uses 'username' field for authentication"
        elif grep -q "email" "$LOGIN_FILE"; then
            log_message "INFO" "Login.js uses 'email' field for authentication"
        else
            log_message "WARN" "Unable to determine authentication field (username/email)"
        fi
        
        # Add debugging to Login.js
        log_message "INFO" "Adding enhanced error handling to Login.js..."
        
        # Create backup
        cp "$LOGIN_FILE" "$LOGIN_FILE.bak"
        
        # Find the handleSubmit function and add enhanced error handling
        sed -i '/catch (err) {/,/}/c\
    catch (err) {\
      console.error("Login error:", err);\
      console.error("Response data:", err.response?.data);\
      console.error("Status code:", err.response?.status);\
      let errorMessage = "Login failed.";\
      \
      if (err.response) {\
        if (err.response.status === 401) {\
          errorMessage = "Invalid credentials. Please check your username and password.";\
        } else if (err.response.status === 404) {\
          errorMessage = "Login service not found. API endpoint may be incorrect.";\
        } else if (err.response.status === 500) {\
          errorMessage = "Server error. Please try again later.";\
        }\
        \
        if (err.response.data?.message) {\
          errorMessage = err.response.data.message;\
        }\
      } else if (err.request) {\
        errorMessage = "No response from server. Please check your connection.";\
      }\
      \
      setError(errorMessage);\
    } finally {' "$LOGIN_FILE"
        
        log_message "INFO" "Enhanced error handling added to Login.js"
    else
        log_message "ERROR" "Login file not found: $LOGIN_FILE"
    fi
    
    # 4. Check package.json for CORS configuration
    BACKEND_PACKAGE="$BACKEND_DIR/package.json"
    if [ -f "$BACKEND_PACKAGE" ]; then
        log_message "INFO" "Checking backend package.json for CORS dependency..."
        
        # Check if cors package is installed
        if grep -q '"cors"' "$BACKEND_PACKAGE"; then
            log_message "INFO" "CORS package is installed in backend"
        else
            log_message "WARN" "CORS package may not be installed in backend"
            log_message "INFO" "Recommend installing CORS: cd $BACKEND_DIR && npm install cors"
        fi
    fi
    
    log_message "INFO" "Auth fixes and analysis completed"
}

# Create test account function
create_test_account() {
    log_message "INFO" "Creating test user account..."
    
    # Check if MongoDB is running
    if ! lsof -ti:27017 > /dev/null 2>&1; then
        log_message "WARN" "MongoDB does not appear to be running locally"
        log_message "INFO" "This function works best with direct database access"
    fi
    
    # Try to determine the MongoDB connection string and user model
    MONGO_URI=""
    USER_MODEL=""
    
    # Look for MongoDB connection string in backend files
    if [ -d "$BACKEND_DIR" ]; then
        # Look in common config files
        for CONFIG_FILE in $(find "$BACKEND_DIR" -type f -name "*.js" -o -name "*.ts" | grep -E 'config|db|database|mongo'); do
            if grep -q "mongodb" "$CONFIG_FILE"; then
                MONGO_URI=$(grep -o "mongodb[^'\"]\+" "$CONFIG_FILE" | head -1)
                log_message "INFO" "Found MongoDB URI in $CONFIG_FILE"
                break
            fi
        done
        
        # Look for User model definition
        for MODEL_FILE in $(find "$BACKEND_DIR" -type f -name "*.js" -o -name "*.ts" | grep -E 'user|auth|model'); do
            if grep -q "mongoose.model.*User" "$MODEL_FILE" || grep -q "mongoose.Schema" "$MODEL_FILE" && grep -q "user\|User" "$MODEL_FILE"; then
                USER_MODEL="$MODEL_FILE"
                log_message "INFO" "Found potential User model in $MODEL_FILE"
                break
            fi
        done
    fi
    
    # Create a script to insert a test user
    cat > create-test-user.js << EOF
// This script creates a test user for authentication debugging
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Configure connection - update this if needed
const mongoUri = process.env.MONGO_URI || '${MONGO_URI}' || 'mongodb://localhost:27017/hospital_inventory';

// Connect to MongoDB
mongoose.connect(mongoUri)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Define a simple user schema if one doesn't exist in the app
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'admin' },
  department: { type: String, default: 'IT' },
  createdAt: { type: Date, default: Date.now }
});

// Use the existing User model or create a new one
const User = mongoose.models.User || mongoose.model('User', userSchema);

async function createTestUser() {
  try {
    // Check if test user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { email: 'test@example.com' },
        { username: 'testuser' }
      ]
    });
    
    if (existingUser) {
      console.log('Test user already exists:', existingUser);
      console.log('Username:', existingUser.username || existingUser.email);
      console.log('Password: testpassword123');
      return;
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('testpassword123', salt);
    
    // Create new test user
    const newUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      username: 'testuser',
      password: hashedPassword,
      role: 'admin',
      department: 'IT'
    });
    
    await newUser.save();
    console.log('Test user created successfully');
    console.log('Username: testuser');
    console.log('Email: test@example.com');
    console.log('Password: testpassword123');
    
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    mongoose.connection.close();
  }
}

createTestUser();
EOF

    log_message "INFO" "Created script to add test user (create-test-user.js)"
    log_message "INFO" "To run this script: cd $BACKEND_DIR && node ../create-test-user.js"
    log_message "INFO" "Test user credentials (after running script):"
    log_message "INFO" "  Username: testuser"
    log_message "INFO" "  Email: test@example.com"
    log_message "INFO" "  Password: testpassword123"
}

# Environment variables check
check_env_variables() {
    log_message "INFO" "Checking environment variables..."
    
    # Check frontend .env file
    FRONTEND_ENV="$FRONTEND_DIR/.env"
    if [ -f "$FRONTEND_ENV" ]; then
        log_message "INFO" "Frontend .env file exists"
        if grep -q "REACT_APP_API_URL" "$FRONTEND_ENV"; then
            API_URL=$(grep "REACT_APP_API_URL" "$FRONTEND_ENV" | cut -d '=' -f 2)
            log_message "INFO" "REACT_APP_API_URL is set to: $API_URL"
        else
            log_message "WARN" "REACT_APP_API_URL not found in frontend .env file"
        fi
    else
        log_message "WARN" "Frontend .env file not found"
        
        # Create a default .env file
        echo "REACT_APP_API_URL=http://localhost:5001/api" > "$FRONTEND_ENV"
        log_message "INFO" "Created default frontend .env file with API URL"
    fi
    
    # Check backend .env file
    BACKEND_ENV="$BACKEND_DIR/.env"
    if [ -f "$BACKEND_ENV" ]; then
        log_message "INFO" "Backend .env file exists"
        
        # Check for critical environment variables
        if grep -q "JWT_SECRET" "$BACKEND_ENV"; then
            log_message "INFO" "JWT_SECRET is set"
        else
            log_message "WARN" "JWT_SECRET not found in backend .env file"
            
            # Append JWT_SECRET to .env file
            echo "JWT_SECRET=authdebugsecretkey123456789" >> "$BACKEND_ENV"
            log_message "INFO" "Added default JWT_SECRET to backend .env file"
        fi
        
        if grep -q "MONGO_URI" "$BACKEND_ENV"; then
            MONGO_URI=$(grep "MONGO_URI" "$BACKEND_ENV" | cut -d '=' -f 2)
            log_message "INFO" "MONGO_URI is set to: $MONGO_URI"
        else
            log_message "WARN" "MONGO_URI not found in backend .env file"
        fi
    else
        log_message "WARN" "Backend .env file not found"
        
        # Create a default .env file
        cat > "$BACKEND_ENV" << EOF
PORT=5001
MONGO_URI=mongodb://localhost:27017/hospital_inventory
JWT_SECRET=authdebugsecretkey123456789
NODE_ENV=development
EOF
        log_message "INFO" "Created default backend .env file with necessary variables"
    fi
    
    log_message "INFO" "Environment variables check completed"
}

# Advanced auth debugging function
advanced_auth_debug() {
    log_message "INFO" "Running advanced authentication debugging..."
    
    # 1. Check login component's form submission
    if [ -f "$LOGIN_FILE" ]; then
        log_message "INFO" "Analyzing login form submission..."
        
        # Determine what fields are being submitted
        if grep -q "username" "$LOGIN_FILE" && grep -q "password" "$LOGIN_FILE"; then
            log_message "INFO" "Login form submits username and password"
            
            # Check if username is correctly extracted from form
            if grep -q "setUsername(e.target.value)" "$LOGIN_FILE" || grep -q "setUsername(e.currentTarget.value)" "$LOGIN_FILE"; then
                log_message "INFO" "Username is correctly extracted from form"
            else
                log_message "WARN" "Potential issue with username extraction from form"
            fi
        elif grep -q "email" "$LOGIN_FILE" && grep -q "password" "$LOGIN_FILE"; then
            log_message "INFO" "Login form submits email and password"
            
            # Check if email is correctly extracted from form
            if grep -q "setEmail(e.target.value)" "$LOGIN_FILE" || grep -q "setEmail(e.currentTarget.value)" "$LOGIN_FILE"; then
                log_message "INFO" "Email is correctly extracted from form"
            else
                log_message "WARN" "Potential issue with email extraction from form"
            fi
        else
            log_message "WARN" "Could not determine login form fields"
        fi
    fi
    
    # 2. Check token storage in AuthContext
    if [ -f "$AUTH_CONTEXT" ]; then
        log_message "INFO" "Analyzing token storage in AuthContext..."
        
        # Check how the token is being stored
        if grep -q "localStorage.setItem" "$AUTH_CONTEXT"; then
            log_message "INFO" "Token is stored in localStorage"
        elif grep -q "sessionStorage.setItem" "$AUTH_CONTEXT"; then
            log_message "INFO" "Token is stored in sessionStorage"
        else
            log_message "WARN" "Could not determine token storage method"
        fi
        
        # Check if token is being set in axios headers
        if grep -q "axios.defaults.headers.common\['Authorization'\]" "$AUTH_CONTEXT"; then
            log_message "INFO" "Token is correctly set in axios headers"
        elif grep -q "interceptors" "$AUTH_CONTEXT" && grep -q "config.headers\['Authorization'\]" "$AUTH_CONTEXT"; then
            log_message "INFO" "Token is set using axios interceptors"
        else
            log_message "WARN" "Could not confirm token is being set in request headers"
        }
    fi
    
    # 3. Check for CORS configuration in backend
    if [ -d "$BACKEND_DIR" ]; then
        log_message "INFO" "Checking for CORS configuration in backend..."
        
        # Look for CORS setup in main server file
        SERVER_FILES=$(find "$BACKEND_DIR" -type f -name "*.js" | grep -E 'server|app|index')
        CORS_CONFIGURED=false
        
        for file in $SERVER_FILES; do
            if grep -q "cors" "$file"; then
                log_message "INFO" "CORS appears to be configured in $file"
                CORS_CONFIGURED=true
                
                # Check if CORS is configured correctly
                if grep -q "origin:" "$file" && grep -q "credentials: true" "$file"; then
                    log_message "INFO" "CORS configuration looks complete"
                else
                    log_message "WARN" "CORS may be missing important options"
                    
                    # Create a file with recommended CORS configuration
                    cat > cors-config-example.js << EOF
// Example of proper CORS configuration
const cors = require('cors');

// Basic CORS setup
app.use(cors());

// OR detailed CORS setup (recommended)
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3001',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // 24 hours
}));
EOF
                    log_message "INFO" "Created example CORS configuration file (cors-config-example.js)"
                fi
                
                break
            fi
        done
        
        if [ "$CORS_CONFIGURED" = false ]; then
            log_message "WARN" "Could not find CORS configuration in backend files"
            log_message "INFO" "Consider adding CORS middleware to your backend"
        fi
    fi
    
    log_message "INFO" "Advanced authentication debugging completed"
    log_message "INFO" "Check the logs for potential issues and recommendations"
}

# Main menu function
show_menu() {
    display_header
    echo -e "${CYAN}╔══════════════════════════════ MAIN MENU ═══════════════════════════╗${NC}"
    echo -e "${CYAN}║                                                                    ║${NC}"
    echo -e "${CYAN}║${NC}  ${GREEN}1.${NC} Check server status                                          ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  ${GREEN}2.${NC} Restart servers (with improved error handling)               ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  ${GREEN}3.${NC} Create enhanced cache clearer & auth debugging tool          ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  ${GREEN}4.${NC} Fix common authentication issues                             ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  ${GREEN}5.${NC} Add debugging to Login component                             ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  ${GREEN}6.${NC} Create test user account                                     ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  ${GREEN}7.${NC} Check/fix environment variables                              ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  ${GREEN}8.${NC} Run advanced authentication debugging                        ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  ${GREEN}9.${NC} View logs                                                    ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  ${GREEN}0.${NC} Exit                                                         ${CYAN}║${NC}"
    echo -e "${CYAN}║                                                                    ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════════╝${NC}"
    echo
}

# View logs function
view_logs() {
    if [ -d "$LOGS_DIR" ]; then
        if [ -f "$LOGS_DIR/debug.log" ]; then
            echo -e "${YELLOW}Debug Log:${NC}"
            cat "$LOGS_DIR/debug.log"
        else
            log_message "WARN" "Debug log file not found"
        fi
        
        echo # Empty line for separation
        
        if [ -f "$LOGS_DIR/backend.log" ]; then
            echo -e "${YELLOW}Backend Log (last 20 lines):${NC}"
            tail -n 20 "$LOGS_DIR/backend.log"
        fi
        
        echo # Empty line for separation
        
        if [ -f "$LOGS_DIR/frontend.log" ]; then