"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const socket_io_1 = require("socket.io");
const http_1 = require("http");
const errorHandler_1 = require("./middleware/errorHandler");
const logger_1 = require("./utils/logger");
const auth_1 = require("./routes/auth");
const users_1 = require("./routes/users");
const inventory_1 = require("./routes/inventory");
const procurement_1 = require("./routes/procurement");
const itRequests_1 = require("./routes/itRequests");
const forms_1 = require("./routes/forms");
const reports_1 = require("./routes/reports");
const notifications_1 = require("./routes/notifications");
const audit_1 = require("./routes/audit");
const dashboard_1 = require("./routes/dashboard");
const ai_1 = __importDefault(require("./routes/ai"));
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});
exports.io = io;
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true
}));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Socket.IO for real-time notifications
io.on('connection', (socket) => {
    logger_1.logger.info(`User connected: ${socket.id}`);
    socket.on('join', (userId) => {
        socket.join(`user_${userId}`);
        logger_1.logger.info(`User ${userId} joined room`);
    });
    socket.on('disconnect', () => {
        logger_1.logger.info(`User disconnected: ${socket.id}`);
    });
});
// Make io available in req object
app.use((req, res, next) => {
    req.io = io;
    next();
});
// Routes
app.use('/api/auth', auth_1.authRoutes);
app.use('/api/users', users_1.userRoutes);
app.use('/api/inventory', inventory_1.inventoryRoutes);
app.use('/api/procurement', procurement_1.procurementRoutes);
app.use('/api/it-requests', itRequests_1.itRequestRoutes);
app.use('/api/forms', forms_1.formRoutes);
app.use('/api/reports', reports_1.reportRoutes);
app.use('/api/notifications', notifications_1.notificationRoutes);
app.use('/api/audit', audit_1.auditRoutes);
app.use('/api/dashboard', dashboard_1.dashboardRoutes);
app.use('/api/ai', ai_1.default);
// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
// Error handling
app.use(errorHandler_1.errorHandler);
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
});
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    logger_1.logger.info(`Server running on port ${PORT}`);
});
//# sourceMappingURL=index.js.map