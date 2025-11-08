# Tooltip Positioning Fix - Technical Explanation

## Problem Description (Polish)

Obecnie, w komponencie "DB Viewer", dymek (tooltip) z sugestiami formuł nie jest prawidłowo pozycjonowany, gdy tabela jest przewijana w poziomie.

- **Stan początkowy:** Gdy tabela nie jest przewinięta, tooltip wyświetla się poprawnie pod edytowaną komórką.
- **Problem:** Po przesunięciu tabeli w prawo, tooltip "odjeżdża" od komórki, pozostając w pozycji obliczonej względem krawędzi okna, a nie przewijanego kontenera.

## Problem Description (English)

Currently, in the "DB Viewer" component, the tooltip with formula suggestions is not positioned correctly when the table is scrolled horizontally.

- **Initial state:** When the table is not scrolled, the tooltip displays correctly below the edited cell.
- **Problem:** After moving the table to the right, the tooltip "drifts" away from the cell, remaining in a position calculated relative to the window edge, not the scrolled container.

## Root Cause Analysis

### The Bug

The original code in `showSuggestions()` function (lines 1463-1464) was:

```javascript
const left = cellRect.left - modalBodyRect.left + scrollContainer.scrollLeft;
const top = cellRect.bottom - modalBodyRect.top + scrollContainer.scrollTop + 2;
```

### Why It Was Wrong

1. **`getBoundingClientRect()` returns viewport-relative coordinates**
   - When you call `cell.getBoundingClientRect()`, you get the position relative to the browser viewport
   - These coordinates ALREADY account for any scrolling that has occurred
   - For example, if a cell is at position (100, 50) in the table, but the table is scrolled 300px to the right, `getBoundingClientRect()` will return the cell's visible position in the viewport (e.g., -200, 50)

2. **Adding scroll offsets caused double-counting**
   - The original code added `scrollContainer.scrollLeft` to the position
   - This means the scroll offset was being counted twice:
     - Once in the `getBoundingClientRect()` result
     - Again when explicitly adding `scrollLeft`
   - Result: The tooltip moved TWICE as far as it should have

### Visual Example

```
Initial state (no scroll):
┌────────────────────────────────┐
│  Table Container               │
│  ┌──────────┐                 │
│  │  Cell    │                 │
│  └──────────┘                 │
│  ┌──────────┐                 │
│  │ Tooltip  │                 │
│  └──────────┘                 │
└────────────────────────────────┘
Position calculation:
- Cell at viewport: (200, 100)
- Container at viewport: (50, 80)
- Tooltip position: 200 - 50 = 150 ✓

Scrolled 300px right (BEFORE FIX):
┌────────────────────────────────┐
│  Table Container [===|        ]│ ← scrolled
│           ┌──────────┐         │
│           │  Cell    │         │
│           └──────────┘         │
│  ┌──────────┐                 │
│  │ Tooltip  │ ← WRONG POSITION│
│  └──────────┘                 │
└────────────────────────────────┘
Position calculation (WRONG):
- Cell at viewport: (-100, 100) [moved left due to scroll]
- Container at viewport: (50, 80)
- ScrollLeft: 300
- Tooltip position: -100 - 50 + 300 = 150
- But cell is now at -100, tooltip should be at -150!

Scrolled 300px right (AFTER FIX):
┌────────────────────────────────┐
│  Table Container [===|        ]│ ← scrolled
│           ┌──────────┐         │
│           │  Cell    │         │
│           └──────────┘         │
│           ┌──────────┐         │
│           │ Tooltip  │ ← CORRECT!
│           └──────────┘         │
└────────────────────────────────┘
Position calculation (CORRECT):
- Cell at viewport: (-100, 100)
- Container at viewport: (50, 80)
- Tooltip position: -100 - 50 = -150 ✓
- Tooltip follows the cell perfectly!
```

## The Solution

### Fixed Code

```javascript
const left = cellRect.left - modalBodyRect.left;
const top = cellRect.bottom - modalBodyRect.top + 2;
```

### Why It Works

1. **Simple coordinate transformation**
   - `cellRect.left` = cell's position in viewport (already accounts for scroll)
   - `modalBodyRect.left` = container's position in viewport
   - Subtract to get position relative to container
   - No need to add scroll offsets because they're already included!

2. **Mathematical proof**
   ```
   Cell in container = Cell in viewport - Container in viewport
   
   Example with 300px scroll:
   Cell in viewport = -100px (moved left due to scroll)
   Container in viewport = 50px
   Cell in container = -100 - 50 = -150px ✓
   
   This is correct because the container's left edge is at 50px,
   and the cell is 150px to the left of that edge within the container.
   ```

## Impact

### Before Fix
- ✗ Tooltip position was incorrect when table scrolled horizontally
- ✗ Greater scroll distance = greater misalignment
- ✗ Tooltip could appear far from the target cell
- ✗ Made formula editing difficult when working with many columns

### After Fix
- ✓ Tooltip stays perfectly aligned with the cell
- ✓ Works correctly at any scroll position
- ✓ Handles both horizontal and vertical scrolling
- ✓ Improves user experience significantly

## Testing the Fix

### Quick Test
1. Open DB Viewer
2. Scroll table horizontally to the right
3. Click on a cell and type `=`
4. Verify tooltip appears directly below the cell (not shifted to the left)

### Detailed Test
See `TOOLTIP_SCROLL_FIX_TEST.md` for comprehensive testing procedures.

## Related Code

### HTML Structure (index.html)
```html
<div class="modal-body">
    <div class="db-table-container">
        <table id="db-table" class="db-table"></table>
        <div id="formula-suggestions" class="suggestions-popup"></div>
    </div>
</div>
```

### CSS Positioning (style.css)
```css
.suggestions-popup {
    position: absolute;
    display: none;
    /* ... other styles ... */
}

.db-table-container { 
    width: 100%; 
    height: 100%; 
    overflow: auto; /* This creates the scroll container */
}
```

### Key Functions in app.js
- `showSuggestions(items, cell)` - Positions and displays the tooltip (lines ~1425-1486)
- `updateFormulaSuggestions(cell)` - Determines what suggestions to show (lines ~1374-1417)
- `hideSuggestions()` - Hides the tooltip (lines ~1491-1509)

## Lessons Learned

1. **`getBoundingClientRect()` is viewport-relative**
   - Always returns coordinates relative to the current viewport
   - Already accounts for scrolling
   - Never needs manual scroll offset adjustments

2. **Coordinate systems matter**
   - Viewport coordinates: relative to the browser window
   - Container coordinates: relative to a parent element
   - Converting between them requires only subtraction, not addition of scroll

3. **Common pitfall**
   - Many developers incorrectly add scroll offsets to `getBoundingClientRect()` results
   - This is almost always wrong and causes positioning bugs
   - The correct approach is simple subtraction between elements

## References

- [MDN: Element.getBoundingClientRect()](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect)
- [MDN: Element.scrollLeft](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollLeft)
- [CSS Tricks: Understanding getBoundingClientRect](https://css-tricks.com/snippets/javascript/get-bounding-client-rect/)

## Commit Information

- **Branch**: `copilot/fix-tooltip-positioning-issue`
- **Files Modified**: `app.js`
- **Lines Changed**: 1463-1466 (4 lines modified)
- **Lines Added**: Comments explaining the logic
- **Testing**: See `TOOLTIP_SCROLL_FIX_TEST.md`
