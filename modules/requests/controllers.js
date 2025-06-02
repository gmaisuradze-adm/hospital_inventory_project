const { 
  Request, 
  RequestItem, 
  Workflow, 
  WorkflowStep, 
  RequestProgress,
  RequestComment
} = require('./models');
const { Sequelize } = require('../../core/database');
const { EventTypes } = require('../../core/events');
const { setupEventSystem } = require('../../core/events');

const eventSystem = setupEventSystem();

// Request Controllers
async function getAllRequests(req, res) {
  try {
    const { status, type, priority, requesterId, assigneeId } = req.query;
    const filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (type) {
      filter.type = type;
    }
    
    if (priority) {
      filter.priority = priority;
    }
    
    if (requesterId) {
      filter.requesterId = requesterId;
    }
    
    if (assigneeId) {
      filter.assigneeId = assigneeId;
    }
    
    const requests = await Request.findAll({
      where: filter,
      include: [
        { model: sequelize.models.user, as: 'requester' },
        { model: sequelize.models.user, as: 'assignee' },
        { model: Workflow },
        { 
          model: RequestItem,
          include: [
            sequelize.models.item ? { model: sequelize.models.item } : undefined
          ].filter(Boolean)
        },
        { model: RequestProgress, include: [{ model: WorkflowStep }] }
      ],
      order: [
        ['submitDate', 'DESC']
      ]
    });
    
    res.json({
      error: false,
      data: requests
    });
  } catch (err) {
    console.error('Error getting requests:', err);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error'
    });
  }
}

async function getRequestById(req, res) {
  try {
    const { id } = req.params;
    
    const request = await Request.findByPk(id, {
      include: [
        { model: sequelize.models.user, as: 'requester' },
        { model: sequelize.models.user, as: 'assignee' },
        { model: Workflow },
        { 
          model: RequestItem,
          include: [
            sequelize.models.item ? { model: sequelize.models.item } : undefined
          ].filter(Boolean)
        },
        { 
          model: RequestProgress, 
          include: [
            { model: WorkflowStep },
            { model: sequelize.models.user, as: 'assignee' },
            { model: sequelize.models.user, as: 'completedBy' }
          ],
          order: [['startDate', 'DESC']]
        },
        {
          model: RequestComment,
          include: [{ model: sequelize.models.user, as: 'author' }],
          order: [['timestamp', 'DESC']]
        }
      ]
    });
    
    if (!request) {
      return res.status(404).json({
        error: true,
        message: 'Request not found'
      });
    }
    
    res.json({
      error: false,
      data: request
    });
  } catch (err) {
    console.error('Error getting request:', err);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error'
    });
  }
}

async function createRequest(req, res) {
  try {
    const { 
      title, 
      description, 
      type, 
      priority,
      dueDate,
      notes,
      workflowId,
      items = []
    } = req.body;
    
    // Validate required fields
    if (!title || !type) {
      return res.status(400).json({
        error: true,
        message: 'Title and type are required'
      });
    }
    
    // Create request
    const request = await Request.create({
      title,
      description,
      type,
      priority: priority || 'Medium',
      status: 'New',
      submitDate: new Date(),
      dueDate,
      notes,
      requesterId: req.user.userId,
      workflowId
    });
    
    // Add requested items
    if (items.length > 0) {
      const requestItems = [];
      
      for (const item of items) {
        const requestItem = await RequestItem.create({
          requestId: request.id,
          itemId: item.itemId,
          quantity: item.quantity || 1,
          status: 'Pending',
          notes: item.notes
        });
        
        requestItems.push(requestItem);
      }
    }
    
    // Create initial workflow progress if workflow is assigned
    if (workflowId) {
      const workflow = await Workflow.findByPk(workflowId, {
        include: [{
          model: WorkflowStep,
          where: { stepOrder: 1 },
          required: false
        }]
      });
      
      if (workflow && workflow.workflowSteps && workflow.workflowSteps.length > 0) {
        const firstStep = workflow.workflowSteps[0];
        
        await RequestProgress.create({
          requestId: request.id,
          workflowStepId: firstStep.id,
          status: 'Pending',
          startDate: new Date()
        });
        
        // Update request status based on workflow
        await request.update({
          status: 'In Progress'
        });
      }
    }
    
    // Emit event
    eventSystem.emit(EventTypes.REQUEST_CREATED, {
      requestId: request.id,
      requesterId: req.user.userId,
      type,
      priority: priority || 'Medium'
    });
    
    // Return created request with its relationships
    const createdRequest = await Request.findByPk(request.id, {
      include: [
        { model: sequelize.models.user, as: 'requester' },
        { model: Workflow },
        { model: RequestItem },
        { model: RequestProgress, include: [{ model: WorkflowStep }] }
      ]
    });
    
    res.status(201).json({
      error: false,
      message: 'Request created successfully',
      data: createdRequest
    });
  } catch (err) {
    console.error('Error creating request:', err);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error'
    });
  }
}

async function updateRequestStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    // Validate required fields
    if (!status) {
      return res.status(400).json({
        error: true,
        message: 'Status is required'
      });
    }
    
    // Find request
    const request = await Request.findByPk(id);
    
    if (!request) {
      return res.status(404).json({
        error: true,
        message: 'Request not found'
      });
    }
    
    // Update request status
    const oldStatus = request.status;
    await request.update({
      status,
      ...(status === 'Completed' && { completedDate: new Date() }),
      notes: notes ? (request.notes ? `${request.notes}\n${notes}` : notes) : request.notes
    });
    
    // Create comment for status change
    await RequestComment.create({
      requestId: id,
      comment: `Status changed from ${oldStatus} to ${status}${notes ? `: ${notes}` : ''}`,
      authorId: req.user.userId
    });
    
    // Emit event
    eventSystem.emit(EventTypes.REQUEST_UPDATED, {
      requestId: id,
      userId: req.user.userId,
      oldStatus,
      newStatus: status
    });
    
    if (status === 'Completed') {
      eventSystem.emit(EventTypes.REQUEST_COMPLETED, {
        requestId: id,
        userId: req.user.userId
      });
    }
    
    res.json({
      error: false,
      message: 'Request status updated successfully',
      data: request
    });
  } catch (err) {
    console.error('Error updating request status:', err);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error'
    });
  }
}

async function assignRequest(req, res) {
  try {
    const { id } = req.params;
    const { assigneeId, notes } = req.body;
    
    // Validate required fields
    if (!assigneeId) {
      return res.status(400).json({
        error: true,
        message: 'Assignee ID is required'
      });
    }
    
    // Find request
    const request = await Request.findByPk(id);
    
    if (!request) {
      return res.status(404).json({
        error: true,
        message: 'Request not found'
      });
    }
    
    // Check if assignee exists
    const assignee = await sequelize.models.user.findByPk(assigneeId);
    if (!assignee) {
      return res.status(404).json({
        error: true,
        message: 'Assignee not found'
      });
    }
    
    // Update request
    const oldAssigneeId = request.assigneeId;
    await request.update({
      assigneeId,
      status: request.status === 'New' ? 'Assigned' : request.status
    });
    
    // Create comment for assignment
    await RequestComment.create({
      requestId: id,
      comment: `Request ${oldAssigneeId ? 'reassigned' : 'assigned'} to ${assignee.username}${notes ? `: ${notes}` : ''}`,
      authorId: req.user.userId
    });
    
    res.json({
      error: false,
      message: 'Request assigned successfully',
      data: request
    });
  } catch (err) {
    console.error('Error assigning request:', err);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error'
    });
  }
}

async function addRequestComment(req, res) {
  try {
    const { id } = req.params;
    const { comment, isPrivate } = req.body;
    
    // Validate required fields
    if (!comment) {
      return res.status(400).json({
        error: true,
        message: 'Comment text is required'
      });
    }
    
    // Find request
    const request = await Request.findByPk(id);
    
    if (!request) {
      return res.status(404).json({
        error: true,
        message: 'Request not found'
      });
    }
    
    // Create comment
    const requestComment = await RequestComment.create({
      requestId: id,
      comment,
      isPrivate: isPrivate || false,
      authorId: req.user.userId
    });
    
    // Return comment with author details
    const createdComment = await RequestComment.findByPk(requestComment.id, {
      include: [{ model: sequelize.models.user, as: 'author' }]
    });
    
    res.status(201).json({
      error: false,
      message: 'Comment added successfully',
      data: createdComment
    });
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error'
    });
  }
}

// Workflow Controllers
async function getAllWorkflows(req, res) {
  try {
    const { active, type } = req.query;
    const filter = {};
    
    if (active !== undefined) {
      filter.active = active === 'true';
    }
    
    if (type) {
      filter.type = type;
    }
    
    const workflows = await Workflow.findAll({
      where: filter,
      include: [{
        model: WorkflowStep,
        order: [['stepOrder', 'ASC']]
      }],
      order: [
        ['name', 'ASC'],
        [{ model: WorkflowStep }, 'stepOrder', 'ASC']
      ]
    });
    
    res.json({
      error: false,
      data: workflows
    });
  } catch (err) {
    console.error('Error getting workflows:', err);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error'
    });
  }
}

