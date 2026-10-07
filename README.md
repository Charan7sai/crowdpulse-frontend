## Crowd Management Frontend
# CrowdPulse AI

**Real-Time Crowd Risk Monitoring System**

AI-powered crowd density monitoring and risk prediction system using YOLOv8 object detection for real-time people counting and risk assessment.

![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?logo=next.js) ![React](https://img.shields.io/badge/React-19.2.3-blue?logo=react) ![Recharts](https://img.shields.io/badge/Recharts-3.7.0-orange)

---

## Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [API Integration](#api-integration)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [License](#license)
- [Additional Resources](#additional-resources-nextjs-documentation)

---

## About

**CrowdPulse AI** is a real-time crowd monitoring system that uses the YOLOv8 AI model for accurate people detection and crowd risk assessment. Designed for fixed-zone monitoring scenarios such as building lobbies, event spaces, retail stores, and public venues, the system provides intelligent crowd management capabilities.

### Key Capabilities

- **4-Level Risk Classification**: Automatically categorizes crowd density as Low, Medium, High, or Critical
- **Surge Detection**: Tracks growth rates to identify sudden crowd increases before they become dangerous
- **Persistence Monitoring**: Measures how long crowds remain in high-risk states
- **Historical Analysis**: Stores timestamped detection logs for trend analysis and reporting

The system is built on a microservices architecture with this Next.js frontend communicating with a separate Python Flask backend that handles the AI processing, camera feeds, and detection logic.

---

## Features

### 🎯 Real-Time Detection
YOLOv8-powered people counting with 2-second update intervals for immediate crowd awareness.

### 📊 Density Analysis
Calculate and display occupancy percentage based on configurable zone capacity (currently set to 5 people).

### ⚠️ Risk Classification
4-level risk system with color-coded alerts:
- **Low** (Green): Safe conditions
- **Medium** (Amber): Monitor closely
- **High** (Orange): Intervention may be needed
- **Critical** (Red): Immediate action required

### 📈 Surge Detection
Track growth rate percentage to identify sudden crowd increases and prevent dangerous situations.

### ⏱️ Persistence Monitoring
Measure duration in high-risk states with overload duration tracking (in seconds).

### 📺 Interactive Dashboard
- Live camera feed with YOLOv8 detection overlays
- Real-time metrics cards showing current crowd status
- Density trend charts (last 2 minutes)
- Density heatmaps with 15-second buckets (last 5 minutes)
- Responsive design for desktop and tablet viewing

### 📝 Data Logging
Timestamped historical records enable trend analysis, reporting, and post-event review.

### 🛡️ Robust Error Handling
Automatic backend health checking with graceful error handling when services are unavailable.

---

## Tech Stack

### Frontend Technologies

- **Next.js 16.1.6** - React framework with App Router for server-side rendering
- **React 19.2.3** - UI component library
- **Recharts 3.7.0** - Data visualization library for charts and graphs
- **CSS Modules** - Component-scoped styling
- **ESLint** - Code quality and consistency

### Backend Technologies (Separate Service)

- **Python + Flask** - REST API server
- **YOLOv8** - State-of-the-art object detection AI model
- **OpenCV** - Video processing and computer vision
- **PyTorch** - Deep learning framework

### Architecture Pattern

- **Microservices Architecture** - Separated frontend and backend services
- **RESTful API Communication** - JSON-based data exchange
- **Server-Side Rendering (SSR)** - Next.js App Router with React 19
- **Real-Time Polling** - Multiple polling intervals for different data types

---

## Architecture

### System Overview

CrowdPulse AI consists of two separate services working together:

1. **Frontend Service** (this repository) - Next.js application running on port 3000
2. **Backend Service** (separate repository) - Flask API running on port 5001

### Data Flow

```
Camera/Video Source
       ↓
Backend: Video Capture (OpenCV)
       ↓
Backend: YOLOv8 Processing (every 2 seconds)
       ↓
Backend: Metrics Calculation
    - People count
    - Density ratio (count / capacity)
    - Growth rate (percentage change)
    - Risk level (Low/Medium/High/Critical)
    - Surge flag detection
    - High-state duration tracking
       ↓
Backend: REST API Endpoints
    - /detect (current stats)
    - /history (historical logs)
    - /video_feed (live stream)
       ↓
Frontend: Polling & Display
    - Dashboard polls every 2s/5s/10s
    - Real-time metrics cards
    - Live camera feed
    - Interactive charts and heatmaps
       ↓
User Interface
```

### Component Interaction

| Frontend Component | Frontend API Route | Backend Endpoint | Purpose |
|-------------------|-------------------|------------------|---------|
| Dashboard metrics | `/api/stats` | `http://127.0.0.1:5001/detect` | Current crowd statistics |
| Trend chart | `/api/history?minutes=2` | `http://127.0.0.1:5001/history` | 2-minute historical data |
| Heatmap | `/api/history?minutes=5` | `http://127.0.0.1:5001/history` | 5-minute historical data |
| Video feed | Direct | `http://127.0.0.1:5001/video_feed` | Live MJPEG stream |

---

## Prerequisites

Before installing the frontend, ensure you have:

### Required Software

- **Node.js** version 18 or higher ([Download](https://nodejs.org/))
- **npm**, **yarn**, **pnpm**, or **bun** package manager

### Backend Service Requirement

**CRITICAL**: This repository contains only the frontend application. The Python Flask backend with YOLOv8 must be running separately on port 5001 for full functionality.

The backend must provide:
- `/detect` endpoint - Returns current crowd metrics
- `/history` endpoint - Returns historical detection logs
- `/video_feed` endpoint - Streams live video with detection overlays

### Hardware Requirements

- Camera or video source configured in the backend for crowd monitoring
- Sufficient system resources for AI processing (handled by backend)

---

## Installation

### Step 1: Clone the Repository

```bash
git clone [repository-url]
cd crowd-management-frontend
```

### Step 2: Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

### Step 3: Verify Backend is Running

Before starting the frontend, verify the Flask backend is accessible:

```bash
curl http://127.0.0.1:5001/detect
```

**Expected response**: JSON object with crowd metrics:
```json
{
  "current_count": 3,
  "density_ratio": 0.6,
  "growth_rate": 15.5,
  "risk_level": "Medium",
  "risk_score": 0.65,
  "surge_flag": false,
  "duration_in_high_state": 12,
  "timestamp": "2024-01-15T10:30:45"
}
```

If the backend is not running, the dashboard will display "Backend Offline" messages.

---

## Configuration

### Backend API Endpoints

The following endpoints are currently **hardcoded** in the application:

| Configuration | Current Value | File Location |
|--------------|---------------|---------------|
| Stats endpoint | `http://127.0.0.1:5001/detect` | `/src/app/api/stats/route.js` (line 3) |
| History endpoint | `http://127.0.0.1:5001/history` | `/src/app/api/history/route.js` (line 7) |
| Video feed | `http://127.0.0.1:5001/video_feed` | `/src/app/dashboard/page.js` (line ~100) |

### Customizing Backend URL

If your backend runs on a different host or port, update the following files:

**1. Update Stats API Route:**
```javascript
// File: /src/app/api/stats/route.js
const response = await fetch("http://YOUR_HOST:YOUR_PORT/detect", {
  cache: "no-store",
});
```

**2. Update History API Route:**
```javascript
// File: /src/app/api/history/route.js
const response = await fetch(
  `http://YOUR_HOST:YOUR_PORT/history?minutes=${minutes}`,
  { cache: "no-store" }
);
```

**3. Update Video Feed URL:**
Search for `http://127.0.0.1:5001/video_feed` in `/src/app/dashboard/page.js` and update the URL in the `<img>` tag.

### Zone Capacity Setting

The zone capacity determines the density percentage calculation:

```
Density % = (Current People Count / Zone Capacity) × 100%
```

**Current setting**: 5 people

To modify this value:
```javascript
// File: /src/app/dashboard/page.js (line 23)
const ZONE_CAPACITY = 5; // Change this value
```

Set this to match the actual capacity of your monitored area.

### Polling Intervals

The dashboard uses three different polling intervals:

| Data Type | Interval | Purpose |
|----------|----------|---------|
| Current stats | 2 seconds | Real-time metrics updates |
| Trend chart | 5 seconds | 2-minute historical data |
| Heatmap | 10 seconds | 5-minute historical data |

These intervals are configured in `/src/app/dashboard/page.js` and can be adjusted based on your performance requirements.

---

## Usage

### Running the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

The application will start on **http://localhost:3000**

Open your browser and navigate to this URL to access the application.

### Running Production Build

```bash
# Build the application
npm run build

# Start the production server
npm run start
```

### Application Pages

#### 1. Home / Landing Page (`/`)

**URL**: `http://localhost:3000/`

Marketing-style landing page that introduces CrowdPulse AI to new users:
- Hero section with project branding and tagline
- "What Is CrowdPulse AI?" explanation section
- Key features grid showcasing 6 main capabilities
- "How It Works" 4-step process visualization
- Technology stack showcase
- Call-to-action button linking to dashboard

**Purpose**: Educate users about the system before they access the monitoring interface.

#### 2. Dashboard (`/dashboard`)

**URL**: `http://localhost:3000/dashboard`

Real-time monitoring interface with comprehensive crowd analytics:

##### Metric Cards (6 Cards)

| Metric | Description |
|--------|-------------|
| **People Count** | Current number of people detected by YOLOv8 |
| **Density** | Occupancy percentage (count / zone capacity × 100%) |
| **Risk Level** | Current classification (Low/Medium/High/Critical) |
| **Growth Rate** | Percentage change in crowd size |
| **Overload Duration** | Time spent in high-risk state (seconds) |
| **Surge Alert** | Warning flag when rapid growth detected |

##### Live Camera Feed

Streams video from backend with YOLOv8 detection bounding boxes overlaid on detected people. Updates continuously via MJPEG stream.

##### Density Trend Chart

Line graph showing crowd density over the last 2 minutes. Updates every 5 seconds. Helps identify patterns and trends in real-time.

##### Density Heatmap

Color-coded grid showing density patterns over the last 5 minutes using 15-second buckets. Darker colors indicate higher density periods.

### Risk Level Color Coding

The dashboard uses color-coded alerts for immediate visual recognition:

| Risk Level | Color | Hex Code | Meaning |
|-----------|-------|----------|---------|
| **Low** | 🟢 Green | `#10b981` | Density below threshold, safe conditions |
| **Medium** | 🟡 Amber | `#f59e0b` | Moderate density, monitor closely |
| **High** | 🟠 Orange | `#f97316` | High density, intervention may be needed |
| **Critical** | 🔴 Red | `#ef4444` | Dangerous density, immediate action required |

### Navigation

- **Logo**: Click to return to home page
- **Home Link**: Returns to landing page (`/`)
- **Dashboard Link**: Goes to monitoring interface (`/dashboard`)

---

## Project Structure

```
crowd-management-frontend/
├── public/
│   ├── CrowdPulse-logo.svg           # Application logo (48KB)
│   └── [other SVG assets]             # Next.js default icons
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── history/
│   │   │   │   └── route.js          # Proxy to backend /history endpoint
│   │   │   └── stats/
│   │   │       └── route.js          # Proxy to backend /detect endpoint
│   │   ├── dashboard/
│   │   │   ├── page.js               # Main monitoring dashboard (322 lines)
│   │   │   └── Dashboard.module.css  # Dashboard styles
│   │   ├── home/
│   │   │   ├── HomePageLayout.js     # Landing page component (187 lines)
│   │   │   └── Landing.module.css    # Landing page styles
│   │   ├── layout.js                 # Root layout with metadata
│   │   ├── page.js                   # Root page (renders HomePageLayout)
│   │   ├── globals.css               # Global styles
│   │   └── favicon.ico               # Browser tab icon
│   └── components/
│       ├── Navbar.js                  # Navigation component
│       └── Navbar.module.css          # Navigation styles
├── package.json                       # Project dependencies and scripts
├── README.md                          # This file
├── next.config.js                     # Next.js configuration
└── .eslintrc.json                     # ESLint configuration
```

### Key Files Explained

#### `src/app/api/stats/route.js`
Next.js API route that proxies requests to the Flask backend's `/detect` endpoint. Returns current crowd metrics including count, density, risk level, and growth rate. Handles backend offline scenarios with 503 error response and fallback data.

#### `src/app/api/history/route.js`
Proxies requests to backend's `/history` endpoint with configurable minutes query parameter (default: 2). Returns array of historical detection logs for trend analysis and visualization.

#### `src/app/dashboard/page.js`
Main dashboard component implementing:
- Three separate polling intervals (2s for stats, 5s for trend chart, 10s for heatmap)
- Six metric cards with real-time data display
- Live video feed embedding via `<img>` tag with MJPEG stream
- Recharts visualizations (LineChart for trends, custom grid for heatmap)
- Risk level color coding using `RISK_COLORS` constant
- Zone capacity constant (`ZONE_CAPACITY = 5`) for density calculations

#### `src/app/home/HomePageLayout.js`
Marketing-style landing page featuring:
- Hero section with CrowdPulse AI branding and tagline
- "What Is CrowdPulse AI?" explainer section
- 6-feature grid highlighting key capabilities
- 4-step "How It Works" process flow
- Technology stack showcase
- Call-to-action button linking to dashboard

#### `src/components/Navbar.js`
Shared navigation component with:
- CrowdPulse logo (40×40px)
- Two navigation links: Home (`/`) and Dashboard (`/dashboard`)
- Consistent styling across all pages

#### `src/app/layout.js`
Root layout defining:
- Page metadata: title ("CrowdPulse AI — Real-Time Crowd Risk Monitoring") and description (mentions YOLOv8)
- Font optimization using Geist font family
- Navbar inclusion on all pages

---

## API Integration

The frontend communicates with a Flask backend through three main integration points. All API routes in the frontend act as **proxies** to avoid CORS issues and provide a unified API surface.

### 1. Current Stats Endpoint

**Frontend API Route**: `GET /api/stats`
**Backend Endpoint**: `GET http://127.0.0.1:5001/detect`
**Polling Frequency**: Every 2 seconds (from dashboard)

**Response Format**:
```json
{
  "current_count": 3,
  "density_ratio": 0.6,
  "growth_rate": 15.5,
  "risk_level": "Medium",
  "risk_score": 0.65,
  "surge_flag": false,
  "duration_in_high_state": 12,
  "timestamp": "2024-01-15T10:30:45"
}
```

**Fields**:
- `current_count`: Number of people detected by YOLOv8
- `density_ratio`: Decimal ratio (0.0 to 1.0+)
- `growth_rate`: Percentage change in crowd size
- `risk_level`: String ("Low" | "Medium" | "High" | "Critical")
- `risk_score`: Numeric risk assessment (0.0 to 1.0)
- `surge_flag`: Boolean indicating rapid growth detection
- `duration_in_high_state`: Seconds spent in high-risk state
- `timestamp`: ISO 8601 timestamp

**Error Handling**: Returns 503 status with error message if backend is offline or unreachable.

### 2. Historical Data Endpoint

**Frontend API Route**: `GET /api/history?minutes=X`
**Backend Endpoint**: `GET http://127.0.0.1:5001/history?minutes=X`

**Query Parameters**:
- `minutes` (optional, default: 2): Number of minutes of historical data to retrieve

**Polling Frequency**:
- Every 5 seconds for 2-minute trend chart (`/api/history?minutes=2`)
- Every 10 seconds for 5-minute heatmap (`/api/history?minutes=5`)

**Response Format**:
```json
[
  {
    "current_count": 3,
    "density_ratio": 0.6,
    "risk_level": "Medium",
    "timestamp": "2024-01-15T10:30:45"
  },
  {
    "current_count": 4,
    "density_ratio": 0.8,
    "risk_level": "High",
    "timestamp": "2024-01-15T10:30:47"
  }
]
```

**Error Handling**: Returns empty array `[]` with 503 status if backend unavailable.

### 3. Video Feed Endpoint

**Direct Backend URL**: `http://127.0.0.1:5001/video_feed`
**Integration Point**: Embedded in dashboard via `<img>` tag
**Format**: MJPEG (Motion JPEG) stream with YOLOv8 detection bounding boxes overlaid

**No Frontend Proxy**: Video feed is accessed directly from browser to backend for performance reasons.

**Usage in Code**:
```javascript
<img
  src="http://127.0.0.1:5001/video_feed"
  alt="Live Camera Feed"
/>
```

### Backend Requirements

All three endpoints must be operational for full dashboard functionality:

| Endpoint Status | Dashboard Behavior |
|----------------|-------------------|
| Backend online | Full functionality with real-time updates |
| `/detect` offline | Metric cards show "Backend Offline" message |
| `/history` offline | Charts display empty or stale data |
| `/video_feed` offline | Video feed displays broken image placeholder |

---

## Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload on port 3000 |
| `npm run build` | Create optimized production build |
| `npm run start` | Run production build (requires `build` first) |
| `npm run lint` | Run ESLint to check code quality |

### Code Style

- **ESLint**: Configured with `eslint-config-next` for Next.js best practices
- **CSS Modules**: Used for component-scoped styling (`.module.css` files)
- **Next.js 16 App Router**: Follows modern Next.js conventions with `/app` directory

### Development Workflow

1. **Start Backend**: Ensure Flask backend is running on port 5001 before starting frontend
   ```bash
   curl http://127.0.0.1:5001/detect
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. **Access Application**: Navigate to `http://localhost:3000`

4. **Make Changes**: Edit files in `src/` directory - changes will hot reload automatically

5. **Test Both Pages**:
   - Landing page: `http://localhost:3000/`
   - Dashboard: `http://localhost:3000/dashboard`

6. **Verify API Integration**: Open browser DevTools Network tab and confirm:
   - `/api/stats` calls every 2 seconds
   - `/api/history` calls every 5-10 seconds
   - Responses contain valid JSON data

### Key Development Considerations

**Polling Intervals**: Currently set to 2s/5s/10s. Can be adjusted in `/src/app/dashboard/page.js`:
```javascript
useEffect(() => {
  fetchStats();
  const interval = setInterval(fetchStats, 2000); // Adjust here
  return () => clearInterval(interval);
}, [fetchStats]);
```

**Risk Level Thresholds**: Defined in dashboard using `RISK_COLORS` object. Modify colors in the constant:
```javascript
const RISK_COLORS = {
  Low: "#10b981",
  Medium: "#f59e0b",
  High: "#f97316",
  Critical: "#ef4444",
};
```

**Zone Capacity**: Affects density percentage calculations. Update in dashboard:
```javascript
const ZONE_CAPACITY = 5; // Modify this value
```

**Backend URL Configuration**: Currently hardcoded in multiple files. For production deployments, consider using environment variables:
- Create `.env.local` file
- Define `NEXT_PUBLIC_BACKEND_URL=http://your-backend:port`
- Update API routes to use `process.env.NEXT_PUBLIC_BACKEND_URL`

### Testing Backend Connection

Before running the frontend, verify all backend endpoints are accessible:

```bash
# Test stats endpoint
curl http://127.0.0.1:5001/detect

# Test history endpoint
curl http://127.0.0.1:5001/history?minutes=2

# Test video feed (opens in browser)
open http://127.0.0.1:5001/video_feed
```

All endpoints should return valid responses.

---

## Troubleshooting

### Problem: "Backend Offline" Message on Dashboard

**Symptoms**: Dashboard displays "Backend Offline" or error messages in metric cards.

**Causes**:
- Flask backend not running
- Backend not accessible on port 5001
- Network connectivity issues

**Solutions**:
1. Verify backend is running:
   ```bash
   curl http://127.0.0.1:5001/detect
   ```
   Should return JSON with crowd metrics.

2. Check backend logs for errors or startup failures

3. Ensure no firewall is blocking port 5001:
   ```bash
   # macOS/Linux
   sudo lsof -i :5001
   ```

4. Verify backend started successfully with camera/video source configured

5. Check backend health by visiting `http://127.0.0.1:5001/detect` directly in browser

---

### Problem: Video Feed Not Displaying

**Symptoms**: Dashboard shows broken image icon instead of live camera feed.

**Causes**:
- Backend `/video_feed` endpoint not streaming
- Camera not connected or accessible
- OpenCV initialization failure

**Solutions**:
1. Check video feed directly in browser:
   ```
   http://127.0.0.1:5001/video_feed
   ```
   Should display MJPEG stream with detection overlays.

2. Verify camera is connected and accessible to backend system

3. Check backend logs for OpenCV-related errors:
   - Camera initialization failures
   - Video capture errors
   - Frame processing issues

4. Ensure YOLOv8 model is loaded correctly in backend (check model file path)

5. Restart backend service to re-initialize camera connection

---

### Problem: Charts Showing No Data

**Symptoms**: Density trend chart and heatmap are empty or not updating.

**Causes**:
- No historical data logged yet (backend just started)
- `/history` endpoint failing
- Backend database/storage not persisting logs

**Solutions**:
1. Wait 2-5 minutes for historical data to accumulate after backend startup

2. Verify `/api/history` endpoint returns non-empty array:
   - Open browser DevTools Network tab
   - Check response from `/api/history?minutes=2`
   - Should contain array of detection objects

3. Check backend is logging detections to database/storage

4. Refresh dashboard page to clear any stale React state

5. Verify backend `/history` endpoint directly:
   ```bash
   curl http://127.0.0.1:5001/history?minutes=2
   ```

---

### Problem: Port 3000 Already in Use

**Symptoms**: Error message "Port 3000 is already in use" when running `npm run dev`.

**Causes**:
- Another application using port 3000
- Previous Next.js process still running

**Solutions**:
1. **macOS/Linux**: Kill process using port 3000:
   ```bash
   lsof -ti:3000 | xargs kill -9
   ```

2. **Windows**: Find and kill process:
   ```cmd
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   ```

3. **Alternative**: Run on different port:
   ```bash
   npm run dev -- -p 3001
   ```
   Then access at `http://localhost:3001`

---

### Problem: Metrics Not Updating in Real-Time

**Symptoms**: Dashboard metric cards show stale data and don't update every 2 seconds.

**Causes**:
- Polling intervals paused or stopped
- JavaScript errors breaking update loop
- Backend returning stale timestamps

**Solutions**:
1. Open browser console (F12) and check for JavaScript errors

2. Refresh the dashboard page (`Ctrl+R` or `Cmd+R`)

3. Verify backend is returning fresh timestamps in responses:
   ```bash
   curl http://127.0.0.1:5001/detect | jq '.timestamp'
   ```
   Timestamp should update on each request.

4. Check browser DevTools Network tab:
   - Should see requests to `/api/stats` every 2 seconds
   - If requests stopped, there's likely a JavaScript error

5. Clear browser cache and hard refresh (`Ctrl+Shift+R` or `Cmd+Shift+R`)

---

### Problem: Build Fails with Dependency Errors

**Symptoms**: `npm run build` fails with module resolution or dependency errors.

**Causes**:
- Incompatible Node.js version
- Corrupted `node_modules` directory
- Outdated package-lock.json

**Solutions**:
1. Verify Node.js version (must be 18 or higher):
   ```bash
   node -v
   ```

2. Delete `node_modules` and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. Clear npm cache if issues persist:
   ```bash
   npm cache clean --force
   npm install
   ```

4. Try using a different package manager:
   ```bash
   # Using yarn
   yarn install
   yarn build

   # Using pnpm
   pnpm install
   pnpm build
   ```

---

### Problem: ESLint Errors Preventing Build

**Symptoms**: Build fails with linting errors or warnings.

**Causes**:
- Code style violations
- Unused variables or imports
- ESLint rule violations

**Solutions**:
1. Run ESLint to see specific errors:
   ```bash
   npm run lint
   ```

2. Fix errors manually or add ESLint ignore comments if intentional:
   ```javascript
   // eslint-disable-next-line no-unused-vars
   const unusedVar = "value";
   ```

3. **Quick testing only** - Disable ESLint in build (NOT recommended for production):
   ```javascript
   // next.config.js
   module.exports = {
     eslint: {
       ignoreDuringBuilds: true,
     },
   };
   ```

---

### Problem: CORS Errors in Browser Console

**Symptoms**: Browser console shows CORS (Cross-Origin Resource Sharing) errors when accessing backend.

**Causes**:
- Direct frontend-to-backend requests blocked by browser security
- Missing CORS headers in backend responses

**Solutions**:
1. **Recommended**: Use the built-in API proxies (`/api/stats` and `/api/history`) instead of direct backend calls

2. If you must call backend directly, ensure backend has CORS enabled:
   ```python
   # Python Flask backend
   from flask_cors import CORS
   CORS(app, origins=["http://localhost:3000"])
   ```

3. For development only, you can configure Next.js rewrites in `next.config.js`:
   ```javascript
   module.exports = {
     async rewrites() {
       return [
         {
           source: '/backend/:path*',
           destination: 'http://127.0.0.1:5001/:path*',
         },
       ];
     },
   };
   ```

---

## License

License information not specified.

---

## Additional Resources: Next.js Documentation

### Crowd Management Frontend

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

# Getting Started
### Getting Started

First, run the development server:

```bash
You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

# Learn More
### Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

# Deploy on Vercel
### Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
