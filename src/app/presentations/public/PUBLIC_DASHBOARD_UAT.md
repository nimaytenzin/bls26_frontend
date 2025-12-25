# Public Dashboard - User Acceptance Testing (UAT) Document

## Document Information



### TC-001: Landing Page (National Data Viewer)

**Objective**: Verify that the landing page loads correctly and displays national-level statistics

**Steps**:
1. Navigate to the public dashboard URL
2. Wait for the page to load completely
3. Verify the page displays correctly

**Expected Results**:
- ✅ Page loads without errors
- ✅ National map is displayed
- ✅ Statistics panel shows:
  - Total Households count
  - Total Enumeration Areas count
  - Total Dzongkhags (20)
- ✅ Map displays all dzongkhag boundaries
- ✅ Login button is visible in the header
- ✅ No console errors

**Test Status**: ☐ Pass ☐ Fail ☐ Blocked

**Notes**: 
- [Any observations or issues]

---

### TC-002: Map Visualization Mode - Households

**Objective**: Verify that the map correctly visualizes data by households

**Steps**:
1. Navigate to the national data viewer
2. Ensure "Households" visualization mode is selected (default)
3. Observe the map coloring
4. Check the legend

**Expected Results**:
- ✅ Map displays dzongkhags colored based on household counts
- ✅ Color intensity corresponds to household values (darker = more households)
- ✅ Legend displays household ranges with appropriate colors
- ✅ Legend shows min and max values for households
- ✅ Color scale matches the selected color scale option

**Test Status**: ☐ Pass ☐ Fail ☐ Blocked

---

### TC-003: Map Visualization Mode - Enumeration Areas

**Objective**: Verify that the map correctly visualizes data by enumeration areas

**Steps**:
1. Navigate to the national data viewer
2. Click on "Enumeration Areas" visualization mode
3. Observe the map coloring
4. Check the legend

**Expected Results**:
- ✅ Map displays dzongkhags colored based on enumeration area counts
- ✅ Color intensity corresponds to EA values (darker = more EAs)
- ✅ Legend displays EA ranges with appropriate colors
- ✅ Legend shows min and max values for enumeration areas
- ✅ Statistics update to reflect EA mode

**Test Status**: ☐ Pass ☐ Fail ☐ Blocked

---

### TC-004: Color Scale Selection

**Objective**: Verify that different color scales can be selected and applied

**Prerequisites**: Admin must have configured color scale options in admin panel

**Steps**:
1. Navigate to the national data viewer
2. Open the map controls/settings panel
3. Locate color scale options
4. Select different color scales (Blue, Green, Red, Yellow, Purple, Orange)
5. Observe map changes

**Expected Results**:
- ✅ All available color scales are listed
- ✅ Selected color scale is visually indicated
- ✅ Map colors update immediately when color scale is changed
- ✅ Legend reflects the new color scale
- ✅ Color scale preference persists during session (if implemented)

**Available Color Scales**:
- ☐ Blue (default)
- ☐ Green
- ☐ Red
- ☐ Yellow
- ☐ Purple
- ☐ Orange

**Test Status**: ☐ Pass ☐ Fail ☐ Blocked

---

### TC-005: Basemap Selection

**Objective**: Verify that different basemaps can be selected

**Steps**:
1. Navigate to any data viewer page
2. Open the basemap selector control
3. Select different basemap options
4. Verify map updates

**Expected Results**:
- ✅ Basemap selector displays available basemaps with thumbnails
- ✅ Basemaps are categorized appropriately
- ✅ Selected basemap is visually indicated
- ✅ Map updates immediately when basemap is changed
- ✅ All basemaps load correctly without errors
- ✅ Basemap attribution is displayed (if required)

**Available Basemaps**:
- ☐ Positron (default)
- ☐ Dark Matter
- ☐ OpenStreetMap
- ☐ Google Satellite
- ☐ No Basemap
- ☐ Other configured basemaps

