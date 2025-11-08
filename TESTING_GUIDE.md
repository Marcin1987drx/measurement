# Tooltip Functionality Testing Guide

## Prerequisites
- The application requires the File System Access API
- Use Chrome, Edge, or Opera on desktop
- Have a project folder with a `busbarDB.csv` file

## Test Scenarios

### Test 1: Empty Field Focus
**Objective**: Verify tooltip displays on empty field focus

**Steps**:
1. Open the application and select a project folder
2. Click "DB Viewer" button to open the database viewer
3. Click on any editable cell (not RecordId, Timestamp, etc.)
4. Observe: Tooltip should appear automatically showing all 9 functions

**Expected Result**:
- ✓ Tooltip appears below the cell
- ✓ All functions are listed (SQRT, POW, ABS, ROUND, SIN, COS, TAN, IF, CONCAT)
- ✓ Each function shows its description
- ✓ Smooth fade-in animation

**Pass Criteria**: All expected results are met

---

### Test 2: `=` Key Trigger
**Objective**: Verify typing `=` shows function list

**Steps**:
1. In DB Viewer, focus on an empty cell
2. Type `=` character
3. Observe: Tooltip shows function list

**Expected Result**:
- ✓ Tooltip appears after typing `=`
- ✓ Functions are displayed with descriptions
- ✓ Cursor is positioned after `=`

**Pass Criteria**: All expected results are met

---

### Test 3: `[` Key Trigger for Columns
**Objective**: Verify typing `[` shows column headers

**Steps**:
1. In DB Viewer, type `=` in a cell
2. Type `[` character
3. Observe: Tooltip switches to show column list

**Expected Result**:
- ✓ Tooltip shows all non-readonly columns
- ✓ Columns are marked with `[Column]` indicator
- ✓ No formula columns (RecordId, Timestamp, etc.) are shown

**Pass Criteria**: All expected results are met

---

### Test 4: Real-Time Filtering
**Objective**: Verify filtering works as user types

**Steps**:
1. Type `=SQ` in a cell
2. Observe filtering
3. Continue typing `SQR`
4. Observe filtering narrows down

**Expected Result**:
- ✓ After `SQ`, only `SQRT` is shown
- ✓ Filter is case-insensitive
- ✓ Tooltip updates in real-time without flicker

**Pass Criteria**: All expected results are met

---

### Test 5: Keyboard Navigation - Arrow Keys
**Objective**: Verify arrow key navigation works

**Steps**:
1. Type `=` to show function list
2. Press `Arrow Down` key multiple times
3. Press `Arrow Up` key multiple times
4. Observe selection changes

**Expected Result**:
- ✓ Arrow Down moves selection to next item
- ✓ Arrow Up moves selection to previous item
- ✓ Selection wraps around at edges
- ✓ Active item is highlighted with accent color
- ✓ Active item scrolls into view automatically

**Pass Criteria**: All expected results are met

---

### Test 6: Enter Key Insertion
**Objective**: Verify Enter key inserts selected suggestion

**Steps**:
1. Type `=` to show functions
2. Press `Arrow Down` twice to select `ABS`
3. Press `Enter`
4. Observe insertion

**Expected Result**:
- ✓ `ABS()` is inserted
- ✓ Cursor is positioned between parentheses
- ✓ Tooltip closes
- ✓ Ready for next input

**Pass Criteria**: All expected results are met

---

### Test 7: Tab Key Insertion
**Objective**: Verify Tab key works like Enter

**Steps**:
1. Type `=PO` to filter to `POW`
2. Press `Tab`
3. Observe insertion

**Expected Result**:
- ✓ `POW()` is inserted
- ✓ Same behavior as Enter key
- ✓ Cursor positioned between parentheses

**Pass Criteria**: All expected results are met

---

### Test 8: Mouse Click Selection
**Objective**: Verify mouse click inserts suggestion

**Steps**:
1. Type `=` to show functions
2. Hover over different functions
3. Click on `SQRT` function
4. Observe insertion

**Expected Result**:
- ✓ Hover shows visual feedback (background color change)
- ✓ Click inserts the function immediately
- ✓ `SQRT()` is inserted correctly
- ✓ Cursor positioned properly

**Pass Criteria**: All expected results are met

---

### Test 9: Escape Key
**Objective**: Verify Escape key closes tooltip

**Steps**:
1. Type `=` to show functions
2. Press `Escape` key
3. Observe tooltip behavior

**Expected Result**:
- ✓ Tooltip closes with fade-out animation
- ✓ No insertion occurs
- ✓ Cell content remains unchanged
- ✓ Cell remains focused

**Pass Criteria**: All expected results are met

---

### Test 10: Column Reference Flow
**Objective**: Verify complete column reference insertion

**Steps**:
1. Type `=SQRT(`
2. Type `[`
3. Type `Val` to filter columns
4. Select a column with Enter
5. Type `)`

**Expected Result**:
- ✓ Column list appears after `[`
- ✓ Filtering works correctly
- ✓ Column inserted as `[ColumnName]`
- ✓ Complete formula: `=SQRT([ColumnName])`

**Pass Criteria**: All expected results are met

