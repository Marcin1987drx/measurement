# Manual Testing Checklist for View System Fix

## Prerequisites
1. Open the application in a supported browser (Chrome, Edge, or Opera)
2. Select or create a project folder with File System Access API
3. Create a test schema with:
   - At least one background image
   - At least 2-3 measurement points spread across different areas
   - Mix of single and table type MPs if possible

## Test Suite

### ✅ Test 1: Basic View Save and Restore
**Objective**: Verify that a saved view for an MP is restored exactly as it was saved.

**Steps:**
1. Open schema in measurement mode (not editor)
2. Select MP1
3. Use mouse wheel to zoom in to ~200-250%
4. Drag to pan so MP1 is nicely centered in view
5. Open schema editor (Edit Schema button)
6. Click on MP1 card in editor
7. Click "Set View" button
8. Alert should show: "View saved for MP1!"
9. Click on MP2 card (different MP)
10. Click back on MP1 card
11. Close schema editor and return to measurement mode
12. Select MP2 in measurement mode
13. Select MP1 in measurement mode

**Expected Results:**
- Step 10: View should restore to the saved state (zoom ~200-250%, MP1 centered)
- Step 13: View should restore to the saved state again
- **Check console logs**: Look for `📸 VIEW SAVED` and `📐 APPLYING saved view` messages with matching scale/offset values
- Labels and arrows should be in exactly the same position relative to the background as when the view was saved

**Fail Criteria:**
- MP1 appears at a different zoom level
- MP1 is not centered as it was when saved
- Labels or arrows appear shifted relative to background

---

### ✅ Test 2: Multiple MPs with Different Views
**Objective**: Verify that switching between MPs with different views works correctly.

**Steps:**
1. In schema editor, select MP1
2. Zoom to 150% and pan to left side of screen
3. Click "Set View" for MP1
4. Select MP2
5. Zoom to 300% and pan to right side of screen
6. Click "Set View" for MP2
7. Create MP3 if available, zoom to 100% (or leave at default)
8. Close editor
9. In measurement mode, cycle through MPs: MP1 → MP2 → MP3 → MP1 → MP2 → MP1
10. Repeat cycling 2-3 more times

**Expected Results:**
- MP1 always appears at 150% zoom, left side
- MP2 always appears at 300% zoom, right side
- MP3 appears at 100% (or no zoom if no view set)
- Each switch is smooth and deterministic
- No drift or accumulation of errors over multiple switches
- Console shows correct scale values each time

**Fail Criteria:**
- Views gradually drift from original positions
- Zoom levels change randomly
- Labels/arrows misalign with background after multiple switches

---

### ✅ Test 3: Clear View Function
**Objective**: Verify that clearing a view removes the saved state.

**Steps:**
1. In editor, select MP1 (which has a saved view from previous tests)
2. Click "Clear View" button
3. Click on MP2, then back to MP1
4. Close editor and return to measurement mode
5. Select MP2, then MP1

**Expected Results:**
- After step 2: View resets to 1x zoom
- After step 3: MP1 appears at 1x zoom (no saved view to restore)
- After step 5: MP1 appears at 1x zoom
- "Clear View" button becomes disabled after clearing

**Fail Criteria:**
- Old view is still applied after clearing
- Button remains enabled when no view exists

---

### ✅ Test 4: Wheel Zoom and Pan Interaction
**Objective**: Verify that manual zoom/pan still works correctly with the new coordinate system.

**Steps:**
1. Select MP1 (with or without saved view)
2. Use mouse wheel to zoom in/out multiple times
3. Verify that zoom centers on the cursor position
4. Click and drag to pan the view
5. Zoom in while panning
6. Try extreme zoom levels: zoom in to 400%, zoom out to 50%

**Expected Results:**
- Wheel zoom feels natural and smooth
- Zoom always centers on cursor position (point under cursor stays fixed)
- Panning works in all directions
- No visual glitches or jumping
- Background, SVG arrows, and labels all move together as a unit
- Minimap (if visible) correctly shows viewport position

**Fail Criteria:**
- Zoom doesn't center on cursor
- Background and overlays move separately
- Jerky or unnatural movement
- Labels become misaligned after zoom/pan

---

### ✅ Test 5: View Persistence Across Editor/Measurement Mode
**Objective**: Verify views are maintained when switching between editor and measurement mode.

**Steps:**
1. In editor, set a view for MP1 (e.g., 250% zoom)
2. Save schema (click "Save Schema")
3. Close editor
4. In measurement mode, select MP1
5. Verify view is applied
6. Open editor again
7. Select MP1 in editor

**Expected Results:**
- Step 4: MP1 view is restored (250% zoom)
- Step 7: MP1 view is restored in editor
- View persists in both modes
- Saving and reopening doesn't lose the view

**Fail Criteria:**
- View is lost when switching modes
- View is lost after saving

---

### ✅ Test 6: Container Resize Handling
**Objective**: Verify views work correctly when browser window is resized.

**Steps:**
1. Set a view for MP1 (e.g., 200% zoom, centered)
2. Save schema
3. Resize browser window smaller
4. Select MP2, then MP1
5. Resize browser window larger
6. Select MP2, then MP1

**Expected Results:**
- MP1 view is maintained after resize
- Relative positions stay approximately the same
- No crashes or visual artifacts
- Labels remain readable at different window sizes

**Fail Criteria:**
- View becomes completely wrong after resize
- Application crashes
- Labels or arrows disappear

---

### ✅ Test 7: Export PNG Validation
**Objective**: Verify that exported PNG images match the on-screen view.

⚠️ **Note**: This test may reveal issues that need fixing in the export logic (see TODO in code).

**Steps:**
1. Set distinct views for MP1 (200% zoom) and MP2 (300% zoom)
2. Save schema
3. In measurement mode, enter some measurements
4. Fill in QR code
5. Click "Save & Export"
6. Wait for export to complete
7. Navigate to `exports/visualizations/` folder in project
8. Open the generated PNG files

**Expected Results:**
- Overview PNG shows full background at 1x zoom with all MPs
- Individual MP PNGs (if generated for MPs with views):
  - MP1 PNG should show MP1 at approximately 200% zoom (as saved)
  - MP2 PNG should show MP2 at approximately 300% zoom (as saved)
  - Composition should match what you see on screen when MP is selected

**Known Issue:**
- Export logic may not correctly interpret the new offsetX/offsetY values
- If exports don't match on-screen views, this is a known TODO (see exportPNG function comment)
- In this case, document the discrepancy and mark for future fix

---

### ✅ Test 8: Edge Cases
**Objective**: Test boundary conditions and edge cases.

**Steps:**
1. **Very high zoom**: Zoom to 500% (maximum)
   - Set view, switch away, switch back
   - Verify it works
   
2. **Very low zoom**: Zoom to 50% (minimum)
   - Set view, switch away, switch back
   - Verify it works

3. **Off-screen pan**: Pan so MP is completely off-screen
   - Set view
   - Switch away and back
   - Verify view is restored (even if MP is off-screen)

4. **No background**: Schema without background
   - Try setting view
   - Should gracefully handle or prevent

5. **Rapid switching**: Quickly switch between MPs
   - Should not crash or cause visual glitches

**Expected Results:**
- All edge cases handled gracefully
- No crashes or JavaScript errors
- Views restored correctly even in extreme cases

---

## Console Log Verification

During testing, monitor the browser console for these log messages:

✅ **When saving a view:**
```
📸 VIEW SAVED for MP1: {scale: "2.500", offsetX: "123.4", offsetY: "-56.7", currentCanvasZoom: {...}}
```

✅ **When applying a view (measurement mode):**
```
📐 APPLYING saved view for MP1: {scale: "2.500", offsetX: "123.4", offsetY: "-56.7", containerSize: "800x600"}
```

✅ **When applying a view (editor mode):**
```
🔍 EDITOR: Applying saved view for MP1: {scale: "2.500", offsetX: "123.4", offsetY: "-56.7"}
```

**What to check:**
- Scale values match when saving and restoring
- offsetX/offsetY values match when saving and restoring
- No JavaScript errors or warnings
- Container size is reasonable (not 0x0)

---

## Regression Testing

Ensure existing features still work:

- [ ] Arrow dragging in editor (handles are visible and movable)
- [ ] Label dragging in editor (labels can be repositioned)
- [ ] Measurement input (can type values)
- [ ] Status indicators (OK/NOK colors appear correctly)
- [ ] QR and Date labels (if enabled in schema)
- [ ] Minimap display (appears when zoomed, shows correct viewport)
- [ ] Reset View button (appears when zoomed, resets to 1x when clicked)
- [ ] Schema save/load (no corruption of schema files)
- [ ] CSV export (measurements save correctly)

---

## Sign-Off

**Tester Name:** _________________  
**Date:** _________________  
**Browser/Version:** _________________  
**OS:** _________________  

**Overall Result:** ☐ PASS  ☐ FAIL  ☐ PASS WITH ISSUES

**Notes/Issues Found:**
_____________________________________________
_____________________________________________
_____________________________________________

**Security Summary:**
✅ CodeQL security scan completed with 0 alerts.