**Test Status**: ☐ Pass ☐ Fail ☐ Blocked

---

### TC-006: Navigate to Dzongkhag View

**Objective**: Verify navigation from national view to dzongkhag view

**Steps**:
1. Navigate to the national data viewer
2. Click on a dzongkhag on the map (e.g., Thimphu)
3. Verify navigation occurs

**Expected Results**:
- ✅ Clicking on a dzongkhag navigates to dzongkhag detail page
- ✅ URL updates to `/dzongkhag/{dzongkhagId}`
- ✅ Dzongkhag data viewer loads correctly
- ✅ Map shows the selected dzongkhag boundary
- ✅ Administrative zones within the dzongkhag are displayed
- ✅ Statistics panel shows dzongkhag-specific statistics
- ✅ Page title/header shows dzongkhag name

**Test Status**: ☐ Pass ☐ Fail ☐ Blocked

---

### TC-007: Dzongkhag Data Viewer - Statistics

**Objective**: Verify statistics display in dzongkhag view

**Steps**:
1. Navigate to a dzongkhag data viewer (e.g., Thimphu)
2. Review the statistics panel

**Expected Results**:
- ✅ Statistics panel displays:
  - Total Households for the dzongkhag
  - Total Enumeration Areas for the dzongkhag
  - Number of Administrative Zones
- ✅ Statistics are accurate and match backend data
- ✅ Numbers are formatted with thousand separators
- ✅ Statistics update correctly when visualization mode changes

**Test Status**: ☐ Pass ☐ Fail ☐ Blocked

---

### TC-008: Navigate to Administrative Zone View

**Objective**: Verify navigation from dzongkhag to administrative zone

**Steps**:
1. Navigate to a dzongkhag data viewer
2. Click on an administrative zone on the map
3. Verify navigation occurs

**Expected Results**:
- ✅ Clicking on an administrative zone navigates to administrative zone detail page
- ✅ URL updates to `/administrative-zone/{dzongkhagId}/{adminZoneId}`
- ✅ Administrative zone data viewer loads correctly
- ✅ Map shows the selected administrative zone boundary
- ✅ Sub-administrative zones within the admin zone are displayed
- ✅ Statistics panel shows administrative zone-specific statistics

**Test Status**: ☐ Pass ☐ Fail ☐ Blocked

---

### TC-009: Navigate to Sub-Administrative Zone View

**Objective**: Verify navigation from administrative zone to sub-administrative zone

**Steps**:
1. Navigate to an administrative zone data viewer
2. Click on a sub-administrative zone on the map
3. Verify navigation occurs

**Expected Results**:
- ✅ Clicking on a SAZ navigates to SAZ detail page
- ✅ URL updates to `/sub-administrative-zone/{adminZoneId}/{sazId}`
- ✅ Sub-administrative zone data viewer loads correctly
- ✅ Map shows the selected SAZ boundary
- ✅ Enumeration areas within the SAZ are displayed
- ✅ Statistics panel shows SAZ-specific statistics
- ✅ Household listing table is available (if applicable)

**Test Status**: ☐ Pass ☐ Fail ☐ Blocked

---

### TC-010: Download GeoJSON - National Level

**Objective**: Verify GeoJSON download functionality at national level

**Steps**:
1. Navigate to the national data viewer
2. Open the download section/controls
3. Click on "Download GeoJSON" button
4. Verify file download

**Expected Results**:
- ✅ Download button is visible and accessible
- ✅ Clicking download initiates file download
- ✅ Downloaded file is named appropriately (e.g., `national-dzongkhags.geojson`)
- ✅ File contains valid GeoJSON data
- ✅ GeoJSON contains all dzongkhag boundaries
- ✅ File includes properties/attributes (dzongkhag names, codes, statistics)
- ✅ File can be opened in GIS software (QGIS, ArcGIS)

**Test Status**: ☐ Pass ☐ Fail ☐ Blocked

---

### TC-011: Download KML - National Level

**Objective**: Verify KML download functionality at national level

