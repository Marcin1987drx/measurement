# Universal File System Adapter - Implementation Guide

## What is it?

The Universal File System Adapter allows the measurement app to work in **multiple deployment scenarios**:

- ✅ **Local files** (C:\, D:\, network drives)
- ✅ **OneDrive synchronized folders**
- ✅ **Web server deployment** with backend API
- ✅ **Hybrid mode** (app on server, files accessible locally or remotely)

## How it works

### Automatic Mode Detection

The adapter automatically detects the best mode:

```
┌─────────────────────────────────────────┐
│  User opens app                         │
└────────────┬────────────────────────────┘
             │
             ▼
        ┌─────────┐
        │Protocol?│
        └────┬────┘
             │
     ┌───────┴────────┐
     │                │
   file://         http://
     │                │
     ▼                ▼
 LOCAL MODE    ┌──────────┐
               │/api/ping?│
               └─────┬────┘
                     │
              ┌──────┴─────┐
              │            │
           Success      Failed
              │            │
              ▼            ▼
         SERVER MODE  LOCAL MODE
```

### User Experience

**Local Mode:**
```
1. User clicks "Project Folder"
2. Browser shows folder picker
3. User selects project folder
4. Console: "✅ Mode: local"
5. App works with local files
```

**Server Mode:**
```
1. User clicks "Project Folder"
2. Prompt: "Project name:" (default: G65)
3. User enters project name
4. Console: "✅ Mode: server"
5. App works via API
```

## Quick Start

### Option 1: Local Mode (No Setup)

1. Open `index.html` in Chrome/Edge/Opera
2. Click "Project Folder" button
3. Select your project folder
4. Start working!

**Requirements:**
- Modern browser (Chrome 86+, Edge 86+, Opera 72+)
- No server needed

### Option 2: Server Mode

1. Install Node.js dependencies:
```bash
npm install
```

2. Create projects folder:
```bash
mkdir projects
mkdir projects/G65
```

3. Start server:
```bash
npm start
```

4. Open browser:
```
http://localhost:3000
```

5. Click "Project Folder" and enter project name

## File Structure

### Local Mode
Your files remain in their original location:
```
C:\Projects\G65\
├── busbarDB.csv
├── maps\
├── backgrounds\
└── exports\
    └── visualizations\
```

### Server Mode
Files are organized by project:
```
measurement\
├── server.js
├── index.html
└── projects\
    ├── G65\
    │   ├── busbarDB.csv
    │   ├── maps\
    │   ├── backgrounds\
    │   └── exports\
    └── ProjectB\
        └── ...
```

## API Reference

### FileSystemAdapter Class

```javascript
// Initialize adapter (auto-detects mode)
await fileSystemAdapter.initialize();

// Read file
const content = await fileSystemAdapter.readFile('busbarDB.csv');

// Write file
await fileSystemAdapter.writeFile('busbarDB.csv', data);

// Get image URL
const url = await fileSystemAdapter.getImageURL('exports/visualizations/image.png');

// Check current mode
console.log(fileSystemAdapter.mode); // 'local' or 'server'
```

### REST API (Server Mode)

**Health Check:**
```http
GET /api/ping
Response: { "ok": true }
```

**Read File:**
```http
POST /api/files/read
Content-Type: application/json

{
  "project": "G65",
  "path": "busbarDB.csv"
}

Response: <file content as text>
```

**Write File:**
```http
POST /api/files/write
Content-Type: application/json

{
  "project": "G65",
  "path": "busbarDB.csv",
  "content": "data..."
}

Response: { "ok": true }
```

**Get Image:**
```http
GET /api/files/image?project=G65&path=exports/visualizations/image.png

Response: <image file>
```

## Deployment Scenarios

### Scenario 1: Single User - Local Disk
```
User PC
├── Browser ──────► index.html (file://)
└── Project Files (C:\Projects\G65\)
```

**Mode:** Local  
**Setup:** None  
**Use Case:** Personal use, offline work

### Scenario 2: Single User - OneDrive
```
User PC
├── Browser ──────► index.html (file://)
└── OneDrive Folder
    └── Project Files (synced)
```

