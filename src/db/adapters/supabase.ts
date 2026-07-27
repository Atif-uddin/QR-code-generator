/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { DBAdapter, ListQRsParams, ListQRsResult, ScanData } from './interface';
import { QRRecord, DotShape, EyeOuterShape, EyeInnerShape, OverallShape, ErrorCorrectionLevel } from '@/types/qr';

export class SupabaseAdapter implements DBAdapter {
  private prisma: PrismaClient;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    this.prisma = new PrismaClient({ adapter });
  }

  async connect(): Promise<void> {
    await this.prisma.$connect();
  }

  private mapPrismaToQRRecord(doc: any): QRRecord {
    return {
      id: doc.id,
      uniqueCode: doc.uniqueCode,
      originalUrl: doc.originalUrl,
      trackingUrl: doc.trackingUrl,
      label: doc.label,
      dotShape: doc.dotShape as DotShape,
      eyeOuterShape: doc.eyeOuterShape as EyeOuterShape,
      eyeInnerShape: doc.eyeInnerShape as EyeInnerShape,
      fgColor: doc.fgColor,
      bgColor: doc.bgColor,
      overallShape: doc.overallShape as OverallShape,
      errorCorrection: doc.errorCorrection as ErrorCorrectionLevel,
      logoUrl: doc.logoUrl,
      sizePixels: doc.sizePixels,
      imageStoragePath: doc.imageStoragePath,
      scanCount: doc.scanCount,
      scanLogs: doc.scanLogs?.map((log: any) => ({
        scannedAt: log.scannedAt,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
      })) || [],
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      createdBy: doc.createdBy,
      isActive: doc.isActive,
    };
  }

  async createQR(data: Omit<QRRecord, 'id' | 'createdAt' | 'updatedAt' | 'scanCount' | 'scanLogs'>): Promise<QRRecord> {
    const saved = await this.prisma.qRRecord.create({
      data: {
        uniqueCode: data.uniqueCode,
        originalUrl: data.originalUrl,
        trackingUrl: data.trackingUrl,
        label: data.label,
        dotShape: data.dotShape,
        eyeOuterShape: data.eyeOuterShape,
        eyeInnerShape: data.eyeInnerShape,
        fgColor: data.fgColor,
        bgColor: data.bgColor,
        overallShape: data.overallShape,
        errorCorrection: data.errorCorrection,
        logoUrl: data.logoUrl,
        sizePixels: data.sizePixels,
        imageStoragePath: data.imageStoragePath,
        createdBy: data.createdBy,
        isActive: data.isActive,
        scanCount: 0,
      },
      include: {
        scanLogs: true,
      },
    });
    return this.mapPrismaToQRRecord(saved);
  }

  async getQRByCode(uniqueCode: string): Promise<QRRecord | null> {
    const doc = await this.prisma.qRRecord.findUnique({
      where: { uniqueCode },
      include: { scanLogs: true },
    });
    if (!doc) return null;
    return this.mapPrismaToQRRecord(doc);
  }

  async incrementScan(uniqueCode: string, scanData: ScanData): Promise<void> {
    await this.prisma.qRRecord.update({
      where: { uniqueCode },
      data: {
        scanCount: { increment: 1 },
        scanLogs: {
          create: {
            ipAddress: scanData.ipAddress,
            userAgent: scanData.userAgent,
          },
        },
      },
    });
  }

  async listQRs(params: ListQRsParams): Promise<ListQRsResult> {
    const { page = 1, limit = 10, label, isActive, dateFrom, dateTo } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (label) {
      where.label = { contains: label, mode: 'insensitive' };
    }
    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    const [total, docs] = await Promise.all([
      this.prisma.qRRecord.count({ where }),
      this.prisma.qRRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { scanLogs: true },
      }),
    ]);

    return {
      data: docs.map((doc) => this.mapPrismaToQRRecord(doc)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async deactivateQR(uniqueCode: string): Promise<boolean> {
    try {
      await this.prisma.qRRecord.update({
        where: { uniqueCode },
        data: { isActive: false },
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  async activateQR(uniqueCode: string): Promise<boolean> {
    try {
      await this.prisma.qRRecord.update({
        where: { uniqueCode },
        data: { isActive: true },
      });
      return true;
    } catch (e) {
      return false;
    }
  }
}
