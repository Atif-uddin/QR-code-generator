/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDB } from '@/db';
import { generateUniqueQUC } from '@/services/qucGenerator';
import { renderQRCode } from '@/services/qrRenderer';
import { uploadBufferToCloudinary } from '@/services/cloudinary';

const GenerateQRSchema = z.object({
  originalUrl: z.string().url().max(2048),
  label: z.string().optional(),
  dotShape: z.enum(['square', 'rounded', 'dots', 'classy', 'classy-rounded', 'extra-rounded']).default('square'),
  eyeOuterShape: z.enum(['square', 'rounded']).default('square'),
  eyeInnerShape: z.enum(['square', 'dot', 'rounded']).default('square'),
  fgColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#000000'),
  bgColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).or(z.literal('transparent')).default('#ffffff'),
  overallShape: z.enum(['square', 'circle', 'rounded-rectangle']).default('square'),
  errorCorrection: z.enum(['L', 'M', 'Q', 'H']).default('H'),
  logoUrl: z.string().optional(),
  sizePixels: z.number().min(200).max(2000).default(512),
  createdBy: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = GenerateQRSchema.parse(body);

    const quc = await generateUniqueQUC();
    
    // Automatically use the host that received the request (works for Vercel, Localhost, and Local Network IPs)
    const requestUrl = new URL(req.url);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL && !process.env.NEXT_PUBLIC_BASE_URL.includes('localhost') 
      ? process.env.NEXT_PUBLIC_BASE_URL 
      : `${requestUrl.protocol}//${requestUrl.host}`;
      
    const trackingUrl = `${baseUrl}/verify/${quc}`;
    
    // Generate image buffer
    const qrBuffer = await renderQRCode({
      data: trackingUrl,
      dotShape: validated.dotShape,
      eyeOuterShape: validated.eyeOuterShape,
      eyeInnerShape: validated.eyeInnerShape,
      fgColor: validated.fgColor,
      bgColor: validated.bgColor === 'transparent' ? 'rgba(0,0,0,0)' : validated.bgColor,
      overallShape: validated.overallShape,
      errorCorrection: validated.errorCorrection,
      sizePixels: validated.sizePixels,
      logoUrl: validated.logoUrl,
    });
    
    // Upload Buffer to Cloudinary
    const cloudinaryUrl = await uploadBufferToCloudinary(qrBuffer, 'qr-images');
    
    // Save to DB
    const db = await getDB();
    const record = await db.createQR({
      uniqueCode: quc,
      originalUrl: validated.originalUrl,
      trackingUrl: trackingUrl,
      label: validated.label,
      dotShape: validated.dotShape,
      eyeOuterShape: validated.eyeOuterShape,
      eyeInnerShape: validated.eyeInnerShape,
      fgColor: validated.fgColor,
      bgColor: validated.bgColor,
      overallShape: validated.overallShape,
      errorCorrection: validated.errorCorrection,
      logoUrl: validated.logoUrl,
      sizePixels: validated.sizePixels,
      imageStoragePath: cloudinaryUrl,
      createdBy: validated.createdBy || null,
      isActive: true,
    });
    
    return NextResponse.json({
      status: 'success',
      uniqueCode: record.uniqueCode,
      trackingUrl: record.trackingUrl,
      imageUrl: record.imageStoragePath,
    }, { status: 201 });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: true,
        code: 'VALIDATION_ERROR',
        message: 'Invalid input parameters.',
        details: error.issues,
        statusCode: 400
      }, { status: 400 });
    }

    console.error('QR Generation Error:', error);
    return NextResponse.json({
      error: true,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to generate QR code.',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      statusCode: 500
    }, { status: 500 });
  }
}
