import mongoose from 'mongoose';
import { DBAdapter, ListQRsParams, ListQRsResult, ScanData } from './interface';
import { QRRecordModel } from '../models/QRRecord';
import { QRRecord } from '@/types/qr';

export class MongoDBAdapter implements DBAdapter {
  private isConnected = false;

  async connect(): Promise<void> {
    if (this.isConnected) return;
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is not defined');
    
    try {
      await mongoose.connect(uri);
      this.isConnected = true;
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  private mapDocumentToQRRecord(doc: any): QRRecord {
    return {
      id: doc._id.toString(),
      uniqueCode: doc.uniqueCode,
      originalUrl: doc.originalUrl,
      trackingUrl: doc.trackingUrl,
      label: doc.label,
      dotShape: doc.dotShape,
      eyeOuterShape: doc.eyeOuterShape,
      eyeInnerShape: doc.eyeInnerShape,
      fgColor: doc.fgColor,
      bgColor: doc.bgColor,
      overallShape: doc.overallShape,
      errorCorrection: doc.errorCorrection,
      logoUrl: doc.logoUrl,
      sizePixels: doc.sizePixels,
      imageStoragePath: doc.imageStoragePath,
      scanCount: doc.scanCount,
      scanLogs: doc.scanLogs.map((log: any) => ({
        scannedAt: log.scannedAt,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
      })),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      createdBy: doc.createdBy,
      isActive: doc.isActive,
    };
  }

  async createQR(data: Omit<QRRecord, 'id' | 'createdAt' | 'updatedAt' | 'scanCount' | 'scanLogs'>): Promise<QRRecord> {
    await this.connect();
    
    const newQR = new QRRecordModel({
      ...data,
      scanCount: 0,
      scanLogs: [],
    });

    const saved = await newQR.save();
    return this.mapDocumentToQRRecord(saved);
  }

  async getQRByCode(uniqueCode: string): Promise<QRRecord | null> {
    await this.connect();
    const doc = await QRRecordModel.findOne({ uniqueCode });
    if (!doc) return null;
    return this.mapDocumentToQRRecord(doc);
  }

  async incrementScan(uniqueCode: string, scanData: ScanData): Promise<void> {
    await this.connect();
    
    await QRRecordModel.updateOne(
      { uniqueCode },
      {
        $inc: { scanCount: 1 },
        $push: {
          scanLogs: {
            scannedAt: new Date(),
            ipAddress: scanData.ipAddress,
            userAgent: scanData.userAgent,
          },
        },
      }
    );
  }

  async listQRs(params: ListQRsParams): Promise<ListQRsResult> {
    await this.connect();
    
    const { page = 1, limit = 10, label, isActive, dateFrom, dateTo } = params;
    const skip = (page - 1) * limit;

    const query: any = {};
    if (label) {
      query.label = { $regex: label, $options: 'i' };
    }
    if (isActive !== undefined) {
      query.isActive = isActive;
    }
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = dateFrom;
      if (dateTo) query.createdAt.$lte = dateTo;
    }

    const [total, docs] = await Promise.all([
      QRRecordModel.countDocuments(query),
      QRRecordModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    return {
      data: docs.map(this.mapDocumentToQRRecord),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async deactivateQR(uniqueCode: string): Promise<boolean> {
    await this.connect();
    const result = await QRRecordModel.updateOne(
      { uniqueCode },
      { $set: { isActive: false } }
    );
    return result.modifiedCount > 0;
  }

  async activateQR(uniqueCode: string): Promise<boolean> {
    await this.connect();
    const result = await QRRecordModel.updateOne(
      { uniqueCode },
      { $set: { isActive: true } }
    );
    return result.modifiedCount > 0;
  }
}
