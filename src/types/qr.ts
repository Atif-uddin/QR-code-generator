export type DotShape = 'square' | 'rounded' | 'dots' | 'classy' | 'classy-rounded' | 'extra-rounded';
export type EyeOuterShape = 'square' | 'rounded';
export type EyeInnerShape = 'square' | 'dot' | 'rounded';
export type OverallShape = 'square' | 'circle' | 'rounded-rectangle';
export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export interface ScanLog {
  scannedAt: Date;
  ipAddress: string;
  userAgent: string;
}

export interface QRRecord {
  id?: string;
  uniqueCode: string;
  originalUrl: string;
  trackingUrl: string;
  label?: string;
  dotShape: DotShape;
  eyeOuterShape: EyeOuterShape;
  eyeInnerShape: EyeInnerShape;
  fgColor: string;
  bgColor: string;
  overallShape: OverallShape;
  errorCorrection: ErrorCorrectionLevel;
  logoUrl?: string | null;
  sizePixels: number;
  imageStoragePath: string;
  scanCount: number;
  scanLogs: ScanLog[];
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string | null;
  isActive: boolean;
}

export type QRGenerateRequest = Omit<
  QRRecord,
  'id' | 'uniqueCode' | 'trackingUrl' | 'imageStoragePath' | 'scanCount' | 'scanLogs' | 'createdAt' | 'updatedAt' | 'isActive'
>;
