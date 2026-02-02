import mongoose, { Document, Schema } from 'mongoose';

/**
 * Task Interface
 * المهام والأنشطة
 */
export interface ITask extends Document {
  title: string;
  description?: string;
  type: 'call' | 'email' | 'meeting' | 'follow-up' | 'other';
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  dueDate?: Date;
  completedDate?: Date;
  customer?: mongoose.Types.ObjectId;
  deal?: mongoose.Types.ObjectId;
  assignedTo: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Task Schema
 */
const TaskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['call', 'email', 'meeting', 'follow-up', 'other'],
      default: 'other',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    dueDate: {
      type: Date,
    },
    completedDate: {
      type: Date,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
    },
    deal: {
      type: Schema.Types.ObjectId,
      ref: 'Deal',
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index للبحث والترتيب حسب التاريخ والحالة
TaskSchema.index({ status: 1, dueDate: 1 });
TaskSchema.index({ assignedTo: 1, status: 1 });

export default mongoose.model<ITask>('Task', TaskSchema);