**Steps**:
1. Navigate to the national data viewer
2. Open the download section/controls
3. Click on "Download KML" button
4. Verify file download

**Expected Results**:
- ✅ Download button is visible and accessible
- ✅ Clicking download initiates file download
- ✅ Downloaded file is named appropriately (e.g., `national-dzongkhags.kml`)
- ✅ File contains valid KML data
- ✅ KML contains all dzongkhag boundaries
- ✅ File can be opened in Google Earth or other KML viewers

**Test Status**: ☐ Pass ☐ Fail ☐ Blocked

---

### TC-012: Download GeoJSON - Dzongkhag Level

**Objective**: Verify GeoJSON download at dzongkhag level

**Steps**:
1. Navigate to a dzongkhag data viewer
2. Open the download section
3. Click on "Download GeoJSON" button
4. Verify file download

**Expected Results**:
- ✅ Download button is visible
- ✅ File downloads with appropriate name (e.g., `thimphu-dzongkhag.geojson`)
- ✅ GeoJSON contains dzongkhag boundary
- ✅ GeoJSON contains administrative zone boundaries
- ✅ Properties include relevant statistics

**Test Status**: ☐ Pass ☐ Fail ☐ Blocked

---

### TC-013: Download KML - Dzongkhag Level

**Objective**: Verify KML download at dzongkhag level

**Steps**:
1. Navigate to a dzongkhag data viewer
2. Open the download section
3. Click on "Download KML" button
4. Verify file download

**Expected Results**:
- ✅ Download button is visible
- ✅ File downloads correctly
- ✅ KML contains dzongkhag and administrative zone boundaries
- ✅ File opens correctly in Google Earth

**Test Status**: ☐ Pass ☐ Fail ☐ Blocked

---

### TC-014: Download at Administrative Zone Level

**Objective**: Verify download functionality at administrative zone level

**Steps**:
1. Navigate to an administrative zone data viewer
2. Test both GeoJSON and KML downloads

**Expected Results**:
- ✅ Both download options are available
- ✅ Files download with correct naming convention
- ✅ Files contain administrative zone and sub-administrative zone boundaries
- ✅ Files are valid and can be opened in GIS software

**Test Status**: ☐ Pass ☐ Fail ☐ Blocked

---

### TC-015: Download at Sub-Administrative Zone Level

**Objective**: Verify download functionality at SAZ level

**Steps**:
1. Navigate to a sub-administrative zone data viewer
2. Test both GeoJSON and KML downloads

**Expected Results**:
- ✅ Both download options are available
- ✅ Files download correctly
- ✅ Files contain SAZ and enumeration area boundaries
- ✅ Files are valid

**Test Status**: ☐ Pass ☐ Fail ☐ Blocked

---

### TC-016: Search and Filter Dzongkhags

**Objective**: Verify search and filter functionality

**Steps**:
1. Navigate to the national data viewer
2. Locate the search/filter control (if available)
3. Enter a dzongkhag name (e.g., "Thimphu")
4. Verify filtering occurs

**Expected Results**:
- ✅ Search/filter input is visible
- ✅ Entering text filters the dzongkhag list
- ✅ Map highlights or filters to show matching dzongkhags
- ✅ Clear/reset filter functionality works
- ✅ Case-insensitive search works

**Test Status**: ☐ Pass ☐ Fail ☐ Blocked

---

### TC-017: Dzongkhag List View

**Objective**: Verify dzongkhag list display

**Steps**:
1. Navigate to the national data viewer
2. Switch to "List" tab/view (if available)
3. Review the dzongkhag list

**Expected Results**:
- ✅ List view displays all dzongkhags
- ✅ List shows key information: Name, Code, Households, EAs
- ✅ List is sortable (if implemented)
- ✅ Clicking on a dzongkhag in the list navigates to its detail page
- ✅ List is scrollable/paginated if many items

**Test Status**: ☐ Pass ☐ Fail ☐ Blocked

---

