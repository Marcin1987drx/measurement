# Tooltip Scroll Position Fix - Testing Guide

## Issue Description
**Problem**: The formula suggestions tooltip was incorrectly positioned when the DB Viewer table was scrolled horizontally. The tooltip would "drift" away from the cell, with the misalignment increasing as the table was scrolled further to the right.

**Root Cause**: The positioning code was adding `scrollLeft` and `scrollTop` offsets to coordinates that already accounted for scrolling (from `getBoundingClientRect()`), causing double-counting of the scroll displacement.

**Fix**: Removed the addition of scroll offsets, as viewport-relative coordinates already reflect the current scroll position.

## How to Test the Fix

### Prerequisites
1. Chrome, Edge, or Opera browser (File System Access API required)
2. A project folder with a `busbarDB.csv` file containing multiple columns
3. Ensure the database has enough columns to require horizontal scrolling

### Test Steps

#### Test 1: Tooltip Position Without Scrolling (Baseline)
1. Open the application in your browser
2. Select your project folder
3. Click "DB Viewer" button
4. Click on an editable cell (avoid RecordId, Timestamp, SchemaName, etc.)
5. Type `=` to trigger the formula suggestions tooltip
6. **Verify**: Tooltip appears directly below the cell with a 2px gap
7. **Expected**: ✓ Tooltip is correctly aligned with the cell

#### Test 2: Tooltip Position With Horizontal Scroll (Main Fix)
1. In the DB Viewer, scroll the table to the right (horizontally)
   - Use the scrollbar at the bottom of the table
   - Scroll approximately 200-300 pixels to the right
2. Click on an editable cell that is now visible after scrolling
3. Type `=` to trigger the formula suggestions tooltip
4. **Verify**: Tooltip appears directly below the cell
5. **Expected**: ✓ Tooltip stays aligned with the cell, not drifting to the left

#### Test 3: Tooltip Position With Maximum Scroll
1. Scroll the table as far right as possible
2. Click on a cell near the right edge
3. Type `=` to show suggestions
4. **Verify**: Tooltip remains properly positioned
5. **Expected**: ✓ Tooltip is directly below the cell, regardless of scroll position

#### Test 4: Tooltip Position With Vertical Scroll
1. If the database has many rows, scroll down vertically
2. Click on an editable cell
3. Type `=` to show suggestions
4. **Verify**: Tooltip appears below the cell
5. **Expected**: ✓ Vertical scrolling also works correctly

#### Test 5: Tooltip Position With Both Scrolls
1. Scroll the table both horizontally (right) and vertically (down)
2. Click on a cell in the scrolled area
3. Type `=` to show suggestions
4. **Verify**: Tooltip is positioned correctly
5. **Expected**: ✓ Tooltip handles both scroll directions properly

#### Test 6: Dynamic Repositioning During Scroll
1. Click on a cell and type `=` to show the tooltip
2. While the tooltip is visible, scroll the table slightly
3. Click on another cell in the new view
4. Type `=` again
5. **Verify**: Tooltip repositions correctly for the new cell
6. **Expected**: ✓ Tooltip recalculates position correctly after scroll

### Visual Reference

**Before Fix** (Incorrect):
```
Table scrolled right 300px:
[Cell Position]
                           [Tooltip appears here - wrong!]
```

**After Fix** (Correct):
```
Table scrolled right 300px:
[Cell Position]
[Tooltip appears here - correct!]
```

## Technical Details

### Code Changes
**File**: `app.js`
**Function**: `showSuggestions()` (lines ~1450-1476)

**Before**:
```javascript
const left = cellRect.left - modalBodyRect.left + scrollContainer.scrollLeft;
const top = cellRect.bottom - modalBodyRect.top + scrollContainer.scrollTop + 2;
```

**After**:
```javascript
const left = cellRect.left - modalBodyRect.left;
const top = cellRect.bottom - modalBodyRect.top + 2;
```

### Why This Works
- `getBoundingClientRect()` returns coordinates relative to the viewport
- These coordinates already account for any scrolling
- We only need to convert from viewport coordinates to container coordinates
- Simple subtraction: `cellPosition - containerPosition = positionInContainer`

## Regression Testing

After verifying the fix works, also test these scenarios to ensure nothing broke:

1. **Formula suggestions still work**: Type `=` and verify functions appear
2. **Column references work**: Type `=[` and verify columns appear
3. **Keyboard navigation works**: Arrow keys, Tab, Enter, Escape all function
4. **Mouse selection works**: Click on suggestions to insert them
5. **Filtering works**: Type partial function/column names and verify filtering
6. **Tooltip closes properly**: Blur, Escape, and selection all close the tooltip

## Success Criteria

- ✓ Tooltip appears directly below the active cell (within 2-3 pixels)
- ✓ Position is maintained regardless of horizontal scroll distance
- ✓ Position is maintained regardless of vertical scroll distance
- ✓ Position works correctly with combined horizontal and vertical scrolling
- ✓ No visual "jumping" or repositioning after initial display
- ✓ All existing tooltip functionality continues to work

## Reporting Issues

If the tooltip still appears misaligned:

1. Take a screenshot showing:
   - The cell you clicked on
   - The tooltip position
   - The scroll position (scrollbar visible)

2. Note your environment:
   - Browser and version
   - Operating system
   - Screen resolution
   - Any browser extensions that might affect layout

3. Include console errors (F12 → Console tab)

4. Describe the scroll distance and direction when the issue occurs
