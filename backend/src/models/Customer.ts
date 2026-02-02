import mongoose, { Document, Schema } from 'mongoose';

/**
 * Customer Interface
 * بيانات العملاء
 */
export interface ICustomer extends Document {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  status: 'active' | 'inactive' | 'lead';
  tags?: string[];
  notes?: string;
  owner: mongoose.Types.ObjectId; // المستخدم المسؤول عن هذا العميل
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Customer Schema
 */
const CustomerSchema = new Schema<ICustomer>(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    company: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'lead'],
      default: 'lead',
    },
    tags: [{
      type: String,
      trim: true,
    }],
    notes: {
      type: String,
      trim: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index للبحث السريع
CustomerSchema.index({ name: 'text', email: 'text', company: 'text' });

export default mongoose.model<ICustomer>('Customer', CustomerSchema);
