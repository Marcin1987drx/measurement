# Quick Start Guide - Tooltip/Autocomplete Feature

## 🚀 Getting Started in 60 Seconds

### Step 1: Open Database Viewer
1. Click the **"DB Viewer"** button in the header
2. The database modal will open showing your data

### Step 2: Try the Tooltip
1. Click on any **editable cell** (not grayed out)
2. Notice the tooltip appears automatically if the cell is empty
3. Start typing to see the magic happen!

## 🎯 Quick Actions

### Create a Simple Formula
```
1. Click an empty cell
2. Type: =
3. See functions appear
4. Type: SQ
5. Press Enter
6. Result: =SQRT(|)  [cursor between parentheses]
```

### Reference a Column
```
1. Inside a formula, type: [
2. See column list appear
3. Type part of column name
4. Press Enter to select
5. Result: =[ColumnName]
```

### Complete Example - Area Calculation
```
Type this step-by-step:
= P O W Enter [ A r e a Enter , 2 )

Result: =POW([Area], 2)
```

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `=` | Start formula, show functions |
| `[` | Show columns |
| `]` | Return to functions |
| `↓` | Move down in list |
| `↑` | Move up in list |
| `Enter` | Insert selection |
| `Tab` | Insert selection (alternative) |
| `Esc` | Close tooltip |

## 🖱️ Mouse Actions

- **Hover** over suggestions to highlight
- **Click** on any suggestion to insert it
- **Scroll** through long lists

## 💡 Pro Tips

### Tip 1: Fast Selection
If only one match remains, just press Enter to select it immediately.

### Tip 2: Empty Field
Click on any empty cell to see all available functions without typing.

### Tip 3: Filter Quickly
Start typing immediately after `[` to filter columns:
```
[temp  → shows Temperature, TempMin, TempMax
```

### Tip 4: Chain Operations
After inserting a function or column, just keep typing:
```
=SQRT([Value])  * [Factor]
      ↑ insert    ↑ type   ↑ insert
```

## 🎨 Visual Indicators

- **Blue Highlight** = Selected with keyboard
- **[Column]** = Column reference
- **italic text** = Function description
- **Fade animation** = Tooltip appearing/disappearing

## 🐛 Troubleshooting

**Tooltip not appearing?**
- Make sure cell is editable (not grayed out)
- Try clicking the cell again
- Check that you're in DB Viewer mode

**Can't select with keyboard?**
- Make sure tooltip is visible
- Try arrow keys first, then Enter
- Press Escape and try again

**Wrong item inserted?**
- Use arrow keys to select before pressing Enter
- Or click with mouse for precise selection

## 📚 Learn More

- **Complete Documentation**: See `TOOLTIP_DOCUMENTATION.md`
- **Testing Guide**: See `TESTING_GUIDE.md`
- **Implementation Details**: See `IMPLEMENTATION_SUMMARY.md`

## 🎓 Example Formulas

### Basic Math
```
=SQRT([Value])
=POW([Base], 2)
=ABS([Difference])
```

### Complex Calculations
```
=POW([Area], 2) * [Factor]
=SQRT([X] * [X] + [Y] * [Y])
=ROUND([Value] * 100)
```

### Conditionals
```
=IF([Status] == "OK", [Value1], [Value2])
```

## ✅ Quick Test

Try this 30-second test:
1. Open DB Viewer
2. Click empty cell
3. Type `=`
4. Press `↓` three times
5. Press `Enter`
6. Type `[`
7. Click any column
8. Type `)`

You should now have a formula like `=ABS([ColumnName])`!

---

**Need Help?** Check the full documentation or testing guide for detailed instructions.

**Found a Bug?** Use the bug reporting template in TESTING_GUIDE.md to report it.