### TC-018: Map Interactions - Zoom

**Objective**: Verify map zoom functionality

**Steps**:
1. Navigate to any data viewer page
2. Use mouse wheel to zoom in/out
3. Use zoom controls (+/- buttons)
4. Double-click to zoom in

**Expected Results**:
- ✅ Mouse wheel zoom works smoothly
- ✅ Zoom controls (+/-) work correctly
- ✅ Double-click zoom works
- ✅ Map maintains proper boundaries and doesn't allow excessive zoom
- ✅ Zoom level is appropriate for data display

**Test Status**: ☐ Pass ☐ Fail ☐ Blocked

---

### TC-019: Map Interactions - Pan

**Objective**: Verify map pan/drag functionality

**Steps**:
1. Navigate to any data viewer page
2. Click and drag on the map
3. Verify map moves

**Expected Results**:
- ✅ Click and drag pans the map smoothly
- ✅ Map doesn't pan beyond reasonable boundaries
- ✅ Map maintains proper positioning

**Test Status**: ☐ Pass ☐ Fail ☐ Blocked

---

### TC-020: Feature Hover and Tooltips

**Objective**: Verify hover effects and tooltips on map features

**Steps**:
1. Navigate to any data viewer page
2. Hover over map features (dzongkhags, zones, etc.)
3. Observe hover effects and tooltips

**Expected Results**:
- ✅ Hovering over features changes cursor appropriately
- ✅ Features highlight on hover
- ✅ Tooltips display relevant information (name, statistics)
- ✅ Tooltips are readable and positioned correctly
- ✅ Tooltips don't obstruct map interaction

**Test Status**: ☐ Pass ☐ Fail ☐ Blocked

---

### TC-021: Legend Display

**Objective**: Verify legend displays correctly

**Steps**:
1. Navigate to any data viewer page
2. Locate the legend
3. Review legend content

**Expected Results**:
- ✅ Legend is visible and accessible
- ✅ Legend shows color scale gradient
- ✅ Legend displays value ranges (min to max)
- ✅ Legend updates when visualization mode changes
- ✅ Legend updates when color scale changes
- ✅ Legend is readable and well-formatted

**Test Status**: ☐ Pass ☐ Fail ☐ Blocked

---

### TC-022: Breadcrumb Navigation

**Objective**: Verify breadcrumb navigation (if implemented)

**Steps**:
1. Navigate through multiple levels (National → Dzongkhag → Admin Zone)
2. Click on breadcrumb items
3. Verify navigation

**Expected Results**:
- ✅ Breadcrumbs display current location hierarchy
- ✅ Clicking breadcrumb navigates to that level
- ✅ Breadcrumbs are always visible
- ✅ Breadcrumbs are clearly labeled

**Test Status**: ☐ Pass ☐ Fail ☐ Blocked

---

### TC-023: Back Navigation

**Objective**: Verify back button functionality (if implemented)

**Steps**:
1. Navigate from national to dzongkhag view
2. Click back button
3. Verify navigation

**Expected Results**:
- ✅ Back button is visible and accessible
- ✅ Clicking back navigates to previous level
- ✅ Browser back button also works correctly

**Test Status**: ☐ Pass ☐ Fail ☐ Blocked

---

### TC-024: Mobile Responsive Design - National View

**Objective**: Verify mobile responsiveness on national data viewer

**Steps**:
1. Open the dashboard on a mobile device or resize browser to mobile size
2. Test key functionality

**Expected Results**:
- ✅ Layout adapts to mobile screen size
- ✅ Map is visible and usable
- ✅ Statistics panel is accessible (may be in drawer/modal)
- ✅ Navigation controls are accessible
- ✅ Touch interactions work (tap, pinch zoom, pan)
- ✅ Text is readable without zooming
- ✅ Buttons are appropriately sized for touch
- ✅ Mobile menu/drawer works correctly

**Test Status**: ☐ Pass ☐ Fail ☐ Blocked

---