---

### Test 11: Chained Suggestions
**Objective**: Verify tooltip reappears for next operation

**Steps**:
1. Type `=`
2. Insert `SQRT` function with Enter
3. Type `[` inside parentheses
4. Select a column
5. Type `)` to close
6. Type ` * `
7. Observe tooltip behavior

**Expected Result**:
- ✓ Tooltip shows functions after `=`
- ✓ Switches to columns after `[`
- ✓ Returns to functions after `]` or `)` and operator
- ✓ Smooth transitions between states

**Pass Criteria**: All expected results are met

---

### Test 12: Dynamic Positioning
**Objective**: Verify tooltip positions correctly with scrolling

**Steps**:
1. Scroll down in the database table
2. Focus on a cell near the bottom
3. Type `=` to show tooltip
4. Observe positioning

**Expected Result**:
- ✓ Tooltip appears below the cell
- ✓ Position updates with scroll
- ✓ Doesn't overflow viewport
- ✓ Maintains position relative to cell

**Pass Criteria**: All expected results are met

---

### Test 13: Complex Formula Creation
**Objective**: Verify full workflow with multiple operations

**Steps**:
1. Create formula: `=POW([Area], 2) * [Factor]`
2. Use tooltip for each component:
   - `=` → select POW
   - `[` → select Area column
   - Type `, 2)`
   - Type ` * `
   - `[` → select Factor column

**Expected Result**:
- ✓ Each step works smoothly
- ✓ Tooltip appears/disappears appropriately
- ✓ Final formula is correct
- ✓ No errors or glitches

**Pass Criteria**: All expected results are met

---

### Test 14: Single Item Auto-Selection
**Objective**: Verify auto-selection when only one match

**Steps**:
1. Type `=SQRT` (fully spelled out)
2. Press `Enter`
3. Observe behavior

**Expected Result**:
- ✓ Only SQRT is shown in tooltip
- ✓ Enter selects it even without arrow navigation
- ✓ Inserted as `SQRT()`

**Pass Criteria**: All expected results are met

---

### Test 15: Blur Behavior
**Objective**: Verify tooltip closes on blur

**Steps**:
1. Type `=` to show tooltip
2. Click outside the cell (on another cell or UI element)
3. Observe tooltip behavior

**Expected Result**:
- ✓ Tooltip closes with fade-out animation
- ✓ Short delay allows for mouse clicks on tooltip
- ✓ Cell loses focus
- ✓ No errors

**Pass Criteria**: All expected results are met

---

## Visual Quality Checks

### Animation Smoothness
- [ ] Fade-in animation is smooth (200ms)
- [ ] Fade-out animation is smooth (200ms)
- [ ] Hover transitions are instant and smooth
- [ ] No flickering or jarring movements

### Styling Consistency
- [ ] Colors match application theme (light/dark mode)
- [ ] Font sizes are readable
- [ ] Spacing is consistent
- [ ] Borders and shadows are subtle

### Responsive Behavior
- [ ] Tooltip adjusts to different cell sizes
- [ ] Works correctly with window resize
- [ ] Scrollbar appears for long lists
- [ ] Touch-friendly on supported devices

---

## Performance Checks

### Responsiveness
- [ ] No lag when typing quickly
- [ ] Filtering is instantaneous
- [ ] Tooltip appears without delay
- [ ] Navigation is smooth even with many suggestions

### Memory Usage
- [ ] No memory leaks after multiple uses
- [ ] Tooltip properly cleaned up on close
- [ ] Event listeners properly removed

---

## Compatibility Checks

### Browser Testing
- [ ] Chrome/Edge: All features work
- [ ] Firefox: All features work
- [ ] Safari: All features work
- [ ] Opera: All features work

### Dark Mode
- [ ] Tooltip visible in dark mode
- [ ] Colors have proper contrast
- [ ] Hover states visible
- [ ] Active selection clearly marked

---

## Edge Cases

### Empty Lists
**Test**: Type `=[ZZZZZ` (non-existent column)
**Expected**: Tooltip closes when no matches found

### Special Characters
**Test**: Type `=[Column Name With Spaces]`
**Expected**: Handles correctly if such columns exist

### Very Long Column Names
**Test**: Select column with 50+ character name
**Expected**: Tooltip and insertion handle without issues

### Rapid Input
**Test**: Type very quickly switching between modes
**Expected**: Tooltip keeps up without errors

---

## Regression Checks

### Existing Functionality
- [ ] Formula evaluation still works
- [ ] Column reordering still works
- [ ] Context menu still works
- [ ] Cell editing still works
- [ ] Enter key navigation still works (when tooltip not visible)

---

## Bug Reporting Template

If you find an issue, please report with:

**Issue Title**: Brief description

**Steps to Reproduce**:
1. Step one
2. Step two
3. ...

**Expected Behavior**: What should happen

**Actual Behavior**: What actually happens

**Environment**:
- Browser: [e.g., Chrome 120]
- OS: [e.g., Windows 11]
- Application Version: [commit hash]

**Screenshots/Videos**: If applicable

**Console Errors**: Any JavaScript errors from browser console
