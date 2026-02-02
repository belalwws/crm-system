import mongoose, { Document, Schema } from 'mongoose';

/**
 * Deal Interface
 * الصفقات والفرص البيعية
 */
export interface IDeal extends Document {
  title: string;
  description?: string;
  value: number; // قيمة الصفقة بالدولار
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
  probability: number; // نسبة احتمال النجاح (0-100)
  customer: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  expectedCloseDate?: Date;
  closedDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Deal Schema
 */
const DealSchema = new Schema<IDeal>(
  {
    title: {
      type: String,
      required: [true, 'Deal title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    value: {
      type: Number,
      required: [true, 'Deal value is required'],
      min: 0,
    },
    stage: {
      type: String,
      enum: ['lead', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost'],
      default: 'lead',
    },
    probability: {
      type: Number,
      min: 0,
      max: 100,
      default: 10,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    expectedCloseDate: {
      type: Date,
    },
    closedDate: {
      type: Date,
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

// Index للبحث والترتيب
DealSchema.index({ stage: 1, expectedCloseDate: 1 });

export default mongoose.model<IDeal>('Deal', DealSchema);
