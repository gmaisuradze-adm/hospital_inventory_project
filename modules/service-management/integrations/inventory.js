const { Incident, MaintenanceEvent } = require('../models');
const { setupEventSystem } = require('../../../core/events');
const { EventTypes } = require('../../../core/events');

/**
 * Initialize integration between service management module and inventory module
 */
function initializeInventoryIntegration() {
  console.log('Initializing service-inventory integration');
  
  const eventSystem = setupEventSystem();
  
  // Track maintenance history for assets
  eventSystem.on(EventTypes.MAINTENANCE_COMPLETED, async (data) => {
    try {
      const { assetId, maintenanceEventId, completedDate } = data;
      
      if (!assetId || !maintenanceEventId) return;
      
      // Get maintenance event details
      const maintenanceEvent = await MaintenanceEvent.findByPk(maintenanceEventId);
      
      if (!maintenanceEvent) return;
      
      // Get the Asset model from the inventory module
      const { Asset } = require('../../inventory/models');
      
      // Update asset maintenance history
      const asset = await Asset.findByPk(assetId);
      
      if (asset) {
        // Update last maintenance date
        await asset.update({
          lastMaintenanceDate: completedDate || new Date('2025-06-01T20:34:54'),
          maintenanceStatus: 'up-to-date'
        });
        
        // Add to maintenance history in metadata if supported
        const metadata = asset.metadata || {};
        const maintenanceHistory = metadata.maintenanceHistory || [];
        
        maintenanceHistory.push({
          eventId: maintenanceEventId,
          title: maintenanceEvent.title,
          date: completedDate || new Date('2025-06-01T20:34:54'),
          type: maintenanceEvent.type,
          outcome: maintenanceEvent.outcome,
          performedById: data.completedById
        });
        
        // Keep only the last 10 entries to avoid metadata bloat
        metadata.maintenanceHistory = maintenanceHistory.slice(-10);
        
        await asset.update({ metadata });
        
        console.log(`Updated maintenance history for asset ${assetId}`);
      }
    } catch (err) {
      console.error('Error updating asset maintenance history:', err);
    }
  }, 'service-inventory-maintenance-history');
  
  // Track incident history for assets
  eventSystem.on(EventTypes.INCIDENT_RESOLVED, async (data) => {
    try {
      const { incidentId } = data;
      
      if (!incidentId) return;
      
      // Get incident details including asset
      const incident = await Incident.findByPk(incidentId);
      
      if (!incident || !incident.assetId) return;
      
      // Get the Asset model from the inventory module
      const { Asset } = require('../../inventory/models');
      
      // Update asset incident history
      const asset = await Asset.findByPk(incident.assetId);
      
      if (asset) {
        // Add to incident history in metadata
        const metadata = asset.metadata || {};
        const incidentHistory = metadata.incidentHistory || [];
        
        incidentHistory.push({
          incidentId: incident.id,
          title: incident.title,
          reportedDate: incident.reportedDate,
          resolvedDate: incident.resolvedDate,
          priority: incident.priority,
          rootCause: incident.rootCause || 'Unknown',
          resolutionSummary: incident.resolutionSummary
        });
        
        // Keep only the last 10 entries
        metadata.incidentHistory = incidentHistory.slice(-10);
        
        // Calculate reliability metrics if there's enough history
        if (incidentHistory.length >= 3) {
          // Simple MTBF (Mean Time Between Failures) calculation
          const sortedIncidents = [...incidentHistory].sort((a, b) => 
            new Date(a.reportedDate) - new Date(b.reportedDate));
          
          let totalTimeBetween = 0;
          let count = 0;
          
          for (let i = 1; i < sortedIncidents.length; i++) {
            const timeBetween = new Date(sortedIncidents[i].reportedDate) - 
                              new Date(sortedIncidents[i-1].resolvedDate);
            
            // Convert to days
            const daysBetween = timeBetween / (1000 * 60 * 60 * 24);
            
            if (daysBetween > 0) {
              totalTimeBetween += daysBetween;
              count++;
            }
          }
          
          if (count > 0) {
            metadata.mtbf = Math.round(totalTimeBetween / count);
            metadata.reliability = metadata.mtbf > 90 ? 'High' : 
                                  (metadata.mtbf > 30 ? 'Medium' : 'Low');
          }
        }
        
        await asset.update({ metadata });
        
        console.log(`Updated incident history for asset ${incident.assetId}`);
      }
    } catch (err) {
      console.error('Error updating asset incident history:', err);
    }
  }, 'service-inventory-incident-history');
  
  // Update asset health status based on incidents and maintenance
  eventSystem.on(EventTypes.INCIDENT_REPORTED, async (data) => {
    try {
      const { incidentId } = data;
      
      if (!incidentId) return;
      
      // Get incident details
      const incident = await Incident.findByPk(incidentId);
      
      if (!incident || !incident.assetId) return;
      
      // Get the Asset model from inventory
      const { Asset } = require('../../inventory/models');
      
      // Update asset health status
      const asset = await Asset.findByPk(incident.assetId);
      
      if (asset) {
        let healthStatus = asset.healthStatus || 'unknown';
        
        // Adjust health based on incident priority
        switch (incident.priority) {
          case 'Critical':
          case 'High':
            healthStatus = 'critical';
            break;
          case 'Medium':
            healthStatus = healthStatus === 'healthy' ? 'warning' : healthStatus;
            break;
          default:
            // Don't downgrade health for low priority incidents
            break;
        }
        
        await asset.update({ healthStatus });
        
        console.log(`Updated health status for asset ${incident.assetId} to ${healthStatus}`);
      }
    } catch (err) {
      console.error('Error updating asset health status:', err);
    }
  }, 'service-inventory-health-update');
  
  console.log('Service-inventory integration initialized');
}

module.exports = {
  initializeInventoryIntegration
};
