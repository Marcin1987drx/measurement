# Tooltip/Autocomplete Functionality Documentation

## Overview
The database editor now features a comprehensive tooltip/autocomplete system that assists users in creating formulas with functions and column references.

## Features

### 1. Dynamic Tooltip Triggers

#### Automatic Display on Empty Field
- **Behavior**: When a user focuses on an empty editable cell in the database viewer, the tooltip automatically displays a list of available mathematical functions.
- **Use Case**: Quick access to functions without typing any characters.

#### `=` Key Trigger
- **Behavior**: Typing `=` at the beginning of a cell activates formula mode and displays all available functions.
- **Functions Displayed**:
  - `SQRT` - Calculates the square root
  - `POW` - Raises a number to a power
  - `ABS` - Returns the absolute value
  - `ROUND` - Rounds a number
  - `SIN` - Calculates the sine
  - `COS` - Calculates the cosine
  - `TAN` - Calculates the tangent
  - `IF` - Conditional statement
  - `CONCAT` - Joins strings together

#### `[` Key Trigger
- **Behavior**: Typing `[` within a formula displays a list of all visible column headers from the database.
- **Filtering**: As you continue typing after `[`, the list filters in real-time to match the entered text.
- **Example**: Type `[Temp` to filter columns containing "Temp" like "Temperature", "TempMin", etc.

#### `]` Key Trigger
- **Behavior**: Typing `]` closes a column reference and returns the tooltip to showing mathematical functions for further operations.

### 2. Real-Time Filtering
- As you type characters after a trigger key, the tooltip automatically filters suggestions to match your input.
- Filtering is case-insensitive for better usability.
- For columns: partial matching (e.g., "temp" matches "Temperature")
- For functions: prefix matching (e.g., "SQ" matches "SQRT")

### 3. Interactive Selection

#### Keyboard Navigation
- **Arrow Down**: Move selection to the next suggestion
- **Arrow Up**: Move selection to the previous suggestion
- **Enter**: Insert the selected suggestion into the formula
- **Tab**: Insert the selected suggestion (same as Enter)
- **Escape**: Close the tooltip without inserting anything

#### Auto-Selection Features
- When only one suggestion matches, pressing Enter/Tab automatically selects it
- The active suggestion is highlighted with the accent color
- Selected items automatically scroll into view if needed

#### Mouse Selection
- Click on any suggestion to insert it immediately
- Hover effects provide visual feedback
- Smooth transitions on hover

### 4. Smart Insertion

#### Function Insertion
- When a function is selected, it's inserted with parentheses: `FUNCTION()`
- The cursor is automatically positioned between the parentheses for immediate parameter input
- If the field is empty, `=` is automatically prepended

#### Column Insertion
- Columns are inserted with brackets: `[ColumnName]`
- The cursor is positioned after the closing bracket
- Existing partial text is replaced intelligently

#### Chained Suggestions
- After inserting a suggestion, the tooltip automatically updates to show next relevant options
- Example: After inserting a column `[Temp]`, you can immediately type an operator and get function suggestions

### 5. Visual Feedback

#### Positioning
- The tooltip appears dynamically below the active cell
- Positioned to avoid overlapping with the cell content
- Automatically adjusts based on scroll position

#### Animations
- **Fade-in**: Smooth 200ms fade and slide-up animation when appearing
- **Fade-out**: Smooth 200ms fade when disappearing
- **Hover**: Instant background color transition on hover
- **Active**: Highlighted with accent color when selected via keyboard

#### Styling
- Distinct appearance for function vs. column suggestions
- Functions show their descriptions
- Columns show a `[Column]` type indicator
- Custom scrollbar for long lists
- Proper contrast in both light and dark modes

## Usage Examples

### Example 1: Simple Calculation
1. Focus on an empty cell in the database viewer
2. Tooltip appears showing all functions
3. Type `=SQ` → tooltip filters to show `SQRT`
4. Press Enter → `SQRT()` is inserted with cursor between parentheses
5. Type `[` → tooltip shows all columns
6. Type `Val` → filters to columns containing "Val"
7. Select a column → `[Value]` is inserted
8. Type `)` to complete the formula

**Result**: `=SQRT([Value])`

### Example 2: Complex Formula
1. Type `=` → see all functions
2. Type `POW` and press Enter → `POW()` inserted
3. Type `[Area]` → column reference inserted
4. Type `, 2)` → complete the power function
5. Type ` * ` → multiply operator
6. Type `[Factor]` → another column reference

**Result**: `=POW([Area], 2) * [Factor]`

### Example 3: Conditional Formula
1. Type `=IF` and press Enter → `IF()` inserted
2. Type `[Status]` → column reference
3. Type ` == "OK"` → condition
4. Type `, ` → separator
5. Type `[Value1]` → true result
6. Type `, ` → separator
7. Type `[Value2]` → false result
8. Type `)` → close

**Result**: `=IF([Status] == "OK", [Value1], [Value2])`

## Technical Implementation

### Key Components

#### State Management
- `appState.ui.formulaSuggestions` tracks:
  - `visible`: Boolean for tooltip visibility
  - `items`: Array of current suggestions
  - `activeIndex`: Currently selected suggestion index
  - `targetCell`: Reference to the active cell

#### Core Functions
- `updateFormulaSuggestions(cell)`: Main function that determines what to show
- `showSuggestions(items, cell)`: Renders and positions the tooltip
- `hideSuggestions()`: Hides tooltip with animation
- `handleSuggestionNavigation(event)`: Processes keyboard input
- `insertSuggestion()`: Inserts selected item into cell

#### Event Listeners
- `focus`: Triggered when empty cell gains focus
- `input`: Real-time update on any text change
- `keyup`: Detects trigger characters (=, [, ])
- `keydown`: Handles navigation keys
- `mousedown`: Handles mouse clicks on suggestions
- `blur`: Hides tooltip after short delay

## Browser Compatibility
- Requires modern browser with support for:
  - `contenteditable` attribute
  - Selection and Range APIs
  - CSS transitions and transforms
  - `requestAnimationFrame`
- Tested on Chrome, Edge, Firefox, and Safari

## Performance Considerations
- Debounced updates prevent excessive re-renders
- Efficient DOM manipulation using `innerHTML` batching
- Minimal re-layouts through transform animations
- Smart hiding/showing prevents flicker

## Accessibility
- Keyboard navigation fully supported
- Clear visual indicators for active state
- High contrast in both light and dark modes
- Smooth animations can be disabled via browser settings

## Future Enhancements
- Add more advanced functions (date, string manipulation)
- Support for nested formula suggestions
- Formula syntax highlighting in cells
- Tooltip preview showing formula result
- History of recently used formulas
- Custom function definitions
