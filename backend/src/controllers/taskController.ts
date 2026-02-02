import { Response } from 'express';
import Task from '../models/Task';
import { AuthRequest } from '../types';

/**
 * @desc    Get all tasks
 * @route   GET /api/tasks
 * @access  Private
 */
export const getTasks = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const tasks = await Task.find({ assignedTo: req.user?.id })
      .sort({ dueDate: 1, createdAt: -1 })
      .populate('customer', 'name email')
      .populate('deal', 'title value')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching tasks',
    });
  }
};

/**
 * @desc    Get single task
 * @route   GET /api/tasks/:id
 * @access  Private
 */
export const getTask = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      assignedTo: req.user?.id,
    })
      .populate('customer', 'name email')
      .populate('deal', 'title value')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    if (!task) {
      res.status(404).json({
        success: false,
        message: 'Task not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching task',
    });
  }
};

/**
 * @desc    Create new task
 * @route   POST /api/tasks
 * @access  Private
 */
export const createTask = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    req.body.createdBy = req.user?.id;
    
    // If assignedTo is not specified, assign to creator
    if (!req.body.assignedTo) {
      req.body.assignedTo = req.user?.id;
    }

    const task = await Task.create(req.body);

    res.status(201).json({
      success: true,
      data: task,
      message: 'Task created successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating task',
    });
  }
};

/**
 * @desc    Update task
 * @route   PUT /api/tasks/:id
 * @access  Private
 */
export const updateTask = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    let task = await Task.findOne({
      _id: req.params.id,
      assignedTo: req.user?.id,
    });

    if (!task) {
      res.status(404).json({
        success: false,
        message: 'Task not found',
      });
      return;
    }

    // If status is being changed to completed, set completedDate
    if (req.body.status === 'completed' && task.status !== 'completed') {
      req.body.completedDate = new Date();
    }

    task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: task,
      message: 'Task updated successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating task',
    });
  }
};

/**
 * @desc    Delete task
 * @route   DELETE /api/tasks/:id
 * @access  Private
 */
export const deleteTask = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      assignedTo: req.user?.id,
    });

    if (!task) {
      res.status(404).json({
        success: false,
        message: 'Task not found',
      });
      return;
    }

    await task.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
      message: 'Task deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting task',
    });
  }
};