### TC-025: Mobile Responsive Design - Dzongkhag View

**Objective**: Verify mobile responsiveness on dzongkhag data viewer

**Steps**:
1. Navigate to dzongkhag view on mobile device
2. Test all functionality

**Expected Results**:
- ✅ Layout adapts correctly
- ✅ Map interactions work
- ✅ Statistics are accessible
- ✅ Downloads work
- ✅ Navigation works

**Test Status**: ☐ Pass ☐ Fail ☐ Blocked

---

### TC-026: Loading States

**Objective**: Verify loading indicators display correctly

**Steps**:
1. Navigate to any data viewer page
2. Observe loading behavior
3. Test on slow network connection (use browser throttling)

**Expected Results**:
- ✅ Loading spinner/indicator displays while data loads
- ✅ Loading message is clear and informative
- ✅ Map doesn't show broken tiles during load
- ✅ Statistics show loading state
- ✅ Page is usable after loading completes

**Test Status**: ☐ Pass ☐ Fail ☐ Blocked

---

### TC-027: Error Handling - Network Errors

**Objective**: Verify error handling when network fails

**Steps**:
1. Disable network connection
2. Try to load the dashboard
3. Re-enable network
4. Try to navigate/load data

**Expected Results**:
- ✅ Error message displays when data fails to load
- ✅ Error message is user-friendly
- ✅ Retry option is available
- ✅ Application doesn't crash
- ✅ After reconnecting, data loads successfully

**Test Status**: ☐ Pass ☐ Fail ☐ Blocked

---

### TC-028: Error Handling - Invalid Route

**Objective**: Verify error handling for invalid routes

**Steps**:
1. Navigate to invalid URL (e.g., `/dzongkhag/99999`)
2. Verify error handling

**Expected Results**:
- ✅ Appropriate error message displays
- ✅ User can navigate back to valid page
- ✅ Error message is clear and helpful
- ✅ Application doesn't crash

**Test Status**: ☐ Pass ☐ Fail ☐ Blocked

---

### TC-029: Statistics Accuracy

**Objective**: Verify statistics are accurate

**Steps**:
1. Navigate to different levels
2. Compare statistics with known data
3. Verify calculations

**Expected Results**:
- ✅ Statistics match backend data
- ✅ Totals are calculated correctly
- ✅ Statistics update correctly when filters are applied
- ✅ Statistics are consistent across views

**Test Status**: ☐ Pass ☐ Fail ☐ Blocked

**Validation Data**:
- National Total Households: __________
- National Total EAs: __________
- Sample Dzongkhag Households: __________
- Sample Dzongkhag EAs: __________

---

### TC-030: Performance - Page Load Time

**Objective**: Verify page loads within acceptable time

**Steps**:
1. Clear browser cache
2. Open browser developer tools (Network tab)
3. Load the national data viewer
4. Measure load time

**Expected Results**:
- ✅ Initial page load < 3 seconds (on good connection)
- ✅ Map tiles load progressively
- ✅ Statistics load quickly
- ✅ No long blocking operations
- ✅ Progressive rendering occurs

**Test Status**: ☐ Pass ☐ Fail ☐ Blocked

**Performance Metrics**:
- Initial Load Time: __________ seconds
- Time to Interactive: __________ seconds
- First Contentful Paint: __________ seconds

---

### TC-031: Performance - Map Rendering

**Objective**: Verify map renders smoothly

**Steps**:
1. Navigate to different views
2. Zoom and pan around the map
3. Observe rendering performance

**Expected Results**:
- ✅ Map renders smoothly (60fps or close)
- ✅ No lag when zooming/panning
- ✅ Features appear quickly when navigating
- ✅ No janky animations
- ✅ Memory usage is reasonable

**Test Status**: ☐ Pass ☐ Fail ☐ Blocked

---

### TC-032: Browser Compatibility - Chrome

**Objective**: Verify functionality in Google Chrome

**Steps**:
1. Open dashboard in Google Chrome (latest version)
2. Test all major features
3. Check for console errors

**Expected Results**:
- ✅ All features work correctly
- ✅ No console errors
- ✅ Map displays correctly
- ✅ Styling is correct

**Test Status**: ☐ Pass ☐ Fail ☐ Blocked

**Browser Version**: __________

---

### TC-033: Browser Compatibility - Firefox

**Objective**: Verify functionality in Mozilla Firefox

**Steps**:
1. Open dashboard in Firefox (latest version)
2. Test all major features
3. Check for console errors

**Expected Results**:
- ✅ All features work correctly
- ✅ No console errors
- ✅ Map displays correctly
- ✅ Styling is correct

**Test Status**: ☐ Pass ☐ Fail ☐ Blocked

**Browser Version**: __________

---

### TC-034: Browser Compatibility - Safari

**Objective**: Verify functionality in Safari

**Steps**:
1. Open dashboard in Safari (latest version)
2. Test all major features
3. Check for console errors

**Expected Results**:
- ✅ All features work correctly
- ✅ No console errors
- ✅ Map displays correctly
- ✅ Styling is correct

**Test Status**: ☐ Pass ☐ Fail ☐ Blocked

**Browser Version**: __________

---

### TC-035: Browser Compatibility - Edge

**Objective**: Verify functionality in Microsoft Edge

**Steps**:
1. Open dashboard in Edge (latest version)
2. Test all major features
3. Check for console errors

**Expected Results**:
- ✅ All features work correctly
- ✅ No console errors
- ✅ Map displays correctly
- ✅ Styling is correct

**Test Status**: ☐ Pass ☐ Fail ☐ Blocked

**Browser Version**: __________

---

### TC-036: Accessibility - Keyboard Navigation

**Objective**: Verify keyboard accessibility

**Steps**:
1. Navigate using only keyboard (Tab, Enter, Arrow keys)
2. Test all interactive elements

**Expected Results**:
- ✅ All interactive elements are focusable
- ✅ Focus indicators are visible
- ✅ Tab order is logical
- ✅ Enter/Space activate buttons
- ✅ Arrow keys navigate lists/menus
- ✅ Escape closes modals/drawers

**Test Status**: ☐ Pass ☐ Fail ☐ Blocked

---

### TC-037: Accessibility - Screen Reader

**Objective**: Verify screen reader compatibility

**Steps**:
1. Enable screen reader (NVDA, JAWS, or VoiceOver)
2. Navigate through the dashboard
3. Verify content is announced correctly

**Expected Results**:
- ✅ All text content is readable
- ✅ Interactive elements are properly labeled
- ✅ Map has appropriate alternative text/descriptions
- ✅ Statistics are announced correctly
- ✅ Navigation is clear

**Test Status**: ☐ Pass ☐ Fail ☐ Blocked

**Screen Reader Used**: ☐ NVDA ☐ JAWS ☐ VoiceOver ☐ Other: __________

---

### TC-038: Accessibility - Color Contrast

**Objective**: Verify color contrast meets WCAG standards

**Steps**:
1. Review all text and background color combinations
2. Use contrast checking tools
3. Verify readability

**Expected Results**:
- ✅ Text meets WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
- ✅ Interactive elements have sufficient contrast
- ✅ Map colors are distinguishable
- ✅ All users can read content easily

**Test Status**: ☐ Pass ☐ Fail ☐ Blocked

---

### TC-039: Settings Persistence

**Objective**: Verify user settings persist (if implemented)

**Steps**:
1. Change visualization mode
2. Change color scale
3. Change basemap
4. Refresh page or navigate away and back
5. Verify settings are remembered

**Expected Results**:
- ✅ Settings persist across page refreshes
- ✅ Settings persist across navigation
- ✅ Settings are stored appropriately (localStorage/sessionStorage)

**Note**: This feature may not be implemented - verify with development team

**Test Status**: ☐ Pass ☐ Fail ☐ Blocked ☐ Not Applicable

---

