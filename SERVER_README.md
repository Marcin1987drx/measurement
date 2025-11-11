# Server Mode Setup Guide

## Overview

The Universal File System Adapter supports two modes:

1. **Local Mode** - Uses browser's File System Access API (default when opening via `file://`)
2. **Server Mode** - Uses REST API for file operations (when server is running)

## Quick Start - Server Mode

### Prerequisites
- Node.js installed (v14 or higher)

### Installation

1. Install dependencies:
```bash
npm install express
```

2. Start the server:
```bash
node server.js
```

3. Open your browser:
```
http://localhost:3000
```

### Project Structure

When using server mode, create a `projects` folder in the root directory:

```
measurement/
├── server.js
├── index.html
├── fileSystemAdapter.js
├── projects/
│   ├── G65/
│   │   ├── busbarDB.csv
│   │   ├── maps/
│   │   ├── backgrounds/
│   │   └── exports/
│   │       └── visualizations/
│   └── ProjectB/
│       └── ...
```

### API Endpoints

The server provides the following endpoints:

- `GET /api/ping` - Health check
- `POST /api/files/read` - Read file content
  - Body: `{ project: "G65", path: "busbarDB.csv" }`
- `POST /api/files/write` - Write file content
  - Body: `{ project: "G65", path: "busbarDB.csv", content: "..." }`
- `GET /api/files/image` - Serve image file
  - Query: `?project=G65&path=exports/visualizations/image.png`

### Mode Detection

The adapter automatically detects which mode to use:

1. If opened via `file://` protocol → **Local Mode**
2. If `/api/ping` responds → **Server Mode**
3. Otherwise → fallback to **Local Mode**

Check the browser console for mode confirmation:
```
✅ Mode: local
```
or
```
✅ Mode: server
```

## Deployment Scenarios

### 1. Local Files (C:\, D:\, Network Drives)
- Open `index.html` directly
- Uses File System Access API
- Full local file access after permission grant

### 2. OneDrive Synchronized Folders
- Open `index.html` directly
- Works like local mode
- Files sync automatically via OneDrive

### 3. Web Server Deployment
```bash
# Start server
node server.js

# Access via browser
http://localhost:3000
```

### 4. Remote Server with Local Files
- App runs on server (http://server:3000)
- Files stored locally on server
- Users access via web browser
- No client-side file system access needed

### 5. Hybrid Mode
- Server provides API
- Files can be on network share
- Multiple users can access centralized data

## Configuration

### Port Configuration
Edit `server.js` to change the port:
```javascript
app.listen(3000, () => console.log('Server: http://localhost:3000'));
// Change to your desired port
```

### Projects Directory
Edit `server.js` to change the projects location:
```javascript
const PROJECTS = './projects'; // Change to your path
```

## Troubleshooting

### "Mode: local" but expected server mode
- Check if server is running: `http://localhost:3000/api/ping`
- Check browser console for errors
- Verify CORS settings if running from different domain

### Images not loading
- **Local mode**: Ensure correct folder structure
- **Server mode**: Check projects directory exists
- Verify file paths in console logs

### Permission Denied
- **Local mode**: Re-grant folder access permission
- **Server mode**: Check file system permissions on server

## Security Notes

- Server mode requires Node.js server
- Local mode requires modern browser (Chrome, Edge, Opera)
- File System Access API requires user permission
- Server should implement authentication for production use
- Consider adding rate limiting and validation

## Browser Compatibility

**Local Mode:**
- ✅ Chrome 86+
- ✅ Edge 86+
- ✅ Opera 72+
- ❌ Firefox (not supported)
- ❌ Safari (not supported)

**Server Mode:**
- ✅ All modern browsers
- Requires server backend
