# Phase 1: Multi-Background Support Implementation

## Overview
This document describes the implementation of Phase 1 multi-background support for the measurement application, allowing users to manage multiple backgrounds in the schema editor and filter measurement points by background in both the editor and Report Studio.

## Changes Made

### 1. Schema Editor (app.js)

#### Data Structure Extensions
- Extended `editorState.meta` to include:
  - `backgrounds`: Array of background objects `{id, name, fileName}`
  - `defaultBackground`: ID of the default background for normal viewing mode
  - `backgroundId`: ID of currently active background in editor (temporary state)

- Extended measurement point (MP) structure:
  - Added `backgroundId` field to each MP to associate it with a specific background

#### UI Enhancements
1. **Background Management Panel** (in schema inspector):
   - Upload button for adding new backgrounds
   - Dropdown to select active background in editor view
   - Dropdown to select default background for normal view
   - List of all backgrounds with delete buttons
   - Each background shows name and filename

2. **Per-Point Background Selection**:
   - Added background dropdown in each MP card
   - Allows selecting which background the MP belongs to
   - Shows "Default/None" option for MPs that appear on all backgrounds

#### Background Upload
- Modified background uploader to:
  - Generate unique IDs for each background (`bg_<timestamp>`)
  - Store backgrounds with original name and generated filename
  - Add background to `meta.backgrounds` array
  - Set as default/active if it's the first background

#### Canvas Rendering with Filtering
- Implemented background-aware rendering in `renderCanvas()`:
  - Determines active background based on context (editor vs normal mode)
  - Filters MPs based on current background:
    - When no background is active: shows only MPs without `backgroundId`
    - When background is active: shows MPs with matching `backgroundId` OR no `backgroundId`
  - This allows MPs to be visible on multiple backgrounds

#### Map Save/Load
- Enhanced `saveMap()` to:
  - Persist `meta.backgrounds` array
  - Persist `meta.defaultBackground`
  - Persist `backgroundId` for each MP
  - Remove temporary `backgroundId` from meta (editor-only state)

- Enhanced map loading to:
  - Support new backgrounds structure
  - Maintain backward compatibility with old `backgroundFile` field
  - Automatically migrate old structure to new structure

#### CSS Styling
- Added styles for:
  - Background list items (`#editor-bg-list .bg-item`)
  - Background control layout
  - Delete buttons for backgrounds

### 2. Report Studio (report.js)

#### Helper Functions
- Added `getProjectBackgrounds()`:
  - Reads backgrounds from localStorage (project data)
  - Falls back to checking file system if available
  - Returns array of background objects for use in UI

#### Point Views Component Enhancement
- Enhanced `renderPointViewImages()` function:
  - Now accepts `config` parameter with filters:
    - `backgroundId`: Filter MPs by background
    - `showOkOnly`: Show only OK measurements
    - `showNokOnly`: Show only NOK measurements
  - Applies filters before rendering
  - Shows appropriate message when no MPs match filters

#### Properties Panel
- Added Point Views settings section:
  - Background filter dropdown
  - "Show OK points only" checkbox
  - "Show NOK points only" checkbox
  - Event handlers to re-render component when filters change

### 3. Component Integration (report.html)
- Verified `vizPointViews` component exists in palette
- Component already supports drag-and-drop to canvas
- Now supports background filtering through properties panel

## Migration Strategy

### Backward Compatibility
The implementation maintains full backward compatibility:

1. **Loading Old Maps**:
   - If a map has only `meta.backgroundFile`, it's automatically migrated
   - Creates a background entry with ID `bg_migrated_<timestamp>`
   - Sets it as the default background
   - Existing MPs work without modification

2. **New Structure**:
   - New maps save with `backgrounds` array
   - Each background has unique ID, name, and filename
   - MPs can be assigned to specific backgrounds via `backgroundId`

## Usage Workflow

### Schema Editor
1. Open schema editor (new or existing schema)
2. Upload backgrounds using "Upload New Background" button
3. Select active background for editor view using dropdown
4. Set default background for normal viewing
5. For each MP, optionally select which background it belongs to
6. MPs without background assignment appear on all backgrounds
7. Save schema - backgrounds and associations are persisted

### Report Studio
1. Open Report Studio
2. Drag "Point Views" component to canvas
3. Select the component to open properties panel
4. Use "Filter by Background" dropdown to show MPs from specific background
5. Optionally enable "Show OK only" or "Show NOK only"
6. Component renders only MPs matching the filters

## Technical Details

### Background ID Generation
- Format: `bg_<timestamp>`
- Ensures uniqueness across all backgrounds
- Used for referencing in MP assignments

### Filtering Logic
```javascript
// Editor mode: uses backgroundId (current view) OR defaultBackground
const currentBgId = isEditor 
    ? (meta.backgroundId || meta.defaultBackground || null)
    : (meta.defaultBackground || null);

// Filter MPs
if (currentBgId === null) {
    // Show MPs without backgroundId
    return !mp.backgroundId;
} else {
    // Show MPs matching current background OR no background
    return !mp.backgroundId || mp.backgroundId === currentBgId;
}
```

### Data Structure Examples

#### Background Object
```json
{
  "id": "bg_1699876543210",
  "name": "Front View",
  "fileName": "bg_1699876543210.png"
}
```

#### Meta Structure
```json
{
  "backgrounds": [
    {"id": "bg_1", "name": "Front", "fileName": "bg_1.png"},
    {"id": "bg_2", "name": "Back", "fileName": "bg_2.png"}
  ],
  "defaultBackground": "bg_1",
  "backgroundFile": null  // Legacy field, can be null
}
```

#### MP with Background
```json
{
  "id": "MP1",
  "name": "Measurement Point 1",
  "backgroundId": "bg_1",  // Appears only on Front view
  "x1": 100,
  "y1": 200,
  ...
}
```

## Future Enhancements (Out of Scope for Phase 1)

1. Background thumbnails in the list
2. Drag-and-drop reordering of backgrounds
3. Rename background functionality
4. Copy MPs between backgrounds
5. Background preview in dropdown
6. Bulk MP assignment to backgrounds
7. Import/export background definitions
8. File system integration for background loading in Report Studio

## Testing Recommendations

1. **Background Management**:
   - Upload multiple backgrounds
   - Delete backgrounds and verify MP references are cleared
   - Switch between backgrounds in editor

2. **MP Filtering**:
   - Create MPs with different background assignments
   - Verify correct MPs show/hide when switching backgrounds
   - Test MPs without background (should appear on all)

3. **Save/Load**:
   - Save schema with multiple backgrounds
   - Reload and verify backgrounds are preserved
   - Test migration of old schemas with single background

4. **Report Studio**:
   - Add Point Views component
   - Test background filtering
   - Test OK/NOK filtering
   - Verify filters work together correctly

5. **Backward Compatibility**:
   - Load old schemas (with backgroundFile)
   - Verify automatic migration
   - Ensure no data loss

## Known Limitations

1. Background images are stored by filename only - renaming requires manual updates
2. No visual preview of backgrounds in dropdowns
3. File system adapter integration for Report Studio backgrounds is placeholder only
4. No bulk operations for MP background assignments

## Files Modified

- `app.js`: Schema editor with multi-background support
- `style.css`: Styling for background management UI
- `report.js`: Point Views filtering and properties panel
- `PHASE1_IMPLEMENTATION.md`: This documentation file