### TC-040: Print Functionality

**Objective**: Verify print functionality (if implemented)

**Steps**:
1. Navigate to any data viewer page
2. Use browser print function (Ctrl+P / Cmd+P)
3. Review print preview

**Expected Results**:
- ✅ Page prints correctly
- ✅ Map is visible in print (if printable)
- ✅ Statistics are included
- ✅ Layout is appropriate for printing
- ✅ No unnecessary UI elements in print

**Test Status**: ☐ Pass ☐ Fail ☐ Blocked ☐ Not Applicable

---

## Feature Testing Checklist

### Map Features
- [ ] Map loads correctly
- [ ] Basemap selection works
- [ ] Color scale selection works
- [ ] Visualization mode toggle (Households/EAs) works
- [ ] Zoom controls work
- [ ] Pan/drag works
- [ ] Feature hover effects work
- [ ] Tooltips display correctly
- [ ] Legend displays correctly
- [ ] Boundaries toggle works (if available)

### Navigation Features
- [ ] National view loads
- [ ] Navigate to dzongkhag view
- [ ] Navigate to administrative zone view
- [ ] Navigate to sub-administrative zone view
- [ ] Click on features to navigate
- [ ] Breadcrumb navigation (if available)
- [ ] Back button works
- [ ] URL routing works correctly

### Statistics Display
- [ ] National statistics display
- [ ] Dzongkhag statistics display
- [ ] Administrative zone statistics display
- [ ] Sub-administrative zone statistics display
- [ ] Statistics update when mode changes
- [ ] Statistics are accurate
- [ ] Number formatting is correct

### Download Functionality
- [ ] GeoJSON download works at all levels
- [ ] KML download works at all levels
- [ ] Downloaded files are valid
- [ ] File names are appropriate
- [ ] Files contain expected data
- [ ] Files can be opened in GIS software

### UI/UX
- [ ] Layout is clean and organized
- [ ] Icons are clear and meaningful
- [ ] Buttons are appropriately sized
- [ ] Text is readable
- [ ] Colors are appropriate
- [ ] Loading states are clear
- [ ] Error messages are user-friendly
- [ ] Mobile layout works

---

## Defect Reporting

### Defect Report Template

**Defect ID**: DEF-001

**Title**: [Brief description of the defect]

**Severity**: ☐ Critical ☐ High ☐ Medium ☐ Low

**Priority**: ☐ P0 ☐ P1 ☐ P2 ☐ P3

**Environment**:
- Browser: __________
- Browser Version: __________
- OS: __________
- Screen Resolution: __________
- Device: Desktop / Mobile / Tablet

**Steps to Reproduce**:
1. __________
2. __________
3. __________

**Expected Result**: __________

**Actual Result**: __________

**Screenshots/Videos**: [Attach if applicable]

**Console Errors**: [Copy any console errors]

**Additional Notes**: __________

---

## Test Summary

### Overall Test Status

**Total Test Cases**: 40

**Passed**: _____

**Failed**: _____

**Blocked**: _____

**Not Applicable**: _____

**Pass Rate**: _____%

### Critical Issues Found

1. __________
2. __________
3. __________

### Recommendations

1. __________
2. __________
3. __________

### Sign-Off

**Tester Name**: __________

**Date**: __________

**Signature**: __________

**Approved for Production**: ☐ Yes ☐ No ☐ Conditional

**Approver Name**: __________

**Date**: __________

**Signature**: __________

---

## Appendix

### A. Known Issues
[List any known issues that don't block testing]

### B. Testing Tools Used
- Browser Developer Tools
- Network Throttling Tools
- Accessibility Testing Tools (if used)
- Performance Testing Tools (if used)

### C. Test Data Reference
[Reference to test data sources, expected values, etc.]

### D. Contact Information
- **Development Team**: __________
- **QA Team**: __________
- **Product Owner**: __________

---

**Document Version**: 1.0
**Last Updated**: December 2024
**Next Review Date**: __________