**Mode:** Local  
**Setup:** None  
**Use Case:** Personal use with cloud backup

### Scenario 3: Web Server - Centralized Data
```
Server
├── Node.js ──────► server.js (http://server:3000)
└── Project Files (/var/projects/)

User PC
└── Browser ──────► http://server:3000
```

**Mode:** Server  
**Setup:** Node.js + Express  
**Use Case:** Team collaboration, centralized data

### Scenario 4: Web Server - Local Files
```
Server
└── Node.js ──────► index.html (http://server:3000)

User PC
├── Browser ──────► http://server:3000
└── Project Files (C:\Projects\G65\)
                    ↑ File System Access API
```

**Mode:** Local (fallback)  
**Setup:** Static file server  
**Use Case:** Web deployment with local data

### Scenario 5: Hybrid - Mixed Access
```
Server
├── Node.js ──────► server.js + index.html
└── Network Share ──► \\server\projects\

User A (Remote)
└── Browser ──────► http://server:3000 (Server Mode)

User B (Local)
└── Browser ──────► file://index.html (Local Mode)
                    ↓
                   Network Share (\\server\projects\)
```

**Mode:** Both  
**Setup:** Server + SMB/NFS share  
**Use Case:** Flexible access, mixed teams

## Integration Examples

### Existing Code (app.js)
```javascript
// Old: Direct File System Access API
appState.projectRootHandle = await window.showDirectoryPicker();

// New: Universal Adapter
const fs = window.fileSystemAdapter;
await fs.initialize(); // Auto-detects mode
appState.fileSystem = fs;
```

### Image Loading (report.js)
```javascript
// Old: Direct path
<img src="exports/visualizations/image.png">

// New: Adapter-based (async)
const url = await fileSystemAdapter.getImageURL('exports/visualizations/image.png');
<img src="${url}">
```

## Troubleshooting

### "Module not found" (Server Mode)
```bash
npm install express
```

### Port 3000 already in use
Edit `server.js`:
```javascript
app.listen(8080, () => console.log('Server: http://localhost:8080'));
```

### Images not loading
- **Local mode:** Check folder structure
- **Server mode:** Check `projects/` directory exists
- Check browser console for specific errors

### Permission denied (Local Mode)
- Click "Project Folder" button again
- Grant folder access permission
- Check browser permissions settings

### Mode detection incorrect
- Check console for mode: `console.log(fileSystemAdapter.mode)`
- Verify `/api/ping` endpoint is accessible
- Clear localStorage: `localStorage.clear()`

## Browser Support

| Browser | Local Mode | Server Mode |
|---------|-----------|------------|
| Chrome 86+ | ✅ | ✅ |
| Edge 86+ | ✅ | ✅ |
| Opera 72+ | ✅ | ✅ |
| Firefox | ❌ | ✅ |
| Safari | ❌ | ✅ |

## Performance Considerations

**Local Mode:**
- Fast (direct file access)
- No network latency
- Limited by disk I/O

**Server Mode:**
- Network latency added
- Scalable (multiple users)
- Server disk I/O shared

## Security

**Local Mode:**
- File System Access API requires user permission
- Read/write access to selected folder only
- No data leaves the device

**Server Mode:**
- Add authentication before production use
- Validate all file paths
- Sanitize user inputs
- Consider rate limiting

**Recommended additions for production:**
```javascript
// Authentication middleware
app.use('/api', authenticateUser);

// Path validation
function validatePath(path) {
  if (path.includes('..')) throw new Error('Invalid path');
  return path;
}

// Rate limiting
const rateLimit = require('express-rate-limit');
app.use('/api', rateLimit({ windowMs: 60000, max: 100 }));
```

## Future Enhancements

Potential improvements:
- [ ] Add authentication to server mode
- [ ] Support for additional storage backends (S3, Azure Blob)
- [ ] Real-time collaboration features
- [ ] File versioning and history
- [ ] Conflict resolution for concurrent edits
- [ ] Offline mode with sync
- [ ] WebSocket support for live updates

## Contributing

When modifying the adapter:
1. Maintain backward compatibility
2. Test both local and server modes
3. Update documentation
4. Check browser compatibility

## License

Same as parent project (MIT)
