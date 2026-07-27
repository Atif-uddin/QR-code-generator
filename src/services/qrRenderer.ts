import QRCode from 'qrcode';
import { createCanvas, CanvasRenderingContext2D } from 'canvas';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { DotShape, EyeInnerShape, EyeOuterShape, OverallShape } from '@/types/qr';

export interface RenderOptions {
  data: string;
  dotShape: DotShape;
  eyeOuterShape: EyeOuterShape;
  eyeInnerShape: EyeInnerShape;
  fgColor: string;
  bgColor: string;
  overallShape: OverallShape;
  errorCorrection: 'L' | 'M' | 'Q' | 'H';
  sizePixels: number;
  logoUrl?: string; // Cloudinary URL or local path
}

/**
 * Checks if a given row/col is part of the position detection patterns (eyes).
 */
function isEye(row: number, col: number, size: number): boolean {
  // Top-left
  if (row < 7 && col < 7) return true;
  // Top-right
  if (row < 7 && col >= size - 7) return true;
  // Bottom-left
  if (row >= size - 7 && col < 7) return true;
  return false;
}

function drawEye(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cellSize: number,
  outerShape: EyeOuterShape,
  innerShape: EyeInnerShape,
  fgColor: string
) {
  const eyeSize = cellSize * 7;
  const innerSize = cellSize * 3;
  
  ctx.fillStyle = fgColor;

  // Draw Outer Eye
  if (outerShape === 'rounded') {
    const radius = cellSize * 2;
    ctx.beginPath();
    ctx.roundRect(x, y, eyeSize, eyeSize, radius);
    ctx.fill();
    
    // Clear inner part to create the border
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.roundRect(x + cellSize, y + cellSize, cellSize * 5, cellSize * 5, radius - cellSize/2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  } else {
    // Square
    ctx.fillRect(x, y, eyeSize, eyeSize);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillRect(x + cellSize, y + cellSize, cellSize * 5, cellSize * 5);
    ctx.globalCompositeOperation = 'source-over';
  }

  // Draw Inner Eye
  const innerX = x + cellSize * 2;
  const innerY = y + cellSize * 2;
  
  if (innerShape === 'rounded') {
    const radius = cellSize;
    ctx.beginPath();
    ctx.roundRect(innerX, innerY, innerSize, innerSize, radius);
    ctx.fill();
  } else if (innerShape === 'dot') {
    const radius = innerSize / 2;
    ctx.beginPath();
    ctx.arc(innerX + radius, innerY + radius, radius, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Square
    ctx.fillRect(innerX, innerY, innerSize, innerSize);
  }
}

export async function renderQRCode(options: RenderOptions): Promise<Buffer> {
  const qr = QRCode.create(options.data, { errorCorrectionLevel: options.errorCorrection });
  const size = qr.modules.size;
  const data = qr.modules.data;
  
  // We draw the QR at 2x the requested size for better anti-aliasing during sharp scaling
  const outputSize = options.sizePixels;
  const renderSize = outputSize * 2;
  // Leave a 4-module quiet zone around the QR
  const quietZone = 4;
  const totalCells = size + quietZone * 2;
  const cellSize = renderSize / totalCells;
  
  const canvas = createCanvas(renderSize, renderSize);
  const ctx = canvas.getContext('2d');
  
  // Draw Background (can be transparent)
  if (options.bgColor.toLowerCase() !== 'transparent') {
    ctx.fillStyle = options.bgColor;
    ctx.fillRect(0, 0, renderSize, renderSize);
  }
  
  ctx.fillStyle = options.fgColor;

  // Draw modules
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (isEye(row, col, size)) continue; // Eyes are drawn separately
      
      const isDark = data[row * size + col];
      if (isDark) {
        const x = (col + quietZone) * cellSize;
        const y = (row + quietZone) * cellSize;
        
        ctx.beginPath();
        switch (options.dotShape) {
          case 'dots':
            ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize / 2 * 0.9, 0, Math.PI * 2);
            break;
          case 'rounded':
            ctx.roundRect(x, y, cellSize, cellSize, cellSize * 0.3);
            break;
          case 'extra-rounded':
            ctx.roundRect(x, y, cellSize, cellSize, cellSize * 0.5);
            break;
          case 'classy':
            // Custom shape - square with inner cut (represented simply here)
            ctx.roundRect(x, y, cellSize, cellSize, [0, cellSize * 0.5, 0, cellSize * 0.5]);
            break;
          case 'classy-rounded':
            ctx.roundRect(x, y, cellSize, cellSize, [cellSize * 0.5, cellSize * 0.5, 0, 0]);
            break;
          case 'square':
          default:
            ctx.rect(x, y, cellSize + 0.5, cellSize + 0.5); // Add 0.5 to fix anti-aliasing gaps
            break;
        }
        ctx.fill();
      }
    }
  }

  // Draw Eyes
  const eyeOffset = quietZone * cellSize;
  // Top-left
  drawEye(ctx, eyeOffset, eyeOffset, cellSize, options.eyeOuterShape, options.eyeInnerShape, options.fgColor);
  // Top-right
  drawEye(ctx, eyeOffset + (size - 7) * cellSize, eyeOffset, cellSize, options.eyeOuterShape, options.eyeInnerShape, options.fgColor);
  // Bottom-left
  drawEye(ctx, eyeOffset, eyeOffset + (size - 7) * cellSize, cellSize, options.eyeOuterShape, options.eyeInnerShape, options.fgColor);

  let imageBuffer = canvas.toBuffer('image/png');

  // Process with Sharp (Logo & Overall Shape)
  let sharpInstance = sharp(imageBuffer).resize(outputSize, outputSize);

  // Add Logo
  if (options.logoUrl) {
    try {
      // Calculate max 25% area -> side length approx 25% to leave plenty of error correction room
      const maxLogoSize = Math.floor(outputSize * 0.25); 
      
      let logoBuffer: Buffer;
      if (options.logoUrl.startsWith('http')) {
        const res = await fetch(options.logoUrl);
        if (!res.ok) throw new Error('Failed to fetch remote logo');
        logoBuffer = Buffer.from(await res.arrayBuffer());
      } else {
        logoBuffer = await fs.readFile(path.join(process.cwd(), 'public', options.logoUrl));
      }
      
      // Load and resize logo
      const resizedLogo = await sharp(logoBuffer)
        .resize(maxLogoSize, maxLogoSize, { fit: 'inside' })
        .toBuffer();
        
      const logoMetadata = await sharp(resizedLogo).metadata();
      const logoWidth = logoMetadata.width || maxLogoSize;
      const logoHeight = logoMetadata.height || maxLogoSize;
      
      // Create white background padding for the logo (proportional to output size)
      const padding = Math.max(4, Math.floor(outputSize * 0.02));
      const bgWidth = logoWidth + padding * 2;
      const bgHeight = logoHeight + padding * 2;
      
      const logoBgBuffer = await sharp({
        create: {
          width: bgWidth,
          height: bgHeight,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        }
      })
      .composite([{ input: resizedLogo, gravity: 'center' }])
      .png()
      .toBuffer();

      sharpInstance = sharpInstance.composite([{
        input: logoBgBuffer,
        gravity: 'center'
      }]);
      
      // Render composite to a new buffer so we can apply clipping later if needed
      imageBuffer = await sharpInstance.png().toBuffer();
      sharpInstance = sharp(imageBuffer);
    } catch (e) {
      console.error('Failed to embed logo:', e);
    }
  }

  // Apply Overall Shape Mask
  if (options.overallShape !== 'square') {
    const maskSvg = options.overallShape === 'circle' 
      ? `<svg width="${outputSize}" height="${outputSize}"><circle cx="${outputSize/2}" cy="${outputSize/2}" r="${outputSize/2}" /></svg>`
      : `<svg width="${outputSize}" height="${outputSize}"><rect x="0" y="0" width="${outputSize}" height="${outputSize}" rx="${outputSize * 0.1}" ry="${outputSize * 0.1}" /></svg>`;
    
    const maskBuffer = Buffer.from(maskSvg);
    
    // We compose the current image atop the mask using 'in' to clip
    sharpInstance = sharp(imageBuffer).composite([{
      input: maskBuffer,
      blend: 'dest-in'
    }]);
  }

  return await sharpInstance.png().toBuffer();
}
