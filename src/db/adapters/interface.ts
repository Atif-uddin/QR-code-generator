import { QRRecord } from '@/types/qr';

export interface ListQRsParams {
  page?: number;
  limit?: number;
  label?: string;
  isActive?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface ListQRsResult {
  data: QRRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ScanData {
  ipAddress: string;
  userAgent: string;
}

export interface DBAdapter {
  /**
   * Initialize the database connection
   */
  connect(): Promise<void>;

  /**
   * Create a new QR code record
   */
  createQR(data: Omit<QRRecord, 'id' | 'createdAt' | 'updatedAt' | 'scanCount' | 'scanLogs'>): Promise<QRRecord>;

  /**
   * Retrieve a single QR record by its unique code
   */
  getQRByCode(uniqueCode: string): Promise<QRRecord | null>;

  /**
   * Increment the scan count and add a scan log entry
   */
  incrementScan(uniqueCode: string, scanData: ScanData): Promise<void>;

  /**
   * List QR records with pagination and filtering
   */
  listQRs(params: ListQRsParams): Promise<ListQRsResult>;

  /**
   * Deactivate a QR code (soft delete)
   */
  deactivateQR(uniqueCode: string): Promise<boolean>;

  /**
   * Reactivate a previously deactivated QR code
   */
  activateQR(uniqueCode: string): Promise<boolean>;
}
