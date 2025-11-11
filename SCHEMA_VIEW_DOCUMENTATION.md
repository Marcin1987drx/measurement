# Schema/SetView Coordinates Documentation

## Investigation Results

### 1. View Coordinate System ✅

The application uses a custom view/zoom system for measurement points (MPs) in the schema editor.

#### Structure

Each measurement point (MP) can have an associated `view` object that stores zoom coordinates:

```javascript
{
  view: {
    scale: 2.5,      // Zoom level (1.0 = 100%, 2.5 = 250%)
    offsetX: -100,   // Horizontal pan offset in pixels
    offsetY: -50     // Vertical pan offset in pixels
  }
}
```

#### Location in Code

**File:** `app.js`

**Key Functions:**
- `applyCanvasZoom(view, animate)` - Lines 222-272
  - Applies zoom transformation to canvas
  - Handles scale and offset transformations
  - Updates minimap view indicator

- `selectMP(id)` - Lines 148-159
  - Auto-applies saved view when MP is selected (line 155-156)
  - Triggers zoom to show measurement point detail

- `Set View` Button Handler - Lines 1090-1099
  - Saves current zoom state to MP's view property
  - Shows confirmation with scale value
  - Accessed via Schema Editor → MP Card → "Set View" button

- `Clear View` Button Handler - Lines 1101-1106
  - Removes saved view from MP
  - Resets canvas to default view

#### Storage Format

Views are saved in schema JSON files (`.map.json`) in the `/maps/` directory:

```json
{
  "points": [
    {
      "id": "MP1",
      "name": "Measurement Point 1",
      "view": {
        "scale": 2.5,
        "offsetX": -100,
        "offsetY": -50
      },
      // ... other MP properties
    }
  ]
}
```

#### Usage Flow

1. **Setting a View:**
   - Open Schema Editor
   - Select a measurement point
   - Zoom/pan canvas to desired view using mouse wheel and drag
   - Click "Set View" button in MP properties
   - View is saved with the MP

2. **Applying a View:**
   - When user focuses on MP input field (during measurement)
   - System automatically zooms to saved view
   - Helps operator see measurement point detail
   - View resets on blur (when leaving input field)

3. **Clearing a View:**
   - Open Schema Editor
   - Select measurement point with saved view
   - Click "Clear View" button
   - MP will no longer auto-zoom

---

### 2. ViewBox Coordinate System

The canvas uses SVG viewBox coordinates:

```javascript
const VIEWBOX_WIDTH = 1000;   // Virtual canvas width
const VIEWBOX_HEIGHT = 700;   // Virtual canvas height
```

All measurement point positions (arrows, labels) are stored in these normalized coordinates, making them resolution-independent.

---

### 3. Screenshot/Visualization System ✅

#### Overview

The system automatically generates PNG visualizations after each measurement save.

#### Implementation

**File:** `app.js`

**Function:** `exportPNG()` - Lines 1519-1611

#### Process Flow

1. **Trigger:**
   ```javascript
   // Called after CSV save in saveAndExport()
   await exportPNG({ 
     fromSave: true, 
     saveToFile: true, 
     showAlertOnSuccess: false 
   });
   ```

2. **Generation:**
   - Loads schema background image
   - Creates HTML5 Canvas element
   - Draws background (optionally with custom color)
   - Renders measurement arrows with colors
   - Draws measurement values and labels
   - Adds QR code and date meta labels
   - Converts canvas to PNG blob

3. **Storage:**
   - Saved to: `/exports/visualizations/{QRCode}.png`
   - Filename uses QR code from measurement
   - Automatically overwrites previous version

4. **Canvas Rendering:**
   - Uses natural image dimensions for high quality
   - Scales viewBox coordinates to match image size
   - Applies status colors (green=OK, red=NOK)
   - Includes measurement labels with values

#### Key Features

- **Background Color:** Configurable via `visualization-bg-toggle` and `visualization-bg-color`
- **Status Colors:** Green for OK, Red for NOK measurements
- **Meta Labels:** QR code and date positioned via `meta.qrLabelPos` and `meta.dateLabelPos`
- **Export Options:**
  - `saveToFile: true` → Saves to project folder
  - `saveToFile: false` → Downloads to browser downloads folder

---

### 4. 3D Viewer / WebGL Investigation ❌

**Result:** No 3D viewer or WebGL implementation found.

**Findings:**
- No THREE.js library references
- No WebGL context creation
- No 3D model files
- System uses 2D canvas-based visualization only

**Current Approach:**
- 2D technical drawings as background images (PNG/SVG/JPEG)
- SVG overlay for arrows and measurement points
- HTML labels for text and status indicators
- Canvas API for PNG export

---

### 5. Schema File Structure

#### Location
`/maps/{SchemaName}_v{Version}.map.json`

