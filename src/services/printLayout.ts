import sharp, { OverlayOptions } from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { getDB } from '@/db';
import { QRRecord } from '@/types/qr';

export interface PrintLayoutConfig {
  paperSize: 'A4' | 'A5' | 'Letter' | 'Custom';
  columns: number;
  rows: number;
  qrCodes: string[]; // array of uniqueCodes
  showLabel: boolean;
  showUniqueCode: boolean;
  margin: number;
  padding: number;
  customWidth?: number;
  customHeight?: number;
}

const PaperDimensions: Record<string, { width: number; height: number }> = {
  A4: { width: 794, height: 1123 }, // 96 DPI
  A5: { width: 559, height: 794 },
  Letter: { width: 816, height: 1056 },
};

export async function generatePrintLayout(config: PrintLayoutConfig): Promise<Buffer[]> {
  const db = await getDB();
  
  // Resolve paper dimensions
  const pageWidth = PaperDimensions[config.paperSize]?.width || config.customWidth || 794;
  const pageHeight = PaperDimensions[config.paperSize]?.height || config.customHeight || 1123;
  
  const { columns, rows, margin, padding, qrCodes } = config;
  
  // Calculate cell sizes
  const cellWidth = Math.floor((pageWidth - (columns + 1) * margin) / columns);
  const cellHeight = Math.floor((pageHeight - (rows + 1) * margin) / rows);
  const qrSize = Math.min(cellWidth, cellHeight) - padding * 2;
  
  const qrsPerPage = columns * rows;
  const pagesCount = Math.ceil(qrCodes.length / qrsPerPage);
  
  const pages: Buffer[] = [];
  
  // Process each page
  for (let page = 0; page < pagesCount; page++) {
    const pageCodes = qrCodes.slice(page * qrsPerPage, (page + 1) * qrsPerPage);
    
    // Create base white page
    const baseCanvas = sharp({
      create: {
        width: pageWidth,
        height: pageHeight,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    });
    
    const composites: OverlayOptions[] = [];
    
    // Draw each QR code in its grid cell
    for (let i = 0; i < pageCodes.length; i++) {
      const code = pageCodes[i];
      const record = await db.getQRByCode(code);
      if (!record) continue;
      
      const col = i % columns;
      const row = Math.floor(i / columns);
      
      const cellX = margin + col * (cellWidth + margin);
      const cellY = margin + row * (cellHeight + margin);
      
      // Load and resize QR Image
      try {
        let qrBufferInput: Buffer | string;
        if (record.imageStoragePath.startsWith('http')) {
          const res = await fetch(record.imageStoragePath);
          if (!res.ok) throw new Error('Failed to fetch remote QR');
          qrBufferInput = Buffer.from(await res.arrayBuffer());
        } else {
          const localPath = path.join(process.cwd(), 'public', record.imageStoragePath);
          await fs.access(localPath);
          qrBufferInput = localPath;
        }

        const qrBuffer = await sharp(qrBufferInput)
          .resize(qrSize, qrSize, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
          .toBuffer();
          
        const qrX = cellX + padding + Math.floor((cellWidth - padding * 2 - qrSize) / 2);
        const qrY = cellY + padding;
        
        composites.push({
          input: qrBuffer,
          top: qrY,
          left: qrX,
        });
        
        // Add Text using SVG overlay because sharp text rendering is limited
        let textSvg = '';
        if (config.showLabel && record.label) {
          textSvg += `<text x="50%" y="20" font-family="sans-serif" font-size="14" fill="black" text-anchor="middle">${record.label}</text>`;
        }
        if (config.showUniqueCode) {
          textSvg += `<text x="50%" y="${config.showLabel && record.label ? 40 : 20}" font-family="monospace" font-size="12" fill="gray" text-anchor="middle">${record.uniqueCode}</text>`;
        }
        
        if (textSvg) {
          const textOverlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${cellWidth}" height="${cellHeight - qrSize - padding}"><g>${textSvg}</g></svg>`);
          composites.push({
            input: textOverlay,
            top: qrY + qrSize + 5,
            left: cellX,
          });
        }
        
      } catch (err) {
        console.warn(`Could not load QR image for code ${code}:`, err);
      }
    }
    
    // Render page
    const pageBuffer = await baseCanvas.composite(composites).png().toBuffer();
    pages.push(pageBuffer);
  }
  
  return pages;
}
