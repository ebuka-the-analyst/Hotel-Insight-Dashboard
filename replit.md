# AutoInsight - Hotel Analytics Dashboard

## Overview

AutoInsight is a hotel analytics dashboard application that enables hotel managers to upload booking data, visualize performance metrics, and gain insights through advanced analytics. The application processes hotel booking datasets (Excel/CSV files), automatically maps columns to system fields, and provides comprehensive dashboards with KPIs, trends, and channel performance analysis.

The platform targets hotel properties (currently branded for Demo Hotel) and offers features including data upload with intelligent column mapping, real-time analytics dashboards, research-grade visualizations (seasonality, cancellation risk matrices), and AI-powered chat assistance for data queries.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack React Query for server state and caching
- **Styling**: Tailwind CSS v4 with custom design tokens, shadcn/ui component library (New York style)
- **Charts**: Recharts for data visualization
- **Build Tool**: Vite with custom plugins for Replit integration

The frontend follows a page-based architecture with shared layout components. Key pages include Dashboard, Upload, Analysis, Research, Agents, Team, and Settings. The UI implements a glassmorphism design with custom glass-card components and brand colors (primary orange #ffa536, secondary blue #11b6e9).

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful endpoints under `/api/*` prefix
- **File Processing**: Multer for file uploads, XLSX library for Excel/CSV parsing
- **Database ORM**: Drizzle ORM with PostgreSQL dialect

The server handles file uploads, intelligent column auto-mapping for hotel booking data, dataset management, and analytics computation. The auto-mapper uses fuzzy matching with predefined field aliases to map uploaded columns to system fields (bookingRef, guestName, arrivalDate, etc.).

### Data Storage
- **Database**: PostgreSQL (configured via DATABASE_URL environment variable)
- **Schema**: Three main tables - `bookings` (hotel reservation data), `datasets` (uploaded file metadata), `analyticsCache` (pre-computed analytics)
- **Migrations**: Drizzle Kit for schema management (`db:push` command)

The booking schema captures comprehensive hotel data including core booking info, dates, room details, financial metrics (ADR, total amount), distribution channels, guest behavior (lead time, repeat guest status), and operational fields.

### Build and Deployment
- **Development**: Vite dev server with HMR on port 5000
- **Production Build**: Custom build script using esbuild for server bundling and Vite for client
- **Output**: Server bundle as `dist/index.cjs`, client assets in `dist/public`

## External Dependencies

### Database
- PostgreSQL database (required, connection via DATABASE_URL)
- connect-pg-simple for session storage

### Key Libraries
- **UI Components**: Full shadcn/ui component suite with Radix UI primitives
- **Data Processing**: XLSX for spreadsheet parsing, date-fns for date manipulation
- **Validation**: Zod with drizzle-zod integration for schema validation
- **HTTP Client**: Built-in fetch with custom API client wrapper

### Replit-Specific Integrations
- @replit/vite-plugin-runtime-error-modal for development error display
- @replit/vite-plugin-cartographer and dev-banner for development environment
- Custom meta-images plugin for OpenGraph image handling with Replit domains

### Font Services
- Google Fonts: Inter (UI), Fraunces (display/headlines), JetBrains Mono (code)