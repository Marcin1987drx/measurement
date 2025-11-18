# View System Changes - Technical Documentation

## Overview
Fixed the measurement point (MP) view system to ensure deterministic and reversible zoom/pan behavior. When a view is saved for an MP and later restored, the visual composition (relative positions of background, arrows, and labels) is now exactly the same.

## Root Cause Analysis

### Problem
When switching between MPs with different saved views:
- Labels and arrows appeared in different positions relative to the background than when the view was saved
- The issue was more pronounced at higher zoom levels
- Pan offsets didn't restore correctly

### Root Causes
1. **Transform Origin Mismatch**: CSS used `transform-origin: center center` for background, SVG overlay, and labels container. With center origin, the transform math becomes complex and inconsistent when combining scale and translate.

2. **Incorrect Transform Formula**: Used `scale(s) translate(tx, ty)` which with center origin required complex offset calculations that weren't consistent across different container sizes.

3. **Wrong Offset Calculations**: Wheel zoom offset calculations assumed center-based transforms, making saved views non-deterministic.

## Solution

### 1. CSS Changes (style.css)
Changed `transform-origin` from `center center` to `0 0` (top-left corner) for:
- `#background-img`
- `#overlay-svg`
- `#labels-container`

**Why top-left origin?**
- Simplifies transform math: scale from (0,0) is straightforward
- Makes pan offsets directly correspond to screen pixel translations
- Ensures consistency regardless of container size changes

### 2. Transform Formula Update (app.js)
**Old formula:** `scale(s) translate(tx, ty)`
**New formula:** `translate(tx, ty) scale(s)`

**Semantic difference:**
- Old: Scale first (from center), then translate in scaled space
- New: Translate first (pan in screen pixels), then scale from top-left

**Why this works:**
- `offsetX`, `offsetY` are now pure screen pixel translations
- `scale` is applied after translation, from top-left corner
- Result: deterministic and reversible transforms

### 3. Wheel Zoom Calculation Update
**Old calculation (center-origin):**
```javascript
const newOffsetX = appState.ui.canvasZoom.offsetX - (x - rect.width / 2) * (newScale / oldScale - 1);
```

**New calculation (top-left origin):**
```javascript
const newOffsetX = x - (x - appState.ui.canvasZoom.offsetX) * newScale / oldScale;
```

**Derivation:**
- Point at screen position `x` should stay visually fixed during zoom
- Current point in viewBox coordinates: `(x - offsetX) / scale`
- After zoom to `newScale`, same viewBox point should appear at `x`
- Solve for new offset: `newOffset = x - viewBoxPoint * newScale`

### 4. Enhanced Logging
Added console logs for debugging view save/restore:
- `📸 VIEW SAVED`: Logs when "Set View" is clicked
- `📐 APPLYING saved view`: Logs when view is restored (measurement mode)
- `🔍 EDITOR: Applying saved view`: Logs when view is restored (editor mode)
- Includes scale, offsetX, offsetY, and container dimensions

## Testing Guide

### Test Case A: Single MP View Persistence
1. Create a schema with one background and two MPs far apart
2. Select MP1 in measurement mode
3. Zoom in to 250-300% and pan so MP1 is centered
4. In schema editor, click "Set View" for MP1
5. Select MP2 (view should reset to 1x)
6. Select MP1 again
7. **Expected**: View should be exactly as saved in step 3 (same zoom, same relative position)

### Test Case B: Multiple MPs with Different Views
1. Set up schema with two MPs
2. For MP1: Set zoom to 150% at left side of screen
3. For MP2: Set zoom to 300% at right side of screen
4. Toggle between MP1 and MP2 multiple times
5. **Expected**: Each time, the MP appears in exactly the same position relative to the background

### Test Case C: View Persistence Across Sessions
1. Set views for multiple MPs
2. Save schema
3. Close and reopen project
4. Select MPs with saved views
5. **Expected**: Views are restored exactly as saved

### Test Case D: Manual Zoom After Auto-View
1. Select MP1 with saved view (view loads automatically)
2. Manually zoom/pan using mouse wheel and drag
3. Select MP2, then back to MP1
4. **Expected**: MP1's saved view is restored (manual changes are not persisted unless "Set View" is clicked again)

### Test Case E: Export Validation
⚠️ **Note**: Export PNG logic may need verification after these changes.

1. Set zoom views for multiple MPs
2. Save a measurement
3. Check generated PNG files in `exports/visualizations/`
4. **Expected**: 
   - Overview images show full background at 1x zoom
   - Individual MP zoom images should match the saved view composition
   - If they don't match, the export logic needs updating (see TODO in exportPNG function)

## Technical Details

### Coordinate Systems

**Screen Coordinates:**
- Origin: top-left of canvas wrapper
- Units: CSS pixels
- Used for: mouse events, offsetX/offsetY

**ViewBox Coordinates:**
- Origin: top-left of viewBox
- Range: 0-1000 (width), 0-700 (height)
- Units: viewBox units
- Used for: SVG elements, arrow positions, label positions

**Transform Relationship:**
```javascript
// Screen to ViewBox (accounting for zoom):
viewBoxX = (screenX - offsetX) / scale / (screenWidth / VIEWBOX_WIDTH)
viewBoxY = (screenY - offsetY) / scale / (screenHeight / VIEWBOX_HEIGHT)

// ViewBox to Screen (accounting for zoom):
screenX = viewBoxX * (screenWidth / VIEWBOX_WIDTH) * scale + offsetX
screenY = viewBoxY * (screenHeight / VIEWBOX_HEIGHT) * scale + offsetY
```

### State Management
**appState.ui.canvasZoom:**
```javascript
{
  scale: 1.5,      // Zoom factor (1.0 = 100%, 2.0 = 200%)
  offsetX: 120,    // Pan offset in screen pixels (positive = content moved right)
  offsetY: -50     // Pan offset in screen pixels (positive = content moved down)
}
```

**mp.view (saved per measurement point):**
```javascript
{
  scale: 2.5,
  offsetX: 200,
  offsetY: -100
}
```

### Guarantees
1. **Deterministic**: Applying the same view object always produces the same visual result
2. **Reversible**: Save-then-restore returns to exact original view
3. **Container-size Independent**: View values are in screen pixels, but relative positions are maintained when container resizes (through renderCanvas and fitLabelsToView recalculation)

## Known Issues / TODOs

1. **Export PNG View Handling**: The `exportPNG` function has custom view cropping logic (lines 2406-2419) that was designed for the old center-origin system. After testing, it may need updates to correctly interpret the new offsetX/offsetY values. A TODO comment has been added.

2. **Minimap**: The minimap calculation appears correct with the new system (lines 449-459), but should be verified during testing.

3. **Edge Cases**: Test behavior when:
   - Container is resized while a view is active
   - Very high zoom levels (>400%)
   - Very large pan offsets that move content mostly off-screen

## Files Modified

- `style.css`: Changed `transform-origin` for 3 elements
- `app.js`: 
  - Updated `applyCanvasZoom()` transform formula and added documentation
  - Updated `onEditorZoomWheel()` offset calculation
  - Updated `resetCanvasView()` transform formula
  - Enhanced logging in "Set View" handler and `selectMP()`
  - Added defensive dimension check in `applyCanvasZoom()`
  - Added TODO comment in `exportPNG()`

## Rollback Plan
If issues are discovered that can't be quickly fixed:
1. Revert CSS `transform-origin` back to `center center`
2. Revert transform formula to `scale(s) translate(tx, ty)`
3. Revert wheel zoom calculation to use `rect.width / 2` centerpoint
4. This will restore old behavior, including the original bug

However, the new system is more correct and should be validated/fixed rather than reverted.
