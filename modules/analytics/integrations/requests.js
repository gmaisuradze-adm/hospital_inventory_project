const { sequelize } = require('../../../core/database');

/**
 * Analytics integration with requests module
 * Provides data collection and analysis functions specific to requests data
 */

// Get request counts by status
exports.getRequestCountsByStatus = async (startDate = null, endDate = null) => {
  try {
    let dateFilter = '';
    if (startDate && endDate) {
      dateFilter = `WHERE r."createdAt" BETWEEN '${startDate}' AND '${endDate}'`;
    } else if (startDate) {
      dateFilter = `WHERE r."createdAt" >= '${startDate}'`;
    } else if (endDate) {
      dateFilter = `WHERE r."createdAt" <= '${endDate}'`;
    }
    
    const query = `
      SELECT 
        status, 
        COUNT(id) as count
      FROM requests r
      ${dateFilter}
      GROUP BY status
      ORDER BY count DESC
    `;
    
    const [results] = await sequelize.query(query);
    return results;
  } catch (error) {
    console.error('Error getting request counts by status:', error);
    throw error;
  }
};

// Get request counts by type
exports.getRequestCountsByType = async (startDate = null, endDate = null) => {
  try {
    let dateFilter = '';
    if (startDate && endDate) {
      dateFilter = `WHERE r."createdAt" BETWEEN '${startDate}' AND '${endDate}'`;
    } else if (startDate) {
      dateFilter = `WHERE r."createdAt" >= '${startDate}'`;
    } else if (endDate) {
      dateFilter = `WHERE r."createdAt" <= '${endDate}'`;
    }
    
    const query = `
      SELECT 
        type, 
        COUNT(id) as count
      FROM requests r
      ${dateFilter}
      GROUP BY type
      ORDER BY count DESC
    `;
    
    const [results] = await sequelize.query(query);
    return results;
  } catch (error) {
    console.error('Error getting request counts by type:', error);
    throw error;
  }
};

// Get request processing time statistics
exports.getRequestProcessingTimeStats = async (requestType = null) => {
  try {
    let typeFilter = '';
    if (requestType) {
      typeFilter = `WHERE type = '${requestType}'`;
    }
    
    const query = `
      SELECT 
        type,
        COUNT(id) as request_count,
        AVG(EXTRACT(EPOCH FROM ("updatedAt" - "createdAt"))/3600) as avg_processing_hours,
        MIN(EXTRACT(EPOCH FROM ("updatedAt" - "createdAt"))/3600) as min_processing_hours,
        MAX(EXTRACT(EPOCH FROM ("updatedAt" - "createdAt"))/3600) as max_processing_hours,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM ("updatedAt" - "createdAt"))/3600) as median_processing_hours
      FROM requests
      ${typeFilter}
      WHERE status IN ('completed', 'approved', 'rejected', 'closed')
      GROUP BY type
      ORDER BY type
    `;
    
    const [results] = await sequelize.query(query);
    return results;
  } catch (error) {
    console.error('Error getting request processing time statistics:', error);
    throw error;
  }
};

// Get requests by department
exports.getRequestsByDepartment = async (startDate = null, endDate = null) => {
  try {
    let dateFilter = '';
    if (startDate && endDate) {
      dateFilter = `AND r."createdAt" BETWEEN '${startDate}' AND '${endDate}'`;
    } else if (startDate) {
      dateFilter = `AND r."createdAt" >= '${startDate}'`;
    } else if (endDate) {
      dateFilter = `AND r."createdAt" <= '${endDate}'`;
    }
    
    const query = `
      SELECT 
        d.name as department_name,
        COUNT(r.id) as request_count
      FROM requests r
      JOIN departments d ON r."departmentId" = d.id
      WHERE r."departmentId" IS NOT NULL ${dateFilter}
      GROUP BY d.name
      ORDER BY request_count DESC
    `;
    
    const [results] = await sequelize.query(query);
    return results;
  } catch (error) {
    console.error('Error getting requests by department:', error);
    throw error;
  }
};

// Get request trends over time
exports.getRequestTrends = async (period = 'month', months = 12) => {
  try {
    let timeFormat;
    switch (period) {
      case 'day':
        timeFormat = 'YYYY-MM-DD';
        break;
      case 'week':
        timeFormat = 'IYYY-IW';
        break;
      case 'month':
      default:
        timeFormat = 'YYYY-MM';
    }
    
    const query = `
      SELECT 
        to_char("createdAt", '${timeFormat}') as time_period,
        COUNT(id) as request_count
      FROM requests
      WHERE "createdAt" >= CURRENT_DATE - INTERVAL '${months} months'
      GROUP BY time_period
      ORDER BY time_period
    `;
    
    const [results] = await sequelize.query(query);
    return results;
  } catch (error) {
    console.error('Error getting request trends:', error);
    throw error;
  }
};