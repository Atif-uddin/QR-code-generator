# TalentYug QR Code Generator & Management System

A production-ready web application for businesses to generate, track, and manage highly customized QR codes with unique verification IDs and sticker sheet print layouts.

## Tech Stack

*   **Next.js 14 (App Router)** - For a unified, high-performance full-stack React framework with serverless API capabilities.
*   **TypeScript** - Enforces strict typing for a robust and maintainable codebase.
*   **MongoDB (Mongoose)** - Used as the primary NoSQL document store to quickly iterate and handle flexible scan logs arrays.
*   **PostgreSQL (Supabase via Prisma)** - Included as the secondary DB via an adapter pattern for relational data integrity (Bonus feature).
*   **Cloudinary** - Fully integrated for serverless, reliable cloud storage of all generated QR images and user-uploaded logos.
*   **Tailwind CSS** - For rapid, utility-first UI styling with a premium, sleek aesthetic.
*   **qrcode** - For generating the raw 2D QR Code matrix reliably.
*   **canvas** - For programmatic, server-side drawing of custom dot and eye shapes based on the QR matrix.
*   **sharp** - For high-performance image processing, overall shape clipping (circles/rounded rectangles), and logo embedding.
*   **pdfkit** - To generate multi-page PDF sticker sheet layouts for bulk printing.
*   **nanoid** - For fast, collision-resistant unique 12-character ID generation (QUC).
*   **zod** - For strict, schema-based server-side request validation.

## Architecture Overview

The system uses a monolithic architecture built on Next.js. 
- **Frontend (`src/app/page.tsx`, `src/app/layout.tsx`, `src/app/print-layout/page.tsx`)**: Renders the React UI client-side, communicates with the API routes.
- **API Layer (`src/app/api/...`)**: Next.js Route Handlers validate inputs using Zod and delegate work to services.
- **Service Layer (`src/services/...`)**: Contains business logic like QUC generation (`qucGenerator.ts`), QR rendering (`qrRenderer.ts`), and print layout compilation (`printLayout.ts`).
- **Data Layer (`src/db/...`)**: Uses an Adapter Factory (`src/db/index.ts`) that reads `DB_PROVIDER` to inject either `MongoDBAdapter` or `SupabaseAdapter` at runtime.

## Database Schema

```typescript
interface QRRecord {
  id: string; // ObjectId or UUID
  uniqueCode: string; // 12-char alphanumeric
  originalUrl: string; // The URL to redirect to
  trackingUrl: string; // /verify/<uniqueCode>
  label: string | null; 
  dotShape: 'square' | 'rounded' | 'dots' | 'classy' | 'classy-rounded' | 'extra-rounded';
  eyeOuterShape: 'square' | 'rounded';
  eyeInnerShape: 'square' | 'dot' | 'rounded';
  fgColor: string; // Hex color
  bgColor: string; // Hex color
  overallShape: 'square' | 'circle' | 'rounded-rectangle';
  errorCorrection: 'L' | 'M' | 'Q' | 'H';
  logoUrl: string | null;
  sizePixels: number;
  imageStoragePath: string; // Path to generated PNG
  scanCount: number;
  scanLogs: Array<{
    scannedAt: Date;
    ipAddress: string;
    userAgent: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  isActive: boolean;
}
```

## Setup & Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd qr-code-generator
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start MongoDB via Docker (Optional if using local mongo):**
    ```bash
    docker run -d -p 27017:27017 --name local-mongo mongo:latest
    ```

4.  **Configure Environment Variables:**
    Copy `.env.example` to `.env` and adjust the variables.
    ```bash
    cp .env.example .env
    ```

5.  **Run the application (Development Mode):**
    ```bash
    npm run dev
    ```
    *(Note: `npm run dev` is configured to bind to `0.0.0.0`, exposing the app to your local Wi-Fi network for mobile testing).*

6.  **Access the Dashboard:**
    Open [http://localhost:3000](http://localhost:3000)

7.  **Mobile Network Testing (Localtunnel):**
    If WSL2 prevents direct local IP connections from your phone, run localtunnel:
    ```bash
    npx localtunnel --port 3000
    ```
    Set `NEXT_PUBLIC_BASE_URL` to the generated URL to test mobile scanning.

*(Note: If using Supabase, set `DB_PROVIDER=supabase` in `.env` and run `npx prisma db push` before starting the app).*

## Environment Variables

| Variable | Required | Description |
| :--- | :--- | :--- |
| `DB_PROVIDER` | Yes | Either `mongodb` or `supabase` |
| `MONGODB_URI` | If DB_PROVIDER=mongodb | Connection string for MongoDB |
| `DATABASE_URL` | If DB_PROVIDER=supabase | Postgres connection string for Prisma |
| `DIRECT_URL` | If DB_PROVIDER=supabase | Postgres direct connection string |
| `NEXT_PUBLIC_BASE_URL` | Yes | The host URL used to construct the tracking links (e.g. `http://localhost:3000`) |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary account cloud name |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API Key |
| `CLOUDINARY_API_SECRET`| Yes | Cloudinary API Secret |

## API Reference

| Method | Endpoint | Request Body | Response |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/qr/generate` | `GenerateQRSchema` (originalUrl, colors, shapes...) | `{ uniqueCode, trackingUrl, imageUrl }` |
| `GET` | `/api/qr/:uniqueCode` | None | `QRRecord` object |
| `GET` | `/api/qr` | Query Params: `page`, `limit`, `label`, `isActive` | `{ data: QRRecord[], total, page, totalPages }` |
| `DELETE` | `/api/qr/:uniqueCode` | None | `{ status: 'success' }` |
| `PATCH` | `/api/qr/:uniqueCode/activate` | None | `{ status: 'success' }` |
| `GET` | `/api/qr/:uniqueCode/scan-logs` | Query Params: `page`, `limit` | `{ data: ScanLog[], total, page }` |
| `POST` | `/api/qr/upload-logo` | `multipart/form-data` with `logo` file | `{ logoUrl }` |
| `POST` | `/api/qr/print-layout` | `PrintLayoutConfig` (paperSize, rows, cols, qrCodes...) | Returns PDF or PNG File Download |
| `GET` | `/verify/:uniqueCode` | None | **Browser:** HTML Redirect Page<br>**API:** JSON `{ status, scanCount... }` |

## QR Customization Options

| Parameter | Supported Values |
| :--- | :--- |
| `dotShape` | `square`, `rounded`, `dots`, `classy`, `classy-rounded`, `extra-rounded` |
| `eyeOuterShape` | `square`, `rounded` |
| `eyeInnerShape` | `square`, `dot`, `rounded` |
| `overallShape` | `square`, `circle`, `rounded-rectangle` |
| `errorCorrection` | `L`, `M`, `Q`, `H` |
| `Colors` | Any valid `#Hex` color. `bgColor` supports `transparent`. |
| `Logo` | Valid image file (PNG/JPG). Scaled to max 25% width to preserve 'H' (High) error correction readability on mobile scanners. |

## Print Layout Logic

The print layout system accepts an array of `uniqueCodes` and physical page dimensions (A4, A5, etc.). 
1. It retrieves the stored QR images.
2. It calculates the exact cell dimensions by subtracting margins from the page dimensions and dividing by rows/columns.
3. It scales the QR images down to fit inside the computed cells, reserving space for optional bottom labels.
4. Using `pdfkit` (for multi-page outputs) or `sharp` (for drawing grids), it composites the images into standard physical print formats and returns them as a single downloadable blob to the client.

## Unique Code & Tracking

When a QR generation request hits the API, `nanoid` generates a 12-character alphanumeric code (QUC). Before creation, the system checks the Database up to 5 times for collisions to guarantee uniqueness. 

The QR code is encoded with the tracking URL: `https://<domain>/verify/<QUC>`. 
When scanned, the `/verify/:uniqueCode` endpoint increments the scan count atomically, appends the IP/User-Agent to the logs array, and immediately responds:
- If requested by an API client (Accept: application/json), it returns a JSON verification packet.
- If requested by a browser, it serves a styled HTML webpage that confirms authenticity and executes a robust JavaScript `window.location.href` (with a `<meta http-equiv="refresh">` fallback) to safely redirect the user to the `originalUrl` bypassing strict mobile in-app browser restrictions.

## Known Limitations & Future Improvements
- **Analytics Dashboard**: The dashboard currently shows raw numbers; adding charts to visualize scan frequency over time would greatly improve UX.

## Time Taken
Approximately 4 hours.
