import { NextResponse } from 'next/server';
import { getDB } from '@/db';

export async function PATCH(
  req: Request,
  { params }: { params: { uniqueCode: string } }
) {
  try {
    const db = await getDB();
    const { uniqueCode } = await params;
    
    const success = await db.activateQR(uniqueCode);
    if (!success) {
      return NextResponse.json({
        error: true,
        code: 'ACTIVATION_FAILED',
        message: 'Failed to activate QR code or it does not exist.',
        statusCode: 400
      }, { status: 400 });
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'QR code activated successfully.'
    }, { status: 200 });
  } catch (error) {
    console.error('Activate QR Error:', error);
    return NextResponse.json({
      error: true,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to activate QR code.',
      statusCode: 500
    }, { status: 500 });
  }
}
