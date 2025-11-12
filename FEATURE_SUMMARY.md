# Multi-Background Support - Feature Summary

## Overview
This feature adds support for multiple backgrounds in the schema editor and enables background-based filtering of measurement points in both the editor and Report Studio.

## User-Facing Features

### Schema Editor

#### 1. Background Management
- **Upload Multiple Backgrounds**: Users can now upload multiple background images for a single schema
- **Active Background Selection**: Choose which background to view in the editor
- **Default Background**: Set a default background for normal viewing mode
- **Background List**: View all uploaded backgrounds with delete capability

#### 2. Per-Point Background Assignment
- Each measurement point (MP) can be assigned to a specific background
- MPs without assignment appear on all backgrounds
- Background selection dropdown available in each MP card

#### 3. Filtered Viewing
- Editor displays only MPs relevant to the currently selected background
- Switching backgrounds instantly updates the view
- Improves clarity when working with complex schemas

### Report Studio

#### 1. Point Views Component Enhancement
- **Background Filter**: Filter displayed measurement points by background
- **Status Filters**: Show only OK or NOK measurements
- **Combined Filters**: Use background and status filters together

#### 2. Properties Panel
- Configure Point Views component filters through intuitive UI
- Dropdowns populate automatically from available backgrounds
- Real-time preview as filters are adjusted

## Use Cases

### Multi-View Product Inspection
**Scenario**: A product has multiple views (front, back, side) that need to be measured
**Solution**: 
- Upload backgrounds for each view
- Assign MPs to appropriate backgrounds
- Switch between views in editor without clutter
- Generate reports showing only relevant measurements per view

### Complex Assembly Measurement
**Scenario**: An assembly has different measurement zones requiring separate focus
**Solution**:
- Define backgrounds for each zone
- Group MPs by zone/background
- Operators see only relevant MPs for their current zone
- Reports can be generated per zone

### Progressive Measurement Workflow
**Scenario**: Measurements are taken in stages at different stations
**Solution**:
- Create background for each station
- Assign MPs to respective stations
- Each station sees only their measurements
- Complete report aggregates all stations

## Technical Benefits

### Data Organization
- Clear structure for background metadata
- Normalized MP-to-background relationships
- Backward compatible with existing schemas

### Performance
- Reduced visual clutter by filtering
- Faster rendering with fewer visible elements
- Efficient data structure with minimal overhead

### Maintainability
- Clean separation of background configuration
- Easy to add/remove backgrounds
- Simple migration path from old structure

## Getting Started

### For Schema Creators

1. **Open Schema Editor**
   - Create new schema or open existing one

2. **Add Backgrounds**
   - Click "Upload New Background"
   - Select image file (PNG, JPG, SVG)
   - Background is automatically added with unique ID

3. **Set Default Background**
   - Use "Default Background" dropdown
   - Select which background appears by default

4. **Assign MPs to Backgrounds**
   - Open MP card in editor
   - Find "Background" dropdown
   - Select appropriate background or leave as "Default/None"

5. **Switch Views**
   - Use "Active Background" dropdown
   - Editor updates to show only relevant MPs

6. **Save Schema**
   - Click "Save" button
   - All backgrounds and assignments are preserved

### For Report Users

1. **Open Report Studio**
   - Connect to project folder

2. **Add Point Views Component**
   - Drag "Point Views" from palette
   - Place on canvas

3. **Configure Filters**
   - Select the component
   - Open properties panel
   - Use "Filter by Background" dropdown
   - Optionally enable OK/NOK filters

4. **Generate Report**
   - Component shows filtered measurements
   - Preview before PDF generation

## Migration from Single Background

Existing schemas with a single background are automatically migrated:
- Old `backgroundFile` is converted to background object
- Migration happens on first load in editor
- No manual intervention required
- Original data is preserved

## Limitations and Future Enhancements

### Current Limitations
- No visual thumbnail preview in dropdowns
- No drag-and-drop reordering of backgrounds
- No bulk MP assignment tools
- Background names cannot be edited after upload

### Planned Enhancements (Future Phases)
- Background thumbnail gallery view
- Batch MP operations (copy, move, assign)
- Background templates/presets
- Import/export background configurations
- Advanced filtering options (by status, value range, etc.)
- Background-aware PDF page breaks in reports

## FAQs

**Q: Can an MP appear on multiple backgrounds?**
A: Yes, by leaving the MP's background assignment as "Default/None", it will appear on all backgrounds.

**Q: What happens if I delete a background that has MPs assigned to it?**
A: All MPs assigned to that background are automatically set to "Default/None" and will appear on all backgrounds.

**Q: Do I need to re-save existing schemas?**
A: No, existing schemas are automatically migrated when opened in the editor. However, re-saving is recommended to persist the new structure.

**Q: Can I use different file formats for backgrounds?**
A: Yes, PNG, JPG/JPEG, and SVG formats are supported.

**Q: How many backgrounds can I have per schema?**
A: There's no hard limit, but for practical purposes, 2-5 backgrounds per schema is recommended for clarity.

**Q: Does this work with table-type MPs?**
A: Yes, both single and table-type MPs support background assignment.

**Q: Can I preview backgrounds before uploading?**
A: Not in the current version. This is planned for a future enhancement.

**Q: Do backgrounds increase file size significantly?**
A: Background files are stored separately in the `/backgrounds` folder. The map.json file only stores references (IDs and filenames), so the increase in map file size is minimal.

## Support and Feedback

For issues, questions, or suggestions:
1. Check the PHASE1_IMPLEMENTATION.md for technical details
2. Review existing schemas for examples
3. Contact the development team for assistance

## Version Information

- **Feature Version**: Phase 1
- **Compatibility**: Backward compatible with all existing schemas
- **Dependencies**: None (uses existing file system adapter)
- **Browser Requirements**: Modern browsers with File System Access API support
