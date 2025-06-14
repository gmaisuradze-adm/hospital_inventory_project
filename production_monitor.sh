#!/bin/bash

# Production Monitoring Script for Hospital Inventory AI Module
# This script monitors all components and logs their status

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
LOG_DIR="/workspaces/hospital_inventory_project/logs"
MONITOR_LOG="$LOG_DIR/system_monitor.log"

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"

echo "[$TIMESTAMP] === SYSTEM HEALTH CHECK ===" >> "$MONITOR_LOG"

# Check Database
if pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
    echo "[$TIMESTAMP] ✅ Database: HEALTHY" >> "$MONITOR_LOG"
else
    echo "[$TIMESTAMP] ❌ Database: DOWN" >> "$MONITOR_LOG"
fi

# Check Backend API
if curl -s http://localhost:3001/api/health >/dev/null 2>&1; then
    echo "[$TIMESTAMP] ✅ Backend API: HEALTHY" >> "$MONITOR_LOG"
else
    echo "[$TIMESTAMP] ❌ Backend API: DOWN" >> "$MONITOR_LOG"
fi

# Check Frontend
if curl -s http://localhost:3000 >/dev/null 2>&1; then
    echo "[$TIMESTAMP] ✅ Frontend: HEALTHY" >> "$MONITOR_LOG"
else
    echo "[$TIMESTAMP] ❌ Frontend: DOWN" >> "$MONITOR_LOG"
fi

# Check AI Module
AI_HEALTH=$(echo '{"action": "health_check", "data": {}}' | python3 /workspaces/hospital_inventory_project/ai-module/integration_bridge.py 2>/dev/null | grep -o '"success":[^,]*' | cut -d':' -f2)
if [ "$AI_HEALTH" = "true" ]; then
    echo "[$TIMESTAMP] ✅ AI Module: HEALTHY" >> "$MONITOR_LOG"
else
    echo "[$TIMESTAMP] ⚠️  AI Module: LIMITED (fallback mode)" >> "$MONITOR_LOG"
fi

# System Resource Check
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
DISK_USAGE=$(df -h / | awk 'NR==2{printf "%s", $5}')

echo "[$TIMESTAMP] 📊 System Resources:" >> "$MONITOR_LOG"
echo "[$TIMESTAMP]    CPU: ${CPU_USAGE}%" >> "$MONITOR_LOG"
echo "[$TIMESTAMP]    Memory: ${MEMORY_USAGE}%" >> "$MONITOR_LOG"
echo "[$TIMESTAMP]    Disk: $DISK_USAGE" >> "$MONITOR_LOG"

# Process Count
BACKEND_PROCS=$(ps aux | grep -c "ts-node-dev.*src/index.ts" | head -1)
FRONTEND_PROCS=$(ps aux | grep -c "react-scripts start" | head -1)

echo "[$TIMESTAMP] 🔧 Process Count:" >> "$MONITOR_LOG"
echo "[$TIMESTAMP]    Backend processes: $BACKEND_PROCS" >> "$MONITOR_LOG"
echo "[$TIMESTAMP]    Frontend processes: $FRONTEND_PROCS" >> "$MONITOR_LOG"

echo "[$TIMESTAMP] === END HEALTH CHECK ===" >> "$MONITOR_LOG"
echo "" >> "$MONITOR_LOG"

# Display current status
echo "🏥 HOSPITAL INVENTORY SYSTEM STATUS"
echo "=================================="
tail -15 "$MONITOR_LOG"
