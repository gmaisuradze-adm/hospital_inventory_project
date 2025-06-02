const { sequelize } = require('../../../core/database');

/**
 * Analytics integration with inventory module
 * Provides data collection and analysis functions specific to inventory data
 */

// Get asset counts by category
exports.getAssetCountsByCategory = async () => {
  try {
    const query = `
      SELECT 
        ac.name as category_name, 
        COUNT(a.id) as asset_count
      FROM assets a
      JOIN asset_categories ac ON a."assetCategoryId" = ac.id
      GROUP BY ac.name
      ORDER BY asset_count DESC
    `;
    
    const [results] = await sequelize.query(query);
    return results;
  } catch (error) {
    console.error('Error getting asset counts by category:', error);
    throw error;
  }
};

// Get asset counts by status
exports.getAssetCountsByStatus = async () => {
  try {
    const query = `
      SELECT 
        status, 
        COUNT(id) as count
      FROM assets
      GROUP BY status
      ORDER BY count DESC
    `;
    
    const [results] = await sequelize.query(query);
    return results;
  } catch (error) {
    console.error('Error getting asset counts by status:', error);
    throw error;
  }
};

// Get assets by health status
exports.getAssetsByHealthStatus = async () => {
  try {
    const query = `
      SELECT 
        COALESCE("healthStatus", 'unknown') as health_status, 
        COUNT(id) as count
      FROM assets
      GROUP BY health_status
      ORDER BY count DESC
    `;
    
    const [results] = await sequelize.query(query);
    return results;
  } catch (error) {
    console.error('Error getting assets by health status:', error);
    throw error;
  }
};

// Get assets approaching end of life
exports.getAssetsApproachingEOL = async (monthsThreshold = 6) => {
  try {
    const query = `
      SELECT 
        id, 
        name, 
        "assetTag", 
        "purchaseDate", 
        "warrantyExpirationDate", 
        "expectedLifespan",
        "departmentId"
      FROM assets
      WHERE 
        "warrantyExpirationDate" IS NOT NULL 
        AND "warrantyExpirationDate" <= CURRENT_DATE + INTERVAL '${monthsThreshold} months'
        AND "warrantyExpirationDate" >= CURRENT_DATE
      ORDER BY "warrantyExpirationDate"
    `;
    
    const [results] = await sequelize.query(query);
    return results;
  } catch (error) {
    console.error('Error getting assets approaching EOL:', error);
    throw error;
  }
};

// Get asset utilization data
exports.getAssetUtilization = async (assetId = null, period = 30) => {
  try {
    const whereClause = assetId ? `WHERE asset_id = '${assetId}'` : '';
    
    const query = `
      SELECT 
        a.id as asset_id,
        a.name as asset_name,
        a."assetTag",
        COUNT(u.id) as usage_count,
        SUM(EXTRACT(EPOCH FROM (u."endTime" - u."startTime"))/3600) as total_hours_used
      FROM assets a
      LEFT JOIN asset_usage_logs u ON a.id = u.asset_id
      ${whereClause}
      WHERE u."startTime" >= CURRENT_DATE - INTERVAL '${period} days'
      GROUP BY a.id, a.name, a."assetTag"
      ORDER BY usage_count DESC
    `;
    
    const [results] = await sequelize.query(query);
    return results;
  } catch (error) {
    console.error('Error getting asset utilization:', error);
    throw error;
  }
};

// Get asset value distribution
exports.getAssetValueDistribution = async () => {
  try {
    const query = `
      SELECT 
        CASE
          WHEN "purchaseValue" < 1000 THEN 'Under $1,000'
          WHEN "purchaseValue" >= 1000 AND "purchaseValue" < 5000 THEN '$1,000 - $4,999'
          WHEN "purchaseValue" >= 5000 AND "purchaseValue" < 10000 THEN '$5,000 - $9,999'
          WHEN "purchaseValue" >= 10000 AND "purchaseValue" < 50000 THEN '$10,000 - $49,999'
          WHEN "purchaseValue" >= 50000 AND "purchaseValue" < 100000 THEN '$50,000 - $99,999'
          WHEN "purchaseValue" >= 100000 THEN '$100,000+'
          ELSE 'Unknown'
        END as value_range,
        COUNT(id) as asset_count,
        SUM("purchaseValue") as total_value
      FROM assets
      GROUP BY value_range
      ORDER BY MIN("purchaseValue")
    `;
    
    const [results] = await sequelize.query(query);
    return results;
  } catch (error) {
    console.error('Error getting asset value distribution:', error);
    throw error;
  }
};