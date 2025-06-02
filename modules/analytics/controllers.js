const {
  ReportTemplate,
  SavedReport,
  Dashboard,
  DashboardWidget,
  AuditLog,
  AlertSubscription
} = require('./models');
const { sequelize, Sequelize } = require('../../core/database');
const { EventTypes } = require('../../core/events');
const { setupEventSystem } = require('../../core/events');
const configManager = require('../../core/config');

// Get event system instance
const eventSystem = setupEventSystem();
// Get config manager
const analyticsConfig = configManager.loadModuleConfig('analytics') || {};

// Current date for all operations
const currentDate = new Date('2025-06-01T20:34:54');

// Helper function to format date range
const getDateRange = (range = 'month') => {
  const endDate = new Date(currentDate);
  const startDate = new Date(currentDate);

  switch (range) {
    case 'day':
      startDate.setDate(startDate.getDate() - 1);
      break;
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'quarter':
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      // Custom range or default to month
      if (typeof range === 'number') {
        startDate.setDate(startDate.getDate() - range);
      } else {
        startDate.setMonth(startDate.getMonth() - 1);
      }
  }

  return { startDate, endDate };
};

// Create a new report template
exports.createReportTemplate = async (req, res) => {
  try {
    const { name, description, type, config, isPublic } = req.body;
    const creatorId = req.user.id;

    const reportTemplate = await ReportTemplate.create({
      name,
      description,
      type,
      config,
      isPublic,
      creatorId
    });

    // Create an audit log entry
    await AuditLog.create({
      eventType: 'report_template_created',
      entityType: 'report_template',
      entityId: reportTemplate.id,
      description: `Report template "${name}" created`,
      userId: creatorId,
      ipAddress: req.ip,
      timestamp: currentDate
    });

    res.status(201).json({
      success: true,
      data: reportTemplate
    });
  } catch (error) {
    console.error('Error creating report template:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get all report templates
exports.getReportTemplates = async (req, res) => {
  try {
    const { type, creatorId } = req.query;
    const where = {};

    // Filter by type if specified
    if (type) where.type = type;

    // Filter by creator if specified
    if (creatorId) where.creatorId = creatorId;

    // Users can see their own private templates and all public templates
    if (!req.user.roles.includes('admin')) {
      where[Sequelize.Op.or] = [
        { isPublic: true },
        { creatorId: req.user.id }
      ];
    }

    const templates = await ReportTemplate.findAll({
      where,
      include: [{
        model: sequelize.models.user,
        as: 'creator',
        attributes: ['id', 'username', 'firstName', 'lastName']
      }],
      order: [['name', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Error fetching report templates:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Generate report from template
exports.generateReport = async (req, res) => {
  try {
    const { templateId } = req.params;
    const { parameters, saveName, saveDescription } = req.body;
    const userId = req.user.id;

    // Find the report template
    const template = await ReportTemplate.findByPk(templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Report template not found'
      });
    }

    // Process report based on type
    let results;
    switch (template.type) {
      case 'inventory':
        results = await generateInventoryReport(template.config, parameters);
        break;
      case 'warehouse':
        results = await generateWarehouseReport(template.config, parameters);
        break;
      case 'service':
        results = await generateServiceReport(template.config, parameters);
        break;
      case 'requests':
        results = await generateRequestsReport(template.config, parameters);
        break;
      default:
        results = {
          error: 'Unsupported report type'
        };
    }

    // Save the report if requested
    let savedReport = null;
    if (saveName) {
      savedReport = await SavedReport.create({
        name: saveName,
        description: saveDescription || `Generated from ${template.name}`,
        parameters,
        results,
        generatedDate: currentDate,
        reportTemplateId: template.id,
        creatorId: userId
      });

      // Create audit log
      await AuditLog.create({
        eventType: 'report_generated',
        entityType: 'saved_report',
        entityId: savedReport.id,
        description: `Report "${saveName}" generated and saved`,
        userId,
        ipAddress: req.ip,
        timestamp: currentDate
      });
    }

    res.status(200).json({
      success: true,
      data: {
        reportName: template.name,
        parameters,
        results,
        savedReportId: savedReport ? savedReport.id : null,
        generatedAt: currentDate
      }
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Helper for generating inventory reports
async function generateInventoryReport(config, parameters) {
  const { Asset, AssetCategory } = require('../inventory/models');
  const { reportType, metrics = [] } = config;
  const { startDate, endDate } = parameters.dateRange ? 
    getDateRange(parameters.dateRange) : 
    { startDate: parameters.startDate ? new Date(parameters.startDate) : null, 
      endDate: parameters.endDate ? new Date(parameters.endDate) : new Date() };
  
  let results = {};
  
  switch (reportType) {
    case 'asset_status':
      // Count assets by status
      const statusCounts = await Asset.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status'],
        where: parameters.categoryId ? { assetCategoryId: parameters.categoryId } : {}
      });
      
      results = {
        statusDistribution: statusCounts.map(item => ({
          status: item.status,
          count: parseInt(item.get('count'))
        })),
        totalAssets: statusCounts.reduce((sum, item) => sum + parseInt(item.get('count')), 0)
      };
      break;
      
    case 'asset_health':
      // Count assets by health status
      const healthCounts = await Asset.findAll({
        attributes: [
          'healthStatus',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['healthStatus'],
        where: parameters.categoryId ? { assetCategoryId: parameters.categoryId } : {}
      });
      
      results = {
        healthDistribution: healthCounts.map(item => ({
          healthStatus: item.healthStatus || 'unknown',
          count: parseInt(item.get('count'))
        })),
        totalAssets: healthCounts.reduce((sum, item) => sum + parseInt(item.get('count')), 0)
      };
      break;
      
    case 'asset_assignment':
      // Count assigned vs unassigned assets
      const assignmentQuery = `
        SELECT 
          CASE WHEN "assignedToId" IS NULL THEN 'unassigned' ELSE 'assigned' END as assignment_status,
          COUNT(id) as count
        FROM assets
        WHERE 1=1
        ${parameters.categoryId ? `AND "assetCategoryId" = '${parameters.categoryId}'` : ''}
        GROUP BY assignment_status
      `;
      
      const [assignmentCounts] = await sequelize.query(assignmentQuery);
      
      results = {
        assignmentDistribution: assignmentCounts.map(item => ({
          status: item.assignment_status,
          count: parseInt(item.count)
        })),
        totalAssets: assignmentCounts.reduce((sum, item) => sum + parseInt(item.count), 0)
      };
      break;
      
    case 'asset_acquisition':
      // Count assets by acquisition date (grouped by month/quarter/year)
      const groupBy = parameters.groupBy || 'month';
      let dateFormat;
      
      switch (groupBy) {
        case 'month':
          dateFormat = "YYYY-MM";
          break;
        case 'quarter':
          dateFormat = "YYYY-'Q'Q";
          break;
        case 'year':
          dateFormat = "YYYY";
          break;
      }
      
      const acquisitionQuery = `
        SELECT 
          to_char("purchaseDate", '${dateFormat}') as time_period,
          COUNT(id) as count
        FROM assets
        WHERE "purchaseDate" IS NOT NULL
        ${startDate ? `AND "purchaseDate" >= '${startDate.toISOString()}'` : ''}
        ${endDate ? `AND "purchaseDate" <= '${endDate.toISOString()}'` : ''}
        ${parameters.categoryId ? `AND "assetCategoryId" = '${parameters.categoryId}'` : ''}
        GROUP BY time_period
        ORDER BY time_period
      `;
      
      const [acquisitionData] = await sequelize.query(acquisitionQuery);
      
      results = {
        acquisitionTrend: acquisitionData.map(item => ({
          period: item.time_period,
          count: parseInt(item.count)
        })),
        totalAssets: acquisitionData.reduce((sum, item) => sum + parseInt(item.count), 0)
      };
      break;
      
    default:
      results = { message: 'Unsupported inventory report type' };
  }
  
  return results;
}

// Helper for generating warehouse reports
async function generateWarehouseReport(config, parameters) {
  const { Item, Inventory, StockMovement } = require('../warehouse/models');
  const { reportType } = config;
  const { startDate, endDate } = parameters.dateRange ? 
    getDateRange(parameters.dateRange) : 
    { startDate: parameters.startDate ? new Date(parameters.startDate) : null, 
      endDate: parameters.endDate ? new Date(parameters.endDate) : new Date() };
  
  let results = {};
  
  switch (reportType) {
    case 'inventory_levels':
      // Get current inventory levels
      const inventoryQuery = `
        SELECT 
          i.name, 
          i.sku, 
          i.category,
          SUM(inv.quantity) as total_quantity,
          SUM(inv.reserved_quantity) as total_reserved,
          i."minimumStockLevel",
          i."reorderPoint"
        FROM items i
        LEFT JOIN inventories inv ON i.id = inv."itemId"
        ${parameters.category ? `WHERE i.category = '${parameters.category}'` : ''}
        GROUP BY i.id, i.name, i.sku, i.category, i."minimumStockLevel", i."reorderPoint"
        ORDER BY ${parameters.orderBy || 'i.name'} ${parameters.orderDirection || 'ASC'}
      `;
      
      const [inventoryLevels] = await sequelize.query(inventoryQuery);
      
      // Calculate statistics
      const totalItems = inventoryLevels.length;
      let lowStockItems = 0;
      let outOfStockItems = 0;
      
      inventoryLevels.forEach(item => {
        const available = (parseInt(item.total_quantity) || 0) - (parseInt(item.total_reserved) || 0);
        if (available <= 0) {
          outOfStockItems++;
        } else if (available <= parseInt(item.minimumStockLevel)) {
          lowStockItems++;
        }
        
        // Add available quantity to results
        item.available_quantity = available;
      });
      
      results = {
        inventoryItems: inventoryLevels,
        statistics: {
          totalItems,
          lowStockItems,
          outOfStockItems,
          normalStockItems: totalItems - lowStockItems - outOfStockItems
        }
      };
      break;
      
    case 'stock_movement':
      // Get stock movement history
      const movementQuery = `
        SELECT 
          sm.type,
          sm.quantity,
          sm."documentReference",
          sm.timestamp,
          i.name as item_name,
          i.sku
        FROM stock_movements sm
        JOIN inventories inv ON sm."inventoryId" = inv.id
        JOIN items i ON inv."itemId" = i.id
        WHERE sm.timestamp BETWEEN '${startDate.toISOString()}' AND '${endDate.toISOString()}'
        ${parameters.itemId ? `AND inv."itemId" = '${parameters.itemId}'` : ''}
        ${parameters.movementType ? `AND sm.type = '${parameters.movementType}'` : ''}
        ORDER BY sm.timestamp DESC
      `;
      
      const [movements] = await sequelize.query(movementQuery);
      
      // Calculate statistics by movement type
      const movementStats = {};
      let totalQuantity = 0;
      
      movements.forEach(movement => {
        const type = movement.type;
        const quantity = parseInt(movement.quantity);
        
        if (!movementStats[type]) {
          movementStats[type] = {
            count: 0,
            totalQuantity: 0
          };
        }
        
        movementStats[type].count++;
        movementStats[type].totalQuantity += quantity;
        totalQuantity += quantity;
      });
      
      results = {
        movements,
        statistics: {
          totalMovements: movements.length,
          totalQuantity,
          byType: movementStats
        }
      };
      break;
      
    case 'consumption_trend':
      // Analyze consumption trends over time
      const timeGrouping = parameters.groupBy || 'day';
      let timeFormat;
      
      switch (timeGrouping) {
        case 'day':
          timeFormat = 'YYYY-MM-DD';
          break;
        case 'week':
          timeFormat = 'IYYY-IW'; // ISO year and week
          break;
        case 'month':
          timeFormat = 'YYYY-MM';
          break;
      }
      
      const consumptionQuery = `
        SELECT 
          to_char(sm.timestamp, '${timeFormat}') as time_period,
          SUM(CASE WHEN sm.type = 'issue' THEN sm.quantity ELSE 0 END) as issue_quantity,
          SUM(CASE WHEN sm.type = 'receipt' THEN sm.quantity ELSE 0 END) as receipt_quantity,
          COUNT(DISTINCT CASE WHEN sm.type = 'issue' THEN sm.id END) as issue_count,
          COUNT(DISTINCT CASE WHEN sm.type = 'receipt' THEN sm.id END) as receipt_count
        FROM stock_movements sm
        JOIN inventories inv ON sm."inventoryId" = inv.id
        JOIN items i ON inv."itemId" = i.id
        WHERE sm.timestamp BETWEEN '${startDate.toISOString()}' AND '${endDate.toISOString()}'
        ${parameters.itemId ? `AND inv."itemId" = '${parameters.itemId}'` : ''}
        ${parameters.category ? `AND i.category = '${parameters.category}'` : ''}
        GROUP BY time_period
        ORDER BY time_period
      `;
      
      const [consumptionData] = await sequelize.query(consumptionQuery);
      
      results = {
        trends: consumptionData,
        summary: {
          totalPeriods: consumptionData.length,
          totalIssued: consumptionData.reduce((sum, period) => sum + parseInt(period.issue_quantity || 0), 0),
          totalReceived: consumptionData.reduce((sum, period) => sum + parseInt(period.receipt_quantity || 0), 0),
          averageIssuePerPeriod: Math.round(consumptionData.reduce((sum, period) => sum + parseInt(period.issue_quantity || 0), 0) / Math.max(consumptionData.length, 1))
        }
      };
      break;
      
    default:
      results = { message: 'Unsupported warehouse report type' };
  }
  
  return results;
}

// Helper for generating service management reports
async function generateServiceReport(config, parameters) {
  const { Incident, MaintenanceEvent } = require('../service-management/models');
  const { reportType } = config;
  const { startDate, endDate } = parameters.dateRange ? 
    getDateRange(parameters.dateRange) : 
    { startDate: parameters.startDate ? new Date(parameters.startDate) : null, 
      endDate: parameters.endDate ? new Date(parameters.endDate) : new Date() };
  
  let results = {};
  
  switch (reportType) {
    case 'incident_summary':
      // Summary of incidents
      const incidentQuery = `
        SELECT 
          i.status,
          i.priority,
          COUNT(i.id) as count,
          AVG(EXTRACT(EPOCH FROM (i."resolvedDate" - i."reportedDate"))/3600) as avg_resolution_time_hours
        FROM incidents i
        WHERE i."reportedDate" BETWEEN '${startDate.toISOString()}' AND '${endDate.toISOString()}'
        GROUP BY i.status, i.priority
        ORDER BY i.priority, i.status
      `;
      
      const [incidentSummary] = await sequelize.query(incidentQuery);
      
      // Calculate total incidents
      const totalIncidents = incidentSummary.reduce((sum, row) => sum + parseInt(row.count), 0);
      
      // Calculate resolution rate
      const resolvedIncidents = incidentSummary
        .filter(row => row.status === 'Resolved' || row.status === 'Closed')
        .reduce((sum, row) => sum + parseInt(row.count), 0);
      
      const resolutionRate = totalIncidents > 0 ? (resolvedIncidents / totalIncidents * 100).toFixed(2) : 0;
      
      results = {
        summary: incidentSummary,
        statistics: {
          totalIncidents,
          resolvedIncidents,
          resolutionRate: parseFloat(resolutionRate),
          byPriority: incidentSummary.reduce((acc, row) => {
            if (!acc[row.priority]) {
              acc[row.priority] = 0;
            }
            acc[row.priority] += parseInt(row.count);
            return acc;
          }, {})
        }
      };
      break;
      
    case 'maintenance_compliance':
      // Maintenance compliance report
      const maintenanceQuery = `
        SELECT 
          me.status,
          COUNT(me.id) as count,
          SUM(CASE WHEN me."actualEndDate" <= me."scheduledEndDate" THEN 1 ELSE 0 END) as on_time_count,
          AVG(EXTRACT(EPOCH FROM (me."actualEndDate" - me."scheduledEndDate"))/3600) as avg_delay_hours
        FROM maintenance_events me
        WHERE me."scheduledStartDate" BETWEEN '${startDate.toISOString()}' AND '${endDate.toISOString()}'
        GROUP BY me.status
      `;
      
      const [maintenanceData] = await sequelize.query(maintenanceQuery);
      
      // Calculate compliance rate
      const totalScheduled = maintenanceData.reduce((sum, row) => sum + parseInt(row.count), 0);
      const completedMaintenance = maintenanceData.find(row => row.status === 'completed');
      const completedCount = completedMaintenance ? parseInt(completedMaintenance.count) : 0;
      const onTimeCount = completedMaintenance ? parseInt(completedMaintenance.on_time_count) : 0;
      
      const completionRate = totalScheduled > 0 ? (completedCount / totalScheduled * 100).toFixed(2) : 0;
      const onTimeRate = completedCount > 0 ? (onTimeCount / completedCount * 100).toFixed(2) : 0;
      
      results = {
        maintenanceByStatus: maintenanceData,
        statistics: {
          totalScheduled,
          completed: completedCount,
          completionRate: parseFloat(completionRate),
          onTimeCompletion: onTimeCount,
          onTimeRate: parseFloat(onTimeRate)
        }
      };
      break;
      
    case 'sla_compliance':
      // SLA compliance report
      const slaQuery = `
        SELECT 
          i.priority,
          COUNT(i.id) as incident_count,
          SUM(CASE WHEN st."responseStatus" = 'on-time' THEN 1 ELSE 0 END) as response_in_sla,
          SUM(CASE WHEN st."resolutionStatus" = 'on-time' THEN 1 ELSE 0 END) as resolution_in_sla
        FROM incidents i
        JOIN sla_trackings st ON i.id = st."incidentId"
        WHERE i."reportedDate" BETWEEN '${startDate.toISOString()}' AND '${endDate.toISOString()}'
          AND i.status IN ('Resolved', 'Closed')
        GROUP BY i.priority
        ORDER BY 
          CASE 
            WHEN i.priority = 'Critical' THEN 1
            WHEN i.priority = 'High' THEN 2
            WHEN i.priority = 'Medium' THEN 3
            WHEN i.priority = 'Low' THEN 4
            ELSE 5
          END
      `;
      
      const [slaData] = await sequelize.query(slaQuery);
      
      // Calculate overall SLA metrics
      const totalResolved = slaData.reduce((sum, row) => sum + parseInt(row.incident_count), 0);
      const totalResponseInSLA = slaData.reduce((sum, row) => sum + parseInt(row.response_in_sla), 0);
      const totalResolutionInSLA = slaData.reduce((sum, row) => sum + parseInt(row.resolution_in_sla), 0);
      
      const responseComplianceRate = totalResolved > 0 ? (totalResponseInSLA / totalResolved * 100).toFixed(2) : 0;
      const resolutionComplianceRate = totalResolved > 0 ? (totalResolutionInSLA / totalResolved * 100).toFixed(2) : 0;
      
      results = {
        slaByPriority: slaData.map(row => ({
          priority: row.priority,
          incidentCount: parseInt(row.incident_count),
          responseInSLA: parseInt(row.response_in_sla),
          resolutionInSLA: parseInt(row.resolution_in_sla),
          responseComplianceRate: parseFloat((parseInt(row.response_in_sla) / parseInt(row.incident_count) * 100).toFixed(2)),
          resolutionComplianceRate: parseFloat((parseInt(row.resolution_in_sla) / parseInt(row.incident_count) * 100).toFixed(2))
        })),
        overall: {
          totalIncidents: totalResolved,
          responseCompliance: parseFloat(responseComplianceRate),
          resolutionCompliance: parseFloat(resolutionComplianceRate)
        }
      };
      break;
      
    default:
      results = { message: 'Unsupported service report type' };
  }
  
  return results;
}

// Helper for generating request management reports
async function generateRequestsReport(config, parameters) {
  const { Request, RequestItem } = require('../requests/models');
  const { reportType } = config;
  const { startDate, endDate } = parameters.dateRange ? 
    getDateRange(parameters.dateRange) : 
    { startDate: parameters.startDate ? new Date(parameters.startDate) : null, 
      endDate: parameters.endDate ? new Date(parameters.endDate) : new Date() };
  
  let results = {};
  
  switch (reportType) {
    case 'request_volume':
      // Request volume report
      const timeGrouping = parameters.groupBy || 'day';
      let timeFormat;
      
      switch (timeGrouping) {
        case 'day':
          timeFormat = 'YYYY-MM-DD';
          break;
        case 'week':
          timeFormat = 'IYYY-IW'; // ISO year and week
          break;
        case 'month':
          timeFormat = 'YYYY-MM';
          break;
      }
      
      const volumeQuery = `
        SELECT 
          to_char(r."submitDate", '${timeFormat}') as time_period,
          r.type,
          COUNT(r.id) as request_count
        FROM requests r
        WHERE r."submitDate" BETWEEN '${startDate.toISOString()}' AND '${endDate.toISOString()}'
        ${parameters.type ? `AND r.type = '${parameters.type}'` : ''}
        GROUP BY time_period, r.type
        ORDER BY time_period, r.type
      `;
      
      const [volumeData] = await sequelize.query(volumeQuery);
      
      // Process data for easier consumption
      const uniquePeriods = [...new Set(volumeData.map(row => row.time_period))].sort();
      const requestTypes = [...new Set(volumeData.map(row => row.type))];
      
      const seriesData = requestTypes.map(type => {
        return {
          type,
          data: uniquePeriods.map(period => {
            const match = volumeData.find(row => row.time_period === period && row.type === type);
            return match ? parseInt(match.request_count) : 0;
          })
        };
      });
      
      results = {
        timePeriods: uniquePeriods,
        series: seriesData,
        totals: {
          byType: requestTypes.reduce((acc, type) => {
            acc[type] = seriesData.find(s => s.type === type).data.reduce((sum, val) => sum + val, 0);
            return acc;
          }, {}),
          overall: volumeData.reduce((sum, row) => sum + parseInt(row.request_count), 0)
        }
      };
      break;
      
    case 'request_completion':
      // Request completion and turnaround time
      const completionQuery = `
        SELECT 
          r.type,
          r.status,
          COUNT(r.id) as count,
          AVG(EXTRACT(EPOCH FROM (r."completedDate" - r."submitDate"))/3600) as avg_turnaround_hours
        FROM requests r
        WHERE r."submitDate" BETWEEN '${startDate.toISOString()}' AND '${endDate.toISOString()}'
        ${parameters.type ? `AND r.type = '${parameters.type}'` : ''}
        GROUP BY r.type, r.status
        ORDER BY r.type, r.status
      `;
      
      const [completionData] = await sequelize.query(completionQuery);
      
      // Calculate completion rates
      const requestsByType = {};
      
      completionData.forEach(row => {
        if (!requestsByType[row.type]) {
          requestsByType[row.type] = {
            total: 0,
            completed: 0,
            avgTurnaround: 0,
            statuses: {}
          };
        }
        
        const count = parseInt(row.count);
        requestsByType[row.type].total += count;
        requestsByType[row.type].statuses[row.status] = count;
        
        if (row.status === 'Completed') {
          requestsByType[row.type].completed = count;
          requestsByType[row.type].avgTurnaround = parseFloat(row.avg_turnaround_hours);
        }
      });
      
      // Add completion rates
      Object.keys(requestsByType).forEach(type => {
        const typeData = requestsByType[type];
        typeData.completionRate = typeData.total > 0 ? 
          (typeData.completed / typeData.total * 100).toFixed(2) : 0;
      });
      
      results = {
        byType: requestsByType,
        overall: {
          totalRequests: Object.values(requestsByType).reduce((sum, type) => sum + type.total, 0),
          completedRequests: Object.values(requestsByType).reduce((sum, type) => sum + type.completed, 0),
          overallCompletionRate: Object.values(requestsByType).reduce((sum, type) => sum + type.total, 0) > 0 ?
            (Object.values(requestsByType).reduce((sum, type) => sum + type.completed, 0) / 
             Object.values(requestsByType).reduce((sum, type) => sum + type.total, 0) * 100).toFixed(2) : 0,
          avgTurnaroundTime: Object.values(requestsByType)
            .filter(type => type.completed > 0)
            .reduce((sum, type) => sum + type.avgTurnaround * type.completed, 0) /
            Object.values(requestsByType).reduce((sum, type) => sum + type.completed, 0)
        }
      };
      break;
      
    case 'most_requested_items':
      // Most frequently requested items
      const itemsQuery = `
        SELECT 
          i.name as item_name,
          i.sku,
          i.category,
          COUNT(ri.id) as request_count,
          SUM(ri.quantity) as total_quantity
        FROM request_items ri
        JOIN requests r ON ri."requestId" = r.id
        JOIN items i ON ri."itemId" = i.id
        WHERE r."submitDate" BETWEEN '${startDate.toISOString()}' AND '${endDate.toISOString()}'
        ${parameters.category ? `AND i.category = '${parameters.category}'` : ''}
        GROUP BY i.id, i.name, i.sku, i.category
        ORDER BY request_count DESC
        LIMIT ${parameters.limit || 10}
      `;
      
      const [itemsData] = await sequelize.query(itemsQuery);
      
      results = {
        topRequestedItems: itemsData.map(row => ({
          itemName: row.item_name,
          sku: row.sku,
          category: row.category,
          requestCount: parseInt(row.request_count),
          totalQuantity: parseInt(row.total_quantity)
        }))
      };
      break;
      
    default:
      results = { message: 'Unsupported requests report type' };
  }
  
  return results;
}

// Create a new dashboard
exports.createDashboard = async (req, res) => {
  try {
    const { name, description, layout, isDefault } = req.body;
    const ownerId = req.user.id;

    const dashboard = await Dashboard.create({
      name,
      description,
      layout: layout || [],
      isDefault: isDefault || false,
      ownerId
    });

    // Create an audit log entry
    await AuditLog.create({
      eventType: 'dashboard_created',
      entityType: 'dashboard',
      entityId: dashboard.id,
      description: `Dashboard "${name}" created`,
      userId: ownerId,
      ipAddress: req.ip,
      timestamp: currentDate
    });

    res.status(201).json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    console.error('Error creating dashboard:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get all dashboards
exports.getDashboards = async (req, res) => {
  try {
    const { isDefault } = req.query;
    const userId = req.user.id;
    
    const where = {};
    
    // Filter by default status if specified
    if (isDefault !== undefined) {
      where.isDefault = isDefault === 'true';
    }
    
    // Users can see their own dashboards and default ones
    if (!req.user.roles.includes('admin')) {
      where[Sequelize.Op.or] = [
        { isDefault: true },
        { ownerId: userId }
      ];
    }

    const dashboards = await Dashboard.findAll({
      where,
      include: [{
        model: sequelize.models.user,
        as: 'owner',
        attributes: ['id', 'username', 'firstName', 'lastName']
      }],
      order: [['name', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: dashboards
    });
  } catch (error) {
    console.error('Error fetching dashboards:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get dashboard with widgets
exports.getDashboardById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const dashboard = await Dashboard.findByPk(id, {
      include: [
        {
          model: sequelize.models.user,
          as: 'owner',
          attributes: ['id', 'username', 'firstName', 'lastName']
        },
        {
          model: DashboardWidget,
          separate: true,
          order: [['createdAt', 'ASC']]
        }
      ]
    });

    if (!dashboard) {
      return res.status(404).json({
        success: false,
        error: 'Dashboard not found'
      });
    }

    // Check access permissions
    if (!dashboard.isDefault && dashboard.ownerId !== userId && !req.user.roles.includes('admin')) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to access this dashboard'
      });
    }

    // Collect widget data
    const widgetData = await Promise.all(
      dashboard.dashboard_widgets.map(async widget => {
        // Fetch data for each widget based on its type and data source
        let data = {};
        
        try {
          switch (widget.type) {
            case 'chart':
            case 'table':
            case 'metric':
              data = await fetchWidgetData(widget.dataSource, widget.params);
              break;
            default:
              data = { message: 'Unsupported widget type' };
          }
        } catch (error) {
          console.error(`Error fetching data for widget ${widget.id}:`, error);
          data = { error: 'Failed to fetch widget data' };
        }
        
        return {
          ...widget.get({ plain: true }),
          data
        };
      })
    );

    const result = {
      ...dashboard.get({ plain: true }),
      widgets: widgetData
    };
    
    delete result.dashboard_widgets;

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Helper for fetching widget data
async function fetchWidgetData(dataSource, params) {
  // Handle different data sources
  switch (dataSource) {
    case 'inventory_status':
      return fetchInventoryStatusData(params);
    case 'warehouse_stock_levels':
      return fetchWarehouseStockData(params);
    case 'service_incidents':
      return fetchServiceIncidentsData(params);
    case 'requests_summary':
      return fetchRequestsSummaryData(params);
    default:
      return { message: 'Unknown data source' };
  }
}

// Data source helpers for widgets
async function fetchInventoryStatusData(params) {
  const { Asset } = require('../inventory/models');
  const { timeRange } = params;
  
  // Count assets by status
  const statusCounts = await Asset.findAll({
    attributes: [
      'status',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    group: ['status']
  });
  
  return {
    data: statusCounts.map(item => ({
      status: item.status,
      count: parseInt(item.get('count'))
    })),
    updated: new Date()
  };
}

async function fetchWarehouseStockData(params) {
  const { Item, Inventory } = require('../warehouse/models');
  const { threshold = 10, limit = 5 } = params;
  
  // Get low stock items
  const query = `
    SELECT 
      i.name, 
      i.sku, 
      SUM(inv.quantity) as total_quantity,
      SUM(inv.reserved_quantity) as reserved_quantity,
      i."minimumStockLevel",
      i."reorderPoint"
    FROM items i
    JOIN inventories inv ON i.id = inv."itemId"
    GROUP BY i.id, i.name, i.sku, i."minimumStockLevel", i."reorderPoint"
    HAVING (SUM(inv.quantity) - SUM(inv.reserved_quantity)) <= ${threshold}
    ORDER BY (SUM(inv.quantity) - SUM(inv.reserved_quantity)) ASC
    LIMIT ${limit}
  `;
  
  const [lowStockItems] = await sequelize.query(query);
  
  return {
    lowStockItems: lowStockItems.map(item => ({
      name: item.name,
      sku: item.sku,
      availableQuantity: (parseInt(item.total_quantity) || 0) - (parseInt(item.reserved_quantity) || 0),
      minimumStockLevel: parseInt(item.minimumStockLevel),
      reorderPoint: parseInt(item.reorderPoint)
    })),
    updated: new Date()
  };
}

async function fetchServiceIncidentsData(params) {
  const { Incident } = require('../service-management/models');
  const { status, priority, limit = 5 } = params;
  
  const where = {};
  if (status) where.status = status;
  if (priority) where.priority = priority;
  
  const incidents = await Incident.findAll({
    where,
    attributes: ['id', 'title', 'status', 'priority', 'reportedDate'],
    include: [
      {
        model: sequelize.models.user,
        as: 'assignee',
        attributes: ['id', 'username', 'firstName', 'lastName']
      }
    ],
    limit,
    order: [['reportedDate', 'DESC']]
  });
  
  return {
    incidents: incidents.map(incident => ({
      id: incident.id,
      title: incident.title,
      status: incident.status,
      priority: incident.priority,
      reportedDate: incident.reportedDate,
      assignee: incident.assignee ? `${incident.assignee.firstName} ${incident.assignee.lastName}` : 'Unassigned'
    })),
    updated: new Date()
  };
}

async function fetchRequestsSummaryData(params) {
  const { Request } = require('../requests/models');
  const { timeRange = 'week' } = params;
  
  const { startDate, endDate } = getDateRange(timeRange);
  
  const query = `
    SELECT 
      status,
      COUNT(*) as count
    FROM requests
    WHERE "submitDate" BETWEEN '${startDate.toISOString()}' AND '${endDate.toISOString()}'
    GROUP BY status
  `;
  
  const [statusSummary] = await sequelize.query(query);
  
  return {
    summary: statusSummary.map(item => ({
      status: item.status,
      count: parseInt(item.count)
    })),
    timeRange,
    updated: new Date()
  };
}

// Add widget to dashboard
exports.addWidgetToDashboard = async (req, res) => {
  try {
    const { dashboardId } = req.params;
    const { type, title, dataSource, params, position } = req.body;
    const userId = req.user.id;

    // Check if dashboard exists and user has permission
    const dashboard = await Dashboard.findByPk(dashboardId);
    
    if (!dashboard) {
      return res.status(404).json({
        success: false,
        error: 'Dashboard not found'
      });
    }
    
    if (dashboard.ownerId !== userId && !req.user.roles.includes('admin')) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to modify this dashboard'
      });
    }

    // Create widget
    const widget = await DashboardWidget.create({
      type,
      title,
      dataSource,
      params: params || {},
      position: position || { x: 0, y: 0, w: 6, h: 4 },
      dashboardId
    });

    // Create an audit log entry
    await AuditLog.create({
      eventType: 'dashboard_widget_added',
      entityType: 'dashboard_widget',
      entityId: widget.id,
      description: `Widget "${title}" added to dashboard "${dashboard.name}"`,
      userId,
      ipAddress: req.ip,
      timestamp: currentDate
    });

    res.status(201).json({
      success: true,
      data: widget
    });
  } catch (error) {
    console.error('Error adding widget to dashboard:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get audit logs with filtering
exports.getAuditLogs = async (req, res) => {
  try {
    const {
      eventType,
      entityType,
      entityId,
      userId,
      startDate,
      endDate,
      limit = 50,
      offset = 0
    } = req.query;
    
    // Build where conditions
    const where = {};
    
    if (eventType) where.eventType = eventType;
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (userId) where.userId = userId;
    
    // Date filtering
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp[Sequelize.Op.gte] = new Date(startDate);
      if (endDate) where.timestamp[Sequelize.Op.lte] = new Date(endDate);
    }
    
    // Enforce access restrictions for non-admin users
    if (!req.user.roles.includes('admin')) {
      // Limit access to sensitive audit logs for regular users
      where[Sequelize.Op.or] = [
        { userId: req.user.id }, // User can see their own actions
        { entityType: { [Sequelize.Op.notIn]: ['user', 'permission'] } } // Hide user management audit logs
      ];
    }
    
    // Fetch audit logs
    const { count, rows: logs } = await AuditLog.findAndCountAll({
      where,
      include: [{
        model: sequelize.models.user,
        as: 'user',
        attributes: ['id', 'username', 'firstName', 'lastName']
      }],
      order: [['timestamp', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.status(200).json({
      success: true,
      count,
      data: logs
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Create alert subscription
exports.createAlertSubscription = async (req, res) => {
  try {
    const { alertType, conditions, notificationChannel } = req.body;
    const subscriberId = req.user.id;
    
    const subscription = await AlertSubscription.create({
      alertType,
      conditions,
      notificationChannel,
      subscriberId
    });
    
    // Create an audit log entry
    await AuditLog.create({
      eventType: 'alert_subscription_created',
      entityType: 'alert_subscription',
      entityId: subscription.id,
      description: `Alert subscription created for ${alertType}`,
      userId: subscriberId,
      ipAddress: req.ip,
      timestamp: currentDate
    });
    
    res.status(201).json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.error('Error creating alert subscription:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get user's alert subscriptions
exports.getUserAlertSubscriptions = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    
    // Check permissions - users can only view their own subscriptions unless admin
    if (userId !== req.user.id && !req.user.roles.includes('admin')) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to view these alert subscriptions'
      });
    }
    
    const subscriptions = await AlertSubscription.findAll({
      where: { subscriberId: userId },
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      data: subscriptions
    });
  } catch (error) {
    console.error('Error fetching alert subscriptions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};/**
 * Additional controller methods to implement all route handlers
 * This file includes all missing methods that need to be added to controllers.js
 */

// Get a single report template by ID
exports.getReportTemplateById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const template = await ReportTemplate.findByPk(id, {
      include: [{
        model: sequelize.models.user,
        as: 'creator',
        attributes: ['id', 'username', 'firstName', 'lastName']
      }]
    });
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Report template not found'
      });
    }
    
    // Check if user has access (private templates are only visible to creator or admin)
    if (!template.isPublic && 
        template.creatorId !== req.user.id && 
        !req.user.roles.includes('admin')) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to access this template'
      });
    }
    
    res.status(200).json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Error fetching report template:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update a report template
exports.updateReportTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, type, config, isPublic } = req.body;
    
    const template = await ReportTemplate.findByPk(id);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Report template not found'
      });
    }
    
    // Check if user has permission
    if (template.creatorId !== req.user.id && !req.user.roles.includes('admin')) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to update this template'
      });
    }
    
    // Update template fields
    await template.update({
      name: name || template.name,
      description: description !== undefined ? description : template.description,
      type: type || template.type,
      config: config || template.config,
      isPublic: isPublic !== undefined ? isPublic : template.isPublic
    });
    
    // Create audit log entry
    await AuditLog.create({
      eventType: 'report_template_updated',
      entityType: 'report_template',
      entityId: template.id,
      description: `Report template "${template.name}" updated`,
      userId: req.user.id,
      ipAddress: req.ip,
      timestamp: currentDate
    });
    
    res.status(200).json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Error updating report template:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Delete a report template
exports.deleteReportTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    
    const template = await ReportTemplate.findByPk(id);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Report template not found'
      });
    }
    
    // Check if user has permission
    if (template.creatorId !== req.user.id && !req.user.roles.includes('admin')) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to delete this template'
      });
    }
    
    // Store template name for audit log
    const templateName = template.name;
    
    // Delete template
    await template.destroy();
    
    // Create audit log entry
    await AuditLog.create({
      eventType: 'report_template_deleted',
      entityType: 'report_template',
      entityId: id,
      description: `Report template "${templateName}" deleted`,
      userId: req.user.id,
      ipAddress: req.ip,
      timestamp: currentDate
    });
    
    res.status(200).json({
      success: true,
      message: 'Report template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting report template:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get all saved reports for current user
exports.getSavedReports = async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.roles.includes('admin');
    
    // Build query conditions
    let where = {};
    if (!isAdmin) {
      where.creatorId = userId;
    }
    
    if (req.query.templateId) {
      where.reportTemplateId = req.query.templateId;
    }
    
    const reports = await SavedReport.findAll({
      where,
      include: [
        {
          model: ReportTemplate,
          attributes: ['id', 'name', 'type']
        },
        {
          model: sequelize.models.user,
          as: 'creator',
          attributes: ['id', 'username', 'firstName', 'lastName']
        }
      ],
      order: [['generatedDate', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error('Error fetching saved reports:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get a single saved report by ID
exports.getSavedReportById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.roles.includes('admin');
    
    const report = await SavedReport.findByPk(id, {
      include: [
        {
          model: ReportTemplate,
          attributes: ['id', 'name', 'type', 'config']
        },
        {
          model: sequelize.models.user,
          as: 'creator',
          attributes: ['id', 'username', 'firstName', 'lastName']
        }
      ]
    });
    
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Saved report not found'
      });
    }
    
    // Check if user has permission
    if (!isAdmin && report.creatorId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to view this report'
      });
    }
    
    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error fetching saved report:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Delete a saved report
exports.deleteSavedReport = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.roles.includes('admin');
    
    const report = await SavedReport.findByPk(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Saved report not found'
      });
    }
    
    // Check if user has permission
    if (!isAdmin && report.creatorId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to delete this report'
      });
    }
    
    // Store report name for audit log
    const reportName = report.name;
    
    // Delete report
    await report.destroy();
    
    // Create audit log entry
    await AuditLog.create({
      eventType: 'saved_report_deleted',
      entityType: 'saved_report',
      entityId: id,
      description: `Saved report "${reportName}" deleted`,
      userId: req.user.id,
      ipAddress: req.ip,
      timestamp: currentDate
    });
    
    res.status(200).json({
      success: true,
      message: 'Saved report deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting saved report:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Create a new dashboard
exports.createDashboard = async (req, res) => {
  try {
    const { name, description, isDefault } = req.body;
    const ownerId = req.user.id;
    
    // Check if a default dashboard already exists for this user
    if (isDefault) {
      const existingDefault = await Dashboard.findOne({
        where: {
          ownerId,
          isDefault: true
        }
      });
      
      if (existingDefault) {
        // Remove default status from existing dashboard
        await existingDefault.update({ isDefault: false });
      }
    }
    
    const dashboard = await Dashboard.create({
      name,
      description,
      layout: [],
      isDefault: isDefault || false,
      ownerId
    });
    
    // Create audit log entry
    await AuditLog.create({
      eventType: 'dashboard_created',
      entityType: 'dashboard',
      entityId: dashboard.id,
      description: `Dashboard "${name}" created`,
      userId: ownerId,
      ipAddress: req.ip,
      timestamp: currentDate
    });
    
    res.status(201).json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    console.error('Error creating dashboard:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get all dashboards for current user
exports.getDashboards = async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.roles.includes('admin');
    
    // Build query conditions
    let where = {};
    if (!isAdmin) {
      where.ownerId = userId;
    }
    
    const dashboards = await Dashboard.findAll({
      where,
      include: [{
        model: sequelize.models.user,
        as: 'owner',
        attributes: ['id', 'username', 'firstName', 'lastName']
      }],
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      data: dashboards
    });
  } catch (error) {
    console.error('Error fetching dashboards:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get a single dashboard by ID with widgets
exports.getDashboardById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.roles.includes('admin');
    
    const dashboard = await Dashboard.findByPk(id, {
      include: [
        {
          model: sequelize.models.user,
          as: 'owner',
          attributes: ['id', 'username', 'firstName', 'lastName']
        },
        {
          model: DashboardWidget,
          as: 'widgets'
        }
      ]
    });
    
    if (!dashboard) {
      return res.status(404).json({
        success: false,
        error: 'Dashboard not found'
      });
    }
    
    // Check if user has permission to view dashboard
    if (!isAdmin && dashboard.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to view this dashboard'
      });
    }
    
    res.status(200).json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update a dashboard
exports.updateDashboard = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, layout, isDefault } = req.body;
    const userId = req.user.id;
    const isAdmin = req.user.roles.includes('admin');
    
    const dashboard = await Dashboard.findByPk(id);
    if (!dashboard) {
      return res.status(404).json({
        success: false,
        error: 'Dashboard not found'
      });
    }
    
    // Check if user has permission
    if (!isAdmin && dashboard.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to update this dashboard'
      });
    }
    
    // If setting this dashboard as default, remove default from other dashboards
    if (isDefault && !dashboard.isDefault) {
      const existingDefault = await Dashboard.findOne({
        where: {
          ownerId: userId,
          isDefault: true,
          id: { [Sequelize.Op.ne]: id }
        }
      });
      
      if (existingDefault) {
        await existingDefault.update({ isDefault: false });
      }
    }
    
    // Update dashboard fields
    await dashboard.update({
      name: name || dashboard.name,
      description: description !== undefined ? description : dashboard.description,
      layout: layout || dashboard.layout,
      isDefault: isDefault !== undefined ? isDefault : dashboard.isDefault
    });
    
    // Create audit log entry
    await AuditLog.create({
      eventType: 'dashboard_updated',
      entityType: 'dashboard',
      entityId: dashboard.id,
      description: `Dashboard "${dashboard.name}" updated`,
      userId: req.user.id,
      ipAddress: req.ip,
      timestamp: currentDate
    });
    
    res.status(200).json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    console.error('Error updating dashboard:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Delete a dashboard
exports.deleteDashboard = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.roles.includes('admin');
    
    const dashboard = await Dashboard.findByPk(id);
    if (!dashboard) {
      return res.status(404).json({
        success: false,
        error: 'Dashboard not found'
      });
    }
    
    // Check if user has permission
    if (!isAdmin && dashboard.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to delete this dashboard'
      });
    }
    
    // Store dashboard name for audit log
    const dashboardName = dashboard.name;
    
    // Delete dashboard and its widgets
    await dashboard.destroy();
    
    // Create audit log entry
    await AuditLog.create({
      eventType: 'dashboard_deleted',
      entityType: 'dashboard',
      entityId: id,
      description: `Dashboard "${dashboardName}" deleted`,
      userId: req.user.id,
      ipAddress: req.ip,
      timestamp: currentDate
    });
    
    res.status(200).json({
      success: true,
      message: 'Dashboard deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting dashboard:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Add a widget to a dashboard
exports.addWidgetToDashboard = async (req, res) => {
  try {
    const { dashboardId } = req.params;
    const { type, title, dataSource, params, refreshInterval, position } = req.body;
    const userId = req.user.id;
    const isAdmin = req.user.roles.includes('admin');
    
    // Check if dashboard exists and user has permission
    const dashboard = await Dashboard.findByPk(dashboardId);
    if (!dashboard) {
      return res.status(404).json({
        success: false,
        error: 'Dashboard not found'
      });
    }
    
    if (!isAdmin && dashboard.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to modify this dashboard'
      });
    }
    
    // Create widget
    const widget = await DashboardWidget.create({
      type,
      title,
      dataSource,
      params: params || {},
      refreshInterval: refreshInterval || 60,
      position: position || { x: 0, y: 0, w: 6, h: 4 },
      dashboardId
    });
    
    // Update dashboard layout to include new widget
    let layout = dashboard.layout || [];
    layout.push({
      i: widget.id,
      x: position?.x || 0,
      y: position?.y || 0,
      w: position?.w || 6,
      h: position?.h || 4
    });
    
    await dashboard.update({ layout });
    
    // Create audit log entry
    await AuditLog.create({
      eventType: 'dashboard_widget_added',
      entityType: 'dashboard_widget',
      entityId: widget.id,
      description: `Widget "${title}" added to dashboard "${dashboard.name}"`,
      userId: req.user.id,
      ipAddress: req.ip,
      timestamp: currentDate
    });
    
    res.status(201).json({
      success: true,
      data: widget
    });
  } catch (error) {
    console.error('Error adding widget to dashboard:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update a dashboard widget
exports.updateDashboardWidget = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, dataSource, params, refreshInterval, position } = req.body;
    const userId = req.user.id;
    const isAdmin = req.user.roles.includes('admin');
    
    // Find widget with dashboard to check permissions
    const widget = await DashboardWidget.findByPk(id, {
      include: [{
        model: Dashboard,
        attributes: ['id', 'ownerId', 'name', 'layout']
      }]
    });
    
    if (!widget) {
      return res.status(404).json({
        success: false,
        error: 'Widget not found'
      });
    }
    
    // Check permissions
    if (!isAdmin && widget.Dashboard.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to update this widget'
      });
    }
    
    // Update widget fields
    await widget.update({
      title: title || widget.title,
      dataSource: dataSource || widget.dataSource,
      params: params || widget.params,
      refreshInterval: refreshInterval || widget.refreshInterval,
      position: position || widget.position
    });
    
    // If position changed, update dashboard layout
    if (position) {
      let layout = widget.Dashboard.layout || [];
      const widgetLayoutIndex = layout.findIndex(item => item.i === id);
      
      if (widgetLayoutIndex >= 0) {
        layout[widgetLayoutIndex] = {
          ...layout[widgetLayoutIndex],
          x: position.x || layout[widgetLayoutIndex].x,
          y: position.y || layout[widgetLayoutIndex].y,
          w: position.w || layout[widgetLayoutIndex].w,
          h: position.h || layout[widgetLayoutIndex].h
        };
      }
      
      await widget.Dashboard.update({ layout });
    }
    
    // Create audit log entry
    await AuditLog.create({
      eventType: 'dashboard_widget_updated',
      entityType: 'dashboard_widget',
      entityId: widget.id,
      description: `Widget "${widget.title}" updated on dashboard "${widget.Dashboard.name}"`,
      userId: req.user.id,
      ipAddress: req.ip,
      timestamp: currentDate
    });
    
    res.status(200).json({
      success: true,
      data: widget
    });
  } catch (error) {
    console.error('Error updating dashboard widget:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Delete a dashboard widget
exports.deleteDashboardWidget = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.roles.includes('admin');
    
    // Find widget with dashboard to check permissions
    const widget = await DashboardWidget.findByPk(id, {
      include: [{
        model: Dashboard,
        attributes: ['id', 'ownerId', 'name', 'layout']
      }]
    });
    
    if (!widget) {
      return res.status(404).json({
        success: false,
        error: 'Widget not found'
      });
    }
    
    // Check permissions
    if (!isAdmin && widget.Dashboard.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to delete this widget'
      });
    }
    
    // Update dashboard layout to remove widget
    let layout = widget.Dashboard.layout || [];
    layout = layout.filter(item => item.i !== id);
    
    await widget.Dashboard.update({ layout });
    
    // Store widget info for audit log before deleting
    const widgetTitle = widget.title;
    const dashboardName = widget.Dashboard.name;
    
    // Delete widget
    await widget.destroy();
    
    // Create audit log entry
    await AuditLog.create({
      eventType: 'dashboard_widget_removed',
      entityType: 'dashboard_widget',
      entityId: id,
      description: `Widget "${widgetTitle}" removed from dashboard "${dashboardName}"`,
      userId: req.user.id,
      ipAddress: req.ip,
      timestamp: currentDate
    });
    
    res.status(200).json({
      success: true,
      message: 'Widget deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting dashboard widget:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get audit logs
exports.getAuditLogs = async (req, res) => {
  try {
    const {
      eventType,
      entityType,
      entityId,
      userId,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;
    
    // Build query conditions
    const where = {};
    if (eventType) where.eventType = eventType;
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (userId) where.userId = userId;
    
    // Date range filter
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp[Sequelize.Op.gte] = new Date(startDate);
      if (endDate) where.timestamp[Sequelize.Op.lte] = new Date(endDate);
    }
    
    // Calculate pagination
    const offset = (page - 1) * limit;
    
    const logs = await AuditLog.findAndCountAll({
      where,
      include: [{
        model: sequelize.models.user,
        as: 'user',
        attributes: ['id', 'username', 'firstName', 'lastName']
      }],
      order: [['timestamp', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.status(200).json({
      success: true,
      data: {
        logs: logs.rows,
        pagination: {
          total: logs.count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(logs.count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Create a new alert subscription
exports.createAlertSubscription = async (req, res) => {
  try {
    const { alertType, conditions, notificationChannel } = req.body;
    const userId = req.user.id;
    
    const subscription = await AlertSubscription.create({
      alertType,
      conditions: conditions || {},
      notificationChannel: notificationChannel || 'email',
      isActive: true,
      subscriberId: userId
    });
    
    res.status(201).json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.error('Error creating alert subscription:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get alert subscriptions for current user
exports.getUserAlertSubscriptions = async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.roles.includes('admin');
    
    // Build query conditions
    let where = {};
    if (!isAdmin || !req.query.userId) {
      where.subscriberId = userId;
    } else if (req.query.userId) {
      where.subscriberId = req.query.userId;
    }
    
    if (req.query.alertType) {
      where.alertType = req.query.alertType;
    }
    
    const subscriptions = await AlertSubscription.findAll({
      where,
      include: [{
        model: sequelize.models.user,
        as: 'subscriber',
        attributes: ['id', 'username', 'firstName', 'lastName']
      }],
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      data: subscriptions
    });
  } catch (error) {
    console.error('Error fetching alert subscriptions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update an alert subscription
exports.updateAlertSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { conditions, notificationChannel, isActive } = req.body;
    const userId = req.user.id;
    const isAdmin = req.user.roles.includes('admin');
    
    const subscription = await AlertSubscription.findByPk(id);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Alert subscription not found'
      });
    }
    
    // Check if user has permission
    if (!isAdmin && subscription.subscriberId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to update this subscription'
      });
    }
    
    // Update subscription
    await subscription.update({
      conditions: conditions || subscription.conditions,
      notificationChannel: notificationChannel || subscription.notificationChannel,
      isActive: isActive !== undefined ? isActive : subscription.isActive
    });
    
    res.status(200).json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.error('Error updating alert subscription:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Delete an alert subscription
exports.deleteAlertSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.roles.includes('admin');
    
    const subscription = await AlertSubscription.findByPk(id);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Alert subscription not found'
      });
    }
    
    // Check if user has permission
    if (!isAdmin && subscription.subscriberId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to delete this subscription'
      });
    }
    
    // Delete subscription
    await subscription.destroy();
    
    res.status(200).json({
      success: true,
      message: 'Alert subscription deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting alert subscription:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get inventory data source for reports/widgets
exports.getInventoryDataSource = async (req, res) => {
  try {
    const { metric, categoryId, period } = req.query;
    const inventoryIntegration = require('./integrations/inventory');
    
    let data;
    switch(metric) {
      case 'assetsByCategory':
        data = await inventoryIntegration.getAssetCountsByCategory();
        break;
      case 'assetsByStatus':
        data = await inventoryIntegration.getAssetCountsByStatus();
        break;
      case 'assetsByHealth':
        data = await inventoryIntegration.getAssetsByHealthStatus();
        break;
      case 'assetsApproachingEOL':
        data = await inventoryIntegration.getAssetsApproachingEOL(parseInt(period) || 6);
        break;
      case 'assetUtilization':
        data = await inventoryIntegration.getAssetUtilization(
          req.query.assetId || null,
          parseInt(period) || 30
        );
        break;
      case 'assetValueDistribution':
        data = await inventoryIntegration.getAssetValueDistribution();
        break;
      default:
        data = { message: 'Invalid metric specified' };
    }
    
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error getting inventory data source:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get warehouse data source for reports/widgets
exports.getWarehouseDataSource = async (req, res) => {
  try {
    const { metric, category, itemId, dateRange, startDate, endDate } = req.query;
    
    // Format date parameters
    const dateParams = {
      dateRange: dateRange || 'month',
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null
    };
    
    // This would normally use the warehouse integration
    // For now we'll simulate it with basic warehouse report generation
    let data;
    switch(metric) {
      case 'inventoryLevels':
        data = await generateWarehouseReport(
          { reportType: 'inventory_levels' }, 
          { category, orderBy: req.query.orderBy }
        );
        break;
      case 'stockMovements':
        data = await generateWarehouseReport(
          { reportType: 'stock_movement' }, 
          { 
            ...dateParams,
            itemId,
            movementType: req.query.movementType
          }
        );
        break;
      case 'lowStockItems':
        data = await generateWarehouseReport(
          { reportType: 'low_stock' }, 
          { category }
        );
        break;
      default:
        data = { message: 'Invalid metric specified' };
    }
    
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error getting warehouse data source:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get service management data source for reports/widgets
exports.getServiceDataSource = async (req, res) => {
  try {
    const { metric, priority, period, startDate, endDate } = req.query;
    const serviceIntegration = require('./integrations/service');
    
    // Format date parameters
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    let data;
    switch(metric) {
      case 'incidentsByStatus':
        data = await serviceIntegration.getIncidentCountsByStatus(start, end);
        break;
      case 'incidentsByPriority':
        data = await serviceIntegration.getIncidentCountsByPriority(start, end);
        break;
      case 'resolutionTimeStats':
        data = await serviceIntegration.getIncidentResolutionTimeStats(priority);
        break;
      case 'slaCompliance':
        data = await serviceIntegration.getSLAComplianceStats(
          req.query.groupBy || 'month',
          parseInt(period) || 12
        );
        break;
      case 'maintenanceStats':
        data = await serviceIntegration.getMaintenanceStats();
        break;
      case 'knowledgeBaseStats':
        data = await serviceIntegration.getKnowledgeBaseStats();
        break;
      case 'topIncidentCategories':
        data = await serviceIntegration.getTopIncidentCategories(parseInt(req.query.limit) || 10);
        break;
      default:
        data = { message: 'Invalid metric specified' };
    }
    
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error getting service data source:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get requests data source for reports/widgets
exports.getRequestsDataSource = async (req, res) => {
  try {
    const { metric, requestType, period, startDate, endDate } = req.query;
    const requestsIntegration = require('./integrations/requests');
    
    // Format date parameters
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    let data;
    switch(metric) {
      case 'requestsByStatus':
        data = await requestsIntegration.getRequestCountsByStatus(start, end);
        break;
      case 'requestsByType':
        data = await requestsIntegration.getRequestCountsByType(start, end);
        break;
      case 'processingTimeStats':
        data = await requestsIntegration.getRequestProcessingTimeStats(requestType);
        break;
      case 'requestsByDepartment':
        data = await requestsIntegration.getRequestsByDepartment(start, end);
        break;
      case 'requestTrends':
        data = await requestsIntegration.getRequestTrends(
          req.query.groupBy || 'month',
          parseInt(period) || 12
        );
        break;
      default:
        data = { message: 'Invalid metric specified' };
    }
    
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error getting requests data source:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
