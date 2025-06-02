const { 
  ServiceCategory, 
  Incident, 
  MaintenanceSchedule, 
  MaintenanceEvent,
  ServiceNote,
  KnowledgeArticle,
  SLATracking
} = require('./models');
const { Sequelize, sequelize } = require('../../core/database');
const { EventTypes } = require('../../core/events');
const { setupEventSystem } = require('../../core/events');
const configManager = require('../../core/config');

// Get event system instance
const eventSystem = setupEventSystem();
// Get config manager
const serviceConfig = configManager.loadModuleConfig('service-management') || {};

// Create a new service category
exports.createServiceCategory = async (req, res) => {
  try {
    const { name, description, slaResponseTime, slaResolutionTime, priority, color, icon } = req.body;
    
    const category = await ServiceCategory.create({
      name,
      description,
      slaResponseTime,
      slaResolutionTime,
      priority,
      color,
      icon
    });
    
    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error creating service category:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get all service categories
exports.getAllServiceCategories = async (req, res) => {
  try {
    const categories = await ServiceCategory.findAll();
    
    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching service categories:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Report a new incident
exports.reportIncident = async (req, res) => {
  try {
    const {
      title,
      description,
      priority,
      impact,
      serviceCategoryId,
      assetId
    } = req.body;
    
    const currentDate = new Date('2025-06-01T20:34:54');
    const reporterId = req.user.id; // From auth middleware
    
    // Create the incident
    const incident = await Incident.create({
      title,
      description,
      priority,
      impact,
      reportedDate: currentDate,
      serviceCategoryId,
      assetId,
      reporterId
    });
    
    // Get service category for SLA calculation
    const category = await ServiceCategory.findByPk(serviceCategoryId);
    
    if (category) {
      // Calculate SLA target times
      const targetResponseTime = new Date(currentDate.getTime() + (category.slaResponseTime * 60000));
      const targetResolutionTime = new Date(currentDate.getTime() + (category.slaResolutionTime * 60000));
      
      // Create SLA tracking record
      await SLATracking.create({
        incidentId: incident.id,
        targetResponseTime,
        targetResolutionTime,
        businessHoursOnly: serviceConfig.useBusinessHoursForSLA || true
      });
    }
    
    // Emit event
    eventSystem.emit(EventTypes.INCIDENT_REPORTED, {
      incidentId: incident.id,
      title: incident.title,
      priority: incident.priority,
      reporterId: reporterId,
      reportedAt: currentDate,
      serviceCategoryId
    });
    
    // Return response
    res.status(201).json({
      success: true,
      data: incident
    });
  } catch (error) {
    console.error('Error reporting incident:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get all incidents with optional filtering
exports.getIncidents = async (req, res) => {
  try {
    const {
      status,
      priority,
      assigneeId,
      startDate,
      endDate,
      assetId,
      serviceCategoryId,
      limit = 20,
      offset = 0
    } = req.query;
    
    // Build the filter conditions
    const where = {};
    
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = assigneeId;
    if (assetId) where.assetId = assetId;
    if (serviceCategoryId) where.serviceCategoryId = serviceCategoryId;
    
    // Date range filtering
    if (startDate || endDate) {
      where.reportedDate = {};
      if (startDate) where.reportedDate[Sequelize.Op.gte] = new Date(startDate);
      if (endDate) where.reportedDate[Sequelize.Op.lte] = new Date(endDate);
    }
    
    // Fetch incidents with related data
    const { count, rows: incidents } = await Incident.findAndCountAll({
      where,
      include: [
        { 
          model: sequelize.models.user, 
          as: 'reporter',
          attributes: ['id', 'username', 'firstName', 'lastName', 'email']
        },
        { 
          model: sequelize.models.user, 
          as: 'assignee',
          attributes: ['id', 'username', 'firstName', 'lastName', 'email']
        },
        { 
          model: ServiceCategory,
          attributes: ['id', 'name', 'priority', 'slaResponseTime', 'slaResolutionTime']
        },
        {
          model: sequelize.models.asset,
          attributes: ['id', 'name', 'assetTag', 'status']
        },
        {
          model: SLATracking
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['reportedDate', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      count,
      data: incidents
    });
  } catch (error) {
    console.error('Error fetching incidents:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get incident by ID
exports.getIncidentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const incident = await Incident.findByPk(id, {
      include: [
        { 
          model: sequelize.models.user, 
          as: 'reporter',
          attributes: ['id', 'username', 'firstName', 'lastName', 'email']
        },
        { 
          model: sequelize.models.user, 
          as: 'assignee',
          attributes: ['id', 'username', 'firstName', 'lastName', 'email']
        },
        { 
          model: sequelize.models.user, 
          as: 'resolver',
          attributes: ['id', 'username', 'firstName', 'lastName', 'email']
        },
        { 
          model: ServiceCategory,
          attributes: ['id', 'name', 'priority', 'slaResponseTime', 'slaResolutionTime']
        },
        {
          model: sequelize.models.asset,
          attributes: ['id', 'name', 'assetTag', 'status', 'model', 'serialNumber']
        },
        {
          model: SLATracking
        },
        {
          model: ServiceNote,
          include: [{
            model: sequelize.models.user,
            as: 'author',
            attributes: ['id', 'username', 'firstName', 'lastName']
          }]
        },
        {
          model: KnowledgeArticle,
          attributes: ['id', 'title', 'category', 'status']
        }
      ]
    });
    
    if (!incident) {
      return res.status(404).json({
        success: false,
        error: 'Incident not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: incident
    });
  } catch (error) {
    console.error('Error fetching incident details:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update incident status
exports.updateIncidentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const userId = req.user.id;
    const currentDate = new Date('2025-06-01T20:34:54');
    
    // Find the incident
    const incident = await Incident.findByPk(id, {
      include: [{ model: SLATracking }]
    });
    
    if (!incident) {
      return res.status(404).json({
        success: false,
        error: 'Incident not found'
      });
    }
    
    // Update the incident status
    const updates = { status };
    
    switch (status) {
      case 'Assigned':
        if (!incident.assignedDate) {
          updates.assignedDate = currentDate;
          updates.assigneeId = req.body.assigneeId || userId;
        }
        break;
      case 'In Progress':
        if (!incident.acknowledgedDate) {
          updates.acknowledgedDate = currentDate;
          
          // Update SLA tracking for response time
          if (incident.sla_tracking && !incident.sla_tracking.actualResponseTime) {
            await incident.sla_tracking.update({
              actualResponseTime: currentDate,
              responseStatus: currentDate <= incident.sla_tracking.targetResponseTime ? 'on-time' : 'breached'
            });
          }
        }
        break;
      case 'Resolved':
        updates.resolvedDate = currentDate;
        updates.resolverId = userId;
        if (req.body.resolutionSummary) {
          updates.resolutionSummary = req.body.resolutionSummary;
        }
        if (req.body.rootCause) {
          updates.rootCause = req.body.rootCause;
        }
        
        // Update SLA tracking for resolution time
        if (incident.sla_tracking && !incident.sla_tracking.actualResolutionTime) {
          await incident.sla_tracking.update({
            actualResolutionTime: currentDate,
            resolutionStatus: currentDate <= incident.sla_tracking.targetResolutionTime ? 'on-time' : 'breached'
          });
        }
        break;
      case 'Closed':
        updates.closedDate = currentDate;
        break;
      default:
        break;
    }
    
    // Update incident
    await incident.update(updates);
    
    // Add note if provided
    if (notes) {
      await ServiceNote.create({
        content: notes,
        incidentId: incident.id,
        authorId: userId,
        type: 'status-update',
        timestamp: currentDate
      });
    }
    
    // Emit appropriate event
    if (status === 'Resolved') {
      eventSystem.emit(EventTypes.INCIDENT_RESOLVED, {
        incidentId: incident.id,
        resolverId: userId,
        resolvedDate: currentDate
      });
    }
    
    res.status(200).json({
      success: true,
      data: incident
    });
  } catch (error) {
    console.error('Error updating incident status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Add note to incident
exports.addIncidentNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, isPrivate = false, type = 'update' } = req.body;
    const userId = req.user.id;
    const currentDate = new Date('2025-06-01T20:34:54');
    
    // Check if incident exists
    const incident = await Incident.findByPk(id);
    if (!incident) {
      return res.status(404).json({
        success: false,
        error: 'Incident not found'
      });
    }
    
    // Create note
    const note = await ServiceNote.create({
      content,
      incidentId: id,
      authorId: userId,
      isPrivate,
      type,
      timestamp: currentDate
    });
    
    // Get author details
    const noteWithAuthor = await ServiceNote.findByPk(note.id, {
      include: [{
        model: sequelize.models.user,
        as: 'author',
        attributes: ['id', 'username', 'firstName', 'lastName']
      }]
    });
    
    res.status(201).json({
      success: true,
      data: noteWithAuthor
    });
  } catch (error) {
    console.error('Error adding incident note:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Create maintenance schedule
exports.createMaintenanceSchedule = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      frequency,
      intervalDays,
      priority,
      estimatedDuration,
      startDate,
      endDate,
      notifyBefore,
      assetId,
      serviceCategoryId
    } = req.body;
    
    const userId = req.user.id;
    
    // Create maintenance schedule
    const maintenanceSchedule = await MaintenanceSchedule.create({
      title,
      description,
      type,
      frequency,
      intervalDays,
      priority,
      estimatedDuration,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      notifyBefore,
      assetId,
      serviceCategoryId,
      createdById: userId
    });
    
    // Schedule the first maintenance event based on start date
    const firstEvent = await MaintenanceEvent.create({
      title: `${title} - Initial Maintenance`,
      description,
      scheduledStartDate: new Date(startDate),
      scheduledEndDate: new Date(new Date(startDate).getTime() + (estimatedDuration * 60000)),
      maintenanceScheduleId: maintenanceSchedule.id,
      assetId
    });
    
    // Emit event for scheduled maintenance
    eventSystem.emit(EventTypes.MAINTENANCE_SCHEDULED, {
      maintenanceScheduleId: maintenanceSchedule.id,
      maintenanceEventId: firstEvent.id,
      assetId,
      scheduledDate: startDate,
      createdById: userId
    });
    
    res.status(201).json({
      success: true,
      data: {
        maintenanceSchedule,
        firstEvent
      }
    });
  } catch (error) {
    console.error('Error creating maintenance schedule:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get all maintenance schedules
exports.getMaintenanceSchedules = async (req, res) => {
  try {
    const {
      assetId,
      isActive,
      type,
      frequency,
      limit = 20,
      offset = 0
    } = req.query;
    
    // Build filter conditions
    const where = {};
    
    if (assetId) where.assetId = assetId;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (type) where.type = type;
    if (frequency) where.frequency = frequency;
    
    // Fetch maintenance schedules
    const { count, rows: schedules } = await MaintenanceSchedule.findAndCountAll({
      where,
      include: [
        {
          model: sequelize.models.asset,
          attributes: ['id', 'name', 'assetTag', 'status']
        },
        {
          model: sequelize.models.user,
          as: 'createdBy',
          attributes: ['id', 'username', 'firstName', 'lastName']
        },
        {
          model: ServiceCategory,
          attributes: ['id', 'name']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['startDate', 'ASC']]
    });
    
    res.status(200).json({
      success: true,
      count,
      data: schedules
    });
  } catch (error) {
    console.error('Error fetching maintenance schedules:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get upcoming maintenance events
exports.getUpcomingMaintenanceEvents = async (req, res) => {
  try {
    const {
      assetId,
      daysAhead = 30,
      status,
      limit = 20,
      offset = 0
    } = req.query;
    
    const currentDate = new Date('2025-06-01T20:34:54');
    const futureDate = new Date(currentDate);
    futureDate.setDate(futureDate.getDate() + parseInt(daysAhead));
    
    // Build filter conditions
    const where = {
      scheduledStartDate: {
        [Sequelize.Op.between]: [currentDate, futureDate]
      }
    };
    
    if (assetId) where.assetId = assetId;
    if (status) where.status = status;
    
    // Fetch maintenance events
    const { count, rows: events } = await MaintenanceEvent.findAndCountAll({
      where,
      include: [
        {
          model: MaintenanceSchedule,
          attributes: ['id', 'title', 'type', 'frequency']
        },
        {
          model: sequelize.models.asset,
          attributes: ['id', 'name', 'assetTag', 'status']
        },
        {
          model: sequelize.models.user,
          as: 'assignee',
          attributes: ['id', 'username', 'firstName', 'lastName']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['scheduledStartDate', 'ASC']]
    });
    
    res.status(200).json({
      success: true,
      count,
      data: events
    });
  } catch (error) {
    console.error('Error fetching upcoming maintenance events:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Complete maintenance event
exports.completeMaintenanceEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      outcome,
      actions,
      partsUsed,
      costs,
      notes
    } = req.body;
    
    const userId = req.user.id;
    const currentDate = new Date('2025-06-01T20:34:54');
    
    // Find the maintenance event
    const event = await MaintenanceEvent.findByPk(id, {
      include: [
        { model: MaintenanceSchedule },
        { model: sequelize.models.asset }
      ]
    });
    
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Maintenance event not found'
      });
    }
    
    // Update the event
    const updatedEvent = await event.update({
      status: 'completed',
      actualStartDate: event.actualStartDate || currentDate,
      actualEndDate: currentDate,
      outcome,
      actions,
      partsUsed: partsUsed || [],
      costs,
      performedById: userId
    });
    
    // Add note if provided
    if (notes) {
      await ServiceNote.create({
        content: notes,
        maintenanceEventId: event.id,
        authorId: userId,
        type: 'completion',
        timestamp: currentDate
      });
    }
    
    // Schedule next maintenance if this is a recurring schedule
    if (event.maintenance_schedule && 
        event.maintenance_schedule.frequency !== 'once' &&
        event.maintenance_schedule.isActive) {
      
      // Calculate next maintenance date
      let nextDate = new Date(event.scheduledStartDate);
      
      switch (event.maintenance_schedule.frequency) {
        case 'daily':
          nextDate.setDate(nextDate.getDate() + 1);
          break;
        case 'weekly':
          nextDate.setDate(nextDate.getDate() + 7);
          break;
        case 'monthly':
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
        case 'quarterly':
          nextDate.setMonth(nextDate.getMonth() + 3);
          break;
        case 'yearly':
          nextDate.setFullYear(nextDate.getFullYear() + 1);
          break;
        default:
          // Use interval days if defined
          if (event.maintenance_schedule.intervalDays) {
            nextDate.setDate(nextDate.getDate() + event.maintenance_schedule.intervalDays);
          }
      }
      
      // Check if next date is before end date (if any)
      if (!event.maintenance_schedule.endDate || nextDate <= new Date(event.maintenance_schedule.endDate)) {
        // Create next maintenance event
        const nextEndDate = new Date(nextDate.getTime() + 
          (event.maintenance_schedule.estimatedDuration * 60000));
          
        await MaintenanceEvent.create({
          title: event.title.includes(' - ') ? 
            event.title.split(' - ')[0] + ` - ${nextDate.toLocaleDateString()}` :
            `${event.title} - ${nextDate.toLocaleDateString()}`,
          description: event.description,
          scheduledStartDate: nextDate,
          scheduledEndDate: nextEndDate,
          maintenanceScheduleId: event.maintenanceScheduleId,
          assetId: event.assetId,
          status: 'scheduled'
        });
      }
    }
    
    // Emit maintenance completed event
    eventSystem.emit(EventTypes.MAINTENANCE_COMPLETED, {
      maintenanceEventId: event.id,
      assetId: event.assetId,
      completedById: userId,
      completedDate: currentDate
    });
    
    res.status(200).json({
      success: true,
      data: updatedEvent
    });
  } catch (error) {
    console.error('Error completing maintenance event:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Create knowledge article
exports.createKnowledgeArticle = async (req, res) => {
  try {
    const {
      title,
      content,
      tags,
      category,
      status,
      isPublic
    } = req.body;
    
    const userId = req.user.id;
    const currentDate = new Date('2025-06-01T20:34:54');
    
    const article = await KnowledgeArticle.create({
      title,
      content,
      tags,
      category,
      status,
      isPublic,
      authorId: userId,
      lastEditorId: userId,
      publishedDate: status === 'published' ? currentDate : null,
      lastUpdatedDate: currentDate
    });
    
    res.status(201).json({
      success: true,
      data: article
    });
  } catch (error) {
    console.error('Error creating knowledge article:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get knowledge articles
exports.getKnowledgeArticles = async (req, res) => {
  try {
    const {
      status,
      category,
      tags,
      search,
      limit = 20,
      offset = 0
    } = req.query;
    
    // Build filter conditions
    const where = {};
    
    if (status) where.status = status;
    if (category) where.category = category;
    
    // Filter by tags
    if (tags) {
      where[Sequelize.Op.overlap] = { tags: tags.split(',') };
    }
    
    // Search in title and content
    if (search) {
      where[Sequelize.Op.or] = [
        { title: { [Sequelize.Op.iLike]: `%${search}%` } },
        { content: { [Sequelize.Op.iLike]: `%${search}%` } }
      ];
    }
    
    // Fetch articles
    const { count, rows: articles } = await KnowledgeArticle.findAndCountAll({
      where,
      include: [
        {
          model: sequelize.models.user,
          as: 'author',
          attributes: ['id', 'username', 'firstName', 'lastName']
        },
        {
          model: sequelize.models.user,
          as: 'lastEditor',
          attributes: ['id', 'username', 'firstName', 'lastName']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['lastUpdatedDate', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      count,
      data: articles
    });
  } catch (error) {
    console.error('Error fetching knowledge articles:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get SLA performance metrics
exports.getSLAMetrics = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      serviceCategoryId
    } = req.query;
    
    // Default to last 30 days if not specified
    const currentDate = new Date('2025-06-01T20:34:54');
    const defaultStartDate = new Date(currentDate);
    defaultStartDate.setDate(defaultStartDate.getDate() - 30);
    
    // Build filter conditions
    const where = {
      reportedDate: {
        [Sequelize.Op.between]: [
          startDate ? new Date(startDate) : defaultStartDate,
          endDate ? new Date(endDate) : currentDate
        ]
      }
    };
    
    if (serviceCategoryId) where.serviceCategoryId = serviceCategoryId;
    
    // Get incidents with SLA tracking
    const incidents = await Incident.findAll({
      where,
      include: [
        {
          model: SLATracking,
          required: true
        },
        {
          model: ServiceCategory,
          attributes: ['id', 'name']
        }
      ]
    });
    
    // Calculate metrics
    const metrics = {
      total: incidents.length,
      responseMetrics: {
        onTime: 0,
        breached: 0,
        pending: 0,
        percentOnTime: 0
      },
      resolutionMetrics: {
        onTime: 0,
        breached: 0,
        pending: 0,
        percentOnTime: 0
      },
      byCategory: {}
    };
    
    incidents.forEach(incident => {
      const sla = incident.sla_tracking;
      const categoryName = incident.service_category ? incident.service_category.name : 'Uncategorized';
      
      // Initialize category if not exists
      if (!metrics.byCategory[categoryName]) {
        metrics.byCategory[categoryName] = {
          total: 0,
          responseOnTime: 0,
          responseBreached: 0,
          responsePending: 0,
          resolutionOnTime: 0,
          resolutionBreached: 0,
          resolutionPending: 0
        };
      }
      
      metrics.byCategory[categoryName].total++;
      
      // Response metrics
      if (sla.actualResponseTime) {
        if (sla.responseStatus === 'on-time') {
          metrics.responseMetrics.onTime++;
          metrics.byCategory[categoryName].responseOnTime++;
        } else {
          metrics.responseMetrics.breached++;
          metrics.byCategory[categoryName].responseBreached++;
        }
      } else {
        metrics.responseMetrics.pending++;
        metrics.byCategory[categoryName].responsePending++;
      }
      
      // Resolution metrics
      if (sla.actualResolutionTime) {
        if (sla.resolutionStatus === 'on-time') {
          metrics.resolutionMetrics.onTime++;
          metrics.byCategory[categoryName].resolutionOnTime++;
        } else {
          metrics.resolutionMetrics.breached++;
          metrics.byCategory[categoryName].resolutionBreached++;
        }
      } else {
        metrics.resolutionMetrics.pending++;
        metrics.byCategory[categoryName].resolutionPending++;
      }
    });
    
    // Calculate percentages
    const responseMeasured = metrics.responseMetrics.onTime + metrics.responseMetrics.breached;
    metrics.responseMetrics.percentOnTime = responseMeasured > 0 
      ? Math.round((metrics.responseMetrics.onTime / responseMeasured) * 100) 
      : 0;
      
    const resolutionMeasured = metrics.resolutionMetrics.onTime + metrics.resolutionMetrics.breached;
    metrics.resolutionMetrics.percentOnTime = resolutionMeasured > 0 
      ? Math.round((metrics.resolutionMetrics.onTime / resolutionMeasured) * 100) 
      : 0;
    
    res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error calculating SLA metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
