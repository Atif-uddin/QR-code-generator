import { NextResponse } from 'next/server';
import { uploadBufferToCloudinary } from '@/services/cloudinary';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('logo') as File | null;
    
    if (!file) {
      return NextResponse.json({
        error: true,
        code: 'VALIDATION_ERROR',
        message: 'No logo file provided.',
        statusCode: 400
      }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Upload the logo to Cloudinary
    const logoUrl = await uploadBufferToCloudinary(buffer, 'qr-logos');
    
    return NextResponse.json({
      status: 'success',
      logoUrl
    }, { status: 201 });
    
  } catch (error) {
    console.error('Logo Upload Error:', error);
    return NextResponse.json({
      error: true,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to upload logo.',
      statusCode: 500
    }, { status: 500 });
  }
}
