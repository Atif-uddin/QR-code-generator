/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { getDB } from '@/db';
import { z } from 'zod';

const PaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ uniqueCode: string }> }
) {
  try {
    const db = await getDB();
    const { uniqueCode } = await params;
    
    const { searchParams } = new URL(req.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validated = PaginationSchema.parse(queryParams);
    
    const record = await db.getQRByCode(uniqueCode);
    if (!record) {
      return NextResponse.json({
        error: true,
        code: 'QR_NOT_FOUND',
        message: 'No QR code found for the given unique code.',
        statusCode: 404
      }, { status: 404 });
    }
    
    const allLogs = record.scanLogs.sort((a, b) => b.scannedAt.getTime() - a.scannedAt.getTime());
    const total = allLogs.length;
    const skip = (validated.page - 1) * validated.limit;
    const paginatedLogs = allLogs.slice(skip, skip + validated.limit);
    
    return NextResponse.json({
      data: paginatedLogs,
      total,
      page: validated.page,
      limit: validated.limit,
      totalPages: Math.ceil(total / validated.limit),
    }, { status: 200 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: true,
        code: 'VALIDATION_ERROR',
        message: 'Invalid query parameters.',
        details: error.issues,
        statusCode: 400
      }, { status: 400 });
    }

    console.error('Scan Logs Fetch Error:', error);
    return NextResponse.json({
      error: true,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to fetch scan logs.',
      statusCode: 500
    }, { status: 500 });
  }
}
