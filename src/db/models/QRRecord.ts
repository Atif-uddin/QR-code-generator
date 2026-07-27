import mongoose, { Schema, Document, Model } from 'mongoose';
import { QRRecord } from '@/types/qr';

export interface QRRecordDocument extends Omit<QRRecord, 'id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const ScanLogSchema = new Schema(
  {
    scannedAt: { type: Date, required: true },
    ipAddress: { type: String, required: true },
    userAgent: { type: String, required: true },
  },
  { _id: false }
);

const QRRecordSchema = new Schema<QRRecordDocument>(
  {
    uniqueCode: { type: String, required: true, unique: true, index: true },
    originalUrl: { type: String, required: true },
    trackingUrl: { type: String, required: true },
    label: { type: String, default: null },
    dotShape: {
      type: String,
      enum: ['square', 'rounded', 'dots', 'classy', 'classy-rounded', 'extra-rounded'],
      required: true,
      default: 'square',
    },
    eyeOuterShape: {
      type: String,
      enum: ['square', 'rounded'],
      required: true,
      default: 'square',
    },
    eyeInnerShape: {
      type: String,
      enum: ['square', 'dot', 'rounded'],
      required: true,
      default: 'square',
    },
    fgColor: { type: String, required: true, default: '#000000' },
    bgColor: { type: String, required: true, default: '#ffffff' },
    overallShape: {
      type: String,
      enum: ['square', 'circle', 'rounded-rectangle'],
      required: true,
      default: 'square',
    },
    errorCorrection: {
      type: String,
      enum: ['L', 'M', 'Q', 'H'],
      required: true,
      default: 'H',
    },
    logoUrl: { type: String, default: null },
    sizePixels: { type: Number, required: true, default: 512 },
    imageStoragePath: { type: String, required: true },
    scanCount: { type: Number, default: 0 },
    scanLogs: [ScanLogSchema],
    createdBy: { type: String, default: null },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

// Optimize retrieval by uniqueCode
QRRecordSchema.index({ uniqueCode: 1 });

export const QRRecordModel: Model<QRRecordDocument> =
  mongoose.models.QRRecord || mongoose.model<QRRecordDocument>('QRRecord', QRRecordSchema);
