import { nanoid } from 'nanoid';
import { getDB } from '@/db';

/**
 * Generates a Unique 12-character uppercase QR Code (QUC).
 * Guarantees uniqueness by checking the database up to 5 times.
 */
export async function generateUniqueQUC(): Promise<string> {
  const db = await getDB();
  const maxRetries = 5;

  for (let i = 0; i < maxRetries; i++) {
    const code = nanoid(12).toUpperCase();
    
    // Replace non-alphanumeric characters just to be safe, nanoid is url-safe though
    const safeCode = code.replace(/[^A-Z0-9]/g, 'X').substring(0, 12);
    
    const existing = await db.getQRByCode(safeCode);
    if (!existing) {
      return safeCode;
    }
  }

  throw new Error('Failed to generate a unique QUC after 5 attempts.');
}
