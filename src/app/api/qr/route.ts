import { NextResponse } from 'next/server';
import { getDB } from '@/db';
import { z } from 'zod';

const ListParamsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  label: z.string().optional(),
  isActive: z.enum(['true', 'false']).transform((val) => val === 'true').optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const params = Object.fromEntries(searchParams.entries());
    
    const validated = ListParamsSchema.parse(params);
    
    const db = await getDB();
    const result = await db.listQRs({
      page: validated.page,
      limit: validated.limit,
      label: validated.label,
      isActive: validated.isActive,
      dateFrom: validated.dateFrom ? new Date(validated.dateFrom) : undefined,
      dateTo: validated.dateTo ? new Date(validated.dateTo) : undefined,
    });
    
    return NextResponse.json(result, { status: 200 });
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

    console.error('List QRs Error:', error);
    return NextResponse.json({
      error: true,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to list QR codes.',
      statusCode: 500
    }, { status: 500 });
  }
}
