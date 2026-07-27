import { NextResponse } from 'next/server';
import { getDB } from '@/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ uniqueCode: string }> }
) {
  try {
    const db = await getDB();
    const { uniqueCode } = await params;
    
    const record = await db.getQRByCode(uniqueCode);
    if (!record) {
      return NextResponse.json({
        error: true,
        code: 'QR_NOT_FOUND',
        message: 'No QR code found for the given unique code.',
        statusCode: 404
      }, { status: 404 });
    }
    
    return NextResponse.json(record, { status: 200 });
  } catch (error) {
    console.error('Fetch QR Error:', error);
    return NextResponse.json({
      error: true,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to fetch QR code.',
      statusCode: 500
    }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ uniqueCode: string }> }
) {
  try {
    const db = await getDB();
    const { uniqueCode } = await params;
    
    const success = await db.deactivateQR(uniqueCode);
    if (!success) {
      return NextResponse.json({
        error: true,
        code: 'DEACTIVATION_FAILED',
        message: 'Failed to deactivate QR code or it does not exist.',
        statusCode: 400
      }, { status: 400 });
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'QR code deactivated successfully.'
    }, { status: 200 });
  } catch (error) {
    console.error('Deactivate QR Error:', error);
    return NextResponse.json({
      error: true,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to deactivate QR code.',
      statusCode: 500
    }, { status: 500 });
  }
}