#### Complete Structure

```json
{
  "meta": {
    "backgroundFile": "SchemaName_v1.png",  // In /backgrounds/
    "showQR": true,                         // Display QR label
    "showDate": true,                       // Display date label
    "qrLabelPos": { "x": 100, "y": 50 },   // QR label position
    "dateLabelPos": { "x": 100, "y": 80 }  // Date label position
  },
  "points": [
    {
      "id": "MP1",                           // Measurement point ID
      "name": "Height Measurement",          // Display name
      "type": "single",                      // "single" or "table"
      "unit": "mm",                          // Measurement unit
      "nominal": 10.0,                       // Nominal/target value
      "min": 9.9,                           // Minimum tolerance
      "max": 10.1,                          // Maximum tolerance
      "labelX": 550,                        // Label X position (viewBox coords)
      "labelY": 300,                        // Label Y position (viewBox coords)
      "view": {                             // Optional: Auto-zoom view
        "scale": 2.5,
        "offsetX": -100,
        "offsetY": -50
      },
      "arrows": [                           // Visual indicators
        {
          "x1": 450,                        // Start X (viewBox)
          "y1": 325,                        // Start Y (viewBox)
          "x2": 550,                        // End X (viewBox)
          "y2": 325,                        // End Y (viewBox)
          "style": {
            "color": "#007aff",             // Arrow color
            "width": 2,                     // Line width
            "head": "arrow"                 // "none", "arrow", or "double"
          }
        }
      ],
      "columns": []                         // For table-type MPs
    },
    {
      "id": "MP2",
      "name": "Multi-Point Table",
      "type": "table",                      // Table type with multiple columns
      "columns": [
        {
          "name": "Point_A",
          "unit": "mm",
          "nominal": 5.0,
          "min": 4.9,
          "max": 5.1
        },
        {
          "name": "Point_B",
          "unit": "mm",
          "nominal": 3.0,
          "min": 2.9,
          "max": 3.1
        }
      ],
      "labelX": 750,
      "labelY": 400,
      "view": null,
      "arrows": [
        {
          "x1": 700,
          "y1": 400,
          "x2": 750,
          "y2": 400,
          "style": {
            "color": "#ff9500",
            "width": 2,
            "head": "double"
          }
        }
      ]
    }
  ]
}
```

---

## Future Auto-Zoom Feature Implementation

Based on the investigation, here's how to implement auto-zoom views for measurement points:

### 1. Setting Views (Already Implemented ✅)

Users can already set views in the Schema Editor:
- Edit schema
- Select measurement point
- Zoom/pan to desired view
- Click "Set View" button
- View is saved with MP

### 2. Applying Views (Already Implemented ✅)

Views are automatically applied when:
- User focuses on MP input field during measurement
- System calls `selectMP(id)` which checks for `mp.view`
- If view exists, calls `applyCanvasZoom(mp.view)`
- View resets when input loses focus

### 3. Extending the System

To add more advanced features:

```javascript
// Multiple views per MP (e.g., overview + detail)
{
  "id": "MP1",
  "views": {
    "overview": { scale: 1.0, offsetX: 0, offsetY: 0 },
    "detail": { scale: 3.0, offsetX: -200, offsetY: -100 }
  },
  "defaultView": "detail"  // Which view to use
}

// Animated transitions between views
applyCanvasZoom(view, animate = true, duration = 300);

// View presets for common zoom levels
const VIEW_PRESETS = {
  "fit": { scale: 1.0, offsetX: 0, offsetY: 0 },
  "close": { scale: 2.0, offsetX: 0, offsetY: 0 },
  "macro": { scale: 5.0, offsetX: 0, offsetY: 0 }
};
```

---

## File Locations Summary

| Component | Path | Description |
|-----------|------|-------------|
| Schema Files | `/maps/*.map.json` | Contains MP definitions, views, arrows |
| Background Images | `/backgrounds/*.png` | Technical drawings (PNG/JPEG/SVG) |
| Visualization Exports | `/exports/visualizations/*.png` | Auto-generated measurement screenshots |
| View System Code | `app.js` lines 222-310 | Zoom/pan transformation logic |
| View Editor UI | `app.js` lines 1068-1106 | Set/Clear view buttons |
| Auto-apply Logic | `app.js` lines 148-159 | Apply view on MP selection |

---

## Conclusion

The measurement application has a **complete view/zoom system** already implemented:

✅ **View Storage:** Each MP can store custom zoom coordinates  
✅ **Auto-Apply:** Views automatically apply when MP is selected  
✅ **Editor UI:** Set/Clear view buttons in Schema Editor  
✅ **Screenshots:** PNG visualizations auto-generated after measurements  

❌ **3D Viewer:** Not present - system uses 2D canvas visualization only

The view system is production-ready and functional for auto-zoom features!