async function createWorkflow(req, res) {
  try {
    const { name, description, type, steps = [] } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({
        error: true,
        message: 'Workflow name is required'
      });
    }
    
    // Create workflow
    const workflow = await Workflow.create({
      name,
      description,
      type,
      active: true
    });
    
    // Add workflow steps
    if (steps.length > 0) {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        
        await WorkflowStep.create({
          name: step.name,
          description: step.description,
          stepOrder: i + 1,
          requiredRole: step.requiredRole,
          action: step.action,
          autoProgress: step.autoProgress || false,
          workflowId: workflow.id,
          metadata: step.metadata || {}
        });
      }
    }
    
    // Return created workflow with its steps
    const createdWorkflow = await Workflow.findByPk(workflow.id, {
      include: [{
        model: WorkflowStep,
        order: [['stepOrder', 'ASC']]
      }]
    });
    
    res.status(201).json({
      error: false,
      message: 'Workflow created successfully',
      data: createdWorkflow
    });
  } catch (err) {
    console.error('Error creating workflow:', err);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error'
    });
  }
}

async function processWorkflowStep(req, res) {
  try {
    const { requestId } = req.params;
    const { stepId, action, notes, assignToNextId } = req.body;
    
    // Validate required fields
    if (!stepId || !action) {
      return res.status(400).json({
        error: true,
        message: 'Step ID and action are required'
      });
    }
    
    // Find request
    const request = await Request.findByPk(requestId, {
      include: [{ model: Workflow, include: [{ model: WorkflowStep }] }]
    });
    
    if (!request) {
      return res.status(404).json({
        error: true,
        message: 'Request not found'
      });
    }
    
    // Find current progress
    const currentProgress = await RequestProgress.findOne({
      where: {
        requestId,
        workflowStepId: stepId,
        status: 'Pending'
      }
    });
    
    if (!currentProgress) {
      return res.status(400).json({
        error: true,
        message: 'No pending progress found for this step'
      });
    }
    
    // Start transaction
    const transaction = await sequelize.transaction();
    
    try {
      // Update current progress
      await currentProgress.update({
        status: action === 'approve' ? 'Completed' : 'Rejected',
        completedDate: new Date(),
        result: action,
        notes: notes || null,
        completedById: req.user.userId
      }, { transaction });
      
      if (action === 'approve') {
        // Find the next step
        const currentStep = request.workflow.workflowSteps.find(s => s.id === stepId);
        const nextStep = request.workflow.workflowSteps.find(s => s.stepOrder === currentStep.stepOrder + 1);
        
        if (nextStep) {
          // Create next step progress
          await RequestProgress.create({
            requestId,
            workflowStepId: nextStep.id,
            status: 'Pending',
            startDate: new Date(),
            assigneeId: assignToNextId || null
          }, { transaction });
          
          // Update request status
          await request.update({
            status: 'In Progress'
          }, { transaction });
        } else {
          // No more steps, complete the request
          await request.update({
            status: 'Completed',
            completedDate: new Date()
          }, { transaction });
          
          // Emit completion event
          eventSystem.emit(EventTypes.REQUEST_COMPLETED, {
            requestId,
            userId: req.user.userId
          });
        }
      } else {
        // Request was rejected
        await request.update({
          status: 'Rejected'
        }, { transaction });
      }
      
      // Create comment
      await RequestComment.create({
        requestId,
        comment: `Workflow step ${action === 'approve' ? 'approved' : 'rejected'}${notes ? `: ${notes}` : ''}`,
        authorId: req.user.userId
      }, { transaction });
      
      // Commit transaction
      await transaction.commit();
      
      // Return updated request
      const updatedRequest = await Request.findByPk(requestId, {
        include: [
          { model: sequelize.models.user, as: 'requester' },
          { model: sequelize.models.user, as: 'assignee' },
          { model: Workflow },
          { model: RequestItem },
          { 
            model: RequestProgress, 
            include: [
              { model: WorkflowStep },
              { model: sequelize.models.user, as: 'assignee' },
              { model: sequelize.models.user, as: 'completedBy' }
            ],
            order: [['startDate', 'DESC']]
          }
        ]
      });
      
      res.json({
        error: false,
        message: `Workflow step ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
        data: updatedRequest
      });
      
    } catch (err) {
      // Rollback transaction on error
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error('Error processing workflow step:', err);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error'
    });
  }
}

module.exports = {
  // Request controllers
  getAllRequests,
  getRequestById,
  createRequest,
  updateRequestStatus,
  assignRequest,
  addRequestComment,
  
  // Workflow controllers
  getAllWorkflows,
  createWorkflow,
  processWorkflowStep
};
