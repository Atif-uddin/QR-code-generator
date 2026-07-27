import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generatePrintLayout } from '@/services/printLayout';
import PDFDocument from 'pdfkit';

const PrintLayoutSchema = z.object({
  paperSize: z.enum(['A4', 'A5', 'Letter', 'Custom']),
  columns: z.number().min(1).max(10),
  rows: z.number().min(1).max(20),
  qrCodes: z.array(z.string()).min(1),
  showLabel: z.boolean().default(true),
  showUniqueCode: z.boolean().default(true),
  margin: z.number().min(0).default(20),
  padding: z.number().min(0).default(10),
  customWidth: z.number().optional(),
  customHeight: z.number().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = PrintLayoutSchema.parse(body);

    const pages = await generatePrintLayout(validated);

    if (pages.length === 1) {
      // Single page - return as PNG
      return new NextResponse(new Uint8Array(pages[0]), {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': 'attachment; filename="qr-layout.png"',
        },
      });
    }

    // Multiple pages - generate PDF
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ autoFirstPage: false });
      const chunks: Buffer[] = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      for (const pageBuffer of pages) {
        let width = 794;
        let height = 1123;
        if (validated.paperSize === 'Letter') { width = 816; height = 1056; }
        else if (validated.paperSize === 'A5') { width = 559; height = 794; }
        else if (validated.customWidth && validated.customHeight) { width = validated.customWidth; height = validated.customHeight; }
        
        doc.addPage({ size: [width, height] });
        doc.image(pageBuffer, 0, 0, { width, height });
      }
      doc.end();
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="qr-layout.pdf"',
      },
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: true,
        code: 'VALIDATION_ERROR',
        message: 'Invalid print layout configuration.',
        details: error.issues,
        statusCode: 400
      }, { status: 400 });
    }

    console.error('Print Layout Error:', error);
    return NextResponse.json({
      error: true,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to generate print layout.',
      statusCode: 500
    }, { status: 500 });
  }
}
