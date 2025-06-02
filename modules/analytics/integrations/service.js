const { sequelize } = require('../../../core/database');

/**
 * Analytics integration with service management module
 * Provides data collection and analysis functions specific to IT service management data
 */

// Get incident counts by status
exports.getIncidentCountsByStatus = async (startDate = null, endDate = null) => {
  try {
    let dateFilter = '';
    if (startDate && endDate) {
      dateFilter = `WHERE i."createdAt" BETWEEN '${startDate}' AND '${endDate}'`;
    } else if (startDate) {
      dateFilter = `WHERE i."createdAt" >= '${startDate}'`;
    } else if (endDate) {
      dateFilter = `WHERE i."createdAt" <= '${endDate}'`;
    }
    
    const query = `
      SELECT 
        status, 
        COUNT(id) as count
      FROM incidents i
      ${dateFilter}
      GROUP BY status
      ORDER BY count DESC
    `;
    
    const [results] = await sequelize.query(query);
    return results;
  } catch (error) {
    console.error('Error getting incident counts by status:', error);
    throw error;
  }
};

// Get incident counts by priority
exports.getIncidentCountsByPriority = async (startDate = null, endDate = null) => {
  try {
    let dateFilter = '';
    if (startDate && endDate) {
      dateFilter = `WHERE i."createdAt" BETWEEN '${startDate}' AND '${endDate}'`;
    } else if (startDate) {
      dateFilter = `WHERE i."createdAt" >= '${startDate}'`;
    } else if (endDate) {
      dateFilter = `WHERE i."createdAt" <= '${endDate}'`;
    }
    
    const query = `
      SELECT 
        priority, 
        COUNT(id) as count
      FROM incidents i
      ${dateFilter}
      GROUP BY priority
      ORDER BY 
        CASE priority
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
          ELSE 5
        END
    `;
    
    const [results] = await sequelize.query(query);
    return results;
  } catch (error) {
    console.error('Error getting incident counts by priority:', error);
    throw error;
  }
};

// Get incident resolution time statistics
exports.getIncidentResolutionTimeStats = async (priority = null) => {
  try {
    let priorityFilter = '';
    if (priority) {
      priorityFilter = `AND priority = '${priority}'`;
    }
    
    const query = `
      SELECT 
        priority,
        COUNT(id) as incident_count,
        AVG(EXTRACT(EPOCH FROM (resolution_time))/3600) as avg_resolution_hours,
        MIN(EXTRACT(EPOCH FROM (resolution_time))/3600) as min_resolution_hours,
        MAX(EXTRACT(EPOCH FROM (resolution_time))/3600) as max_resolution_hours,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (resolution_time))/3600) as median_resolution_hours
      FROM (
        SELECT 
          id, 
          priority,
          "resolvedAt" - "createdAt" as resolution_time
        FROM incidents
        WHERE "resolvedAt" IS NOT NULL ${priorityFilter}
      ) as resolved_incidents
      GROUP BY priority
      ORDER BY 
        CASE priority
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
          ELSE 5
        END
    `;
    
    const [results] = await sequelize.query(query);
    return results;
  } catch (error) {
    console.error('Error getting incident resolution time statistics:', error);
    throw error;
  }
};

// Get SLA compliance statistics
exports.getSLAComplianceStats = async (period = 'month', months = 12) => {
  try {
    const query = `
      SELECT 
        to_char(i."createdAt", 'YYYY-MM') as month,
        COUNT(i.id) as total_incidents,
        SUM(CASE WHEN i."resolvedAt" - i."createdAt" <= sla.resolution_time THEN 1 ELSE 0 END) as met_sla,
        ROUND((SUM(CASE WHEN i."resolvedAt" - i."createdAt" <= sla.resolution_time THEN 1 ELSE 0 END)::numeric / COUNT(i.id)) * 100, 2) as sla_compliance_percentage
      FROM incidents i
      JOIN sla_definitions sla ON i.priority = sla.priority
      WHERE i."resolvedAt" IS NOT NULL
        AND i."createdAt" >= CURRENT_DATE - INTERVAL '${months} months'
      GROUP BY month
      ORDER BY month
    `;
    
    const [results] = await sequelize.query(query);
    return results;
  } catch (error) {
    console.error('Error getting SLA compliance statistics:', error);
    throw error;
  }
};

// Get maintenance statistics
exports.getMaintenanceStats = async () => {
  try {
    const query = `
      SELECT 
        COUNT(id) as total_maintenances,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled,
        SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'canceled' THEN 1 ELSE 0 END) as canceled,
        SUM(CASE WHEN status = 'rescheduled' THEN 1 ELSE 0 END) as rescheduled,
        AVG(EXTRACT(EPOCH FROM (actual_duration))/60) as avg_duration_minutes
      FROM (
        SELECT 
          id, 
          status,
          "completedAt" - "startedAt" as actual_duration
        FROM maintenance_schedules
        WHERE "completedAt" IS NOT NULL AND "startedAt" IS NOT NULL
      ) as completed_maintenance
    `;
    
    const [results] = await sequelize.query(query);
    return results.length > 0 ? results[0] : { total_maintenances: 0 };
  } catch (error) {
    console.error('Error getting maintenance statistics:', error);
    throw error;
  }
};

// Get knowledge base article usage statistics
exports.getKnowledgeBaseStats = async () => {
  try {
    const query = `
      SELECT 
        kb.id,
        kb.title,
        kb.category,
        COUNT(kbv.id) as view_count,
        MAX(kbv."viewedAt") as last_viewed
      FROM knowledge_base_articles kb
      LEFT JOIN knowledge_base_views kbv ON kb.id = kbv."articleId"
      GROUP BY kb.id, kb.title, kb.category
      ORDER BY view_count DESC
    `;
    
    const [results] = await sequelize.query(query);
    return results;
  } catch (error) {
    console.error('Error getting knowledge base statistics:', error);
    throw error;
  }
};

// Get top incident categories
exports.getTopIncidentCategories = async (limit = 10) => {
  try {
    const query = `
      SELECT 
        category,
        COUNT(id) as incident_count
      FROM incidents
      WHERE category IS NOT NULL
      GROUP BY category
      ORDER BY incident_count DESC
      LIMIT ${limit}
    `;
    
    const [results] = await sequelize.query(query);
    return results;
  } catch (error) {
    console.error('Error getting top incident categories:', error);
    throw error;
  }
};