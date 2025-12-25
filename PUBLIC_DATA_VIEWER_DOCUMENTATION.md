# Public Data Viewer Dashboards - User Questions Documentation

## Overview

The Public Data Viewer consists of two interactive dashboards that provide transparent access to Bhutan's National Statistical Bureau (NSB) sampling frame data. These dashboards are designed to answer key questions that citizens, researchers, policymakers, and other stakeholders may have about the statistical sampling infrastructure of the country.

---

## National Data Viewer Dashboard

**Purpose**: Provides a country-wide overview of the sampling frame, enabling users to understand the scale and distribution of enumeration areas and households across all dzongkhags (districts) in Bhutan.

### Key Questions This Dashboard Answers

#### 1. **Scale and Scope Questions**
- **What is the total number of households in Bhutan's sampling frame?**
  - Answer: Displays total households across all dzongkhags in real-time
  - Location: Key statistics card in the sidebar

- **What is the total number of enumeration areas (EAs) in Bhutan?**
  - Answer: Shows total enumeration areas that make up the national sampling frame
  - Location: Key statistics card in the sidebar

- **How many dzongkhags are included in the sampling frame?**
  - Answer: Displays the count of dzongkhags with available data
  - Location: Statistics summary and list view

#### 2. **Geographic Distribution Questions**
- **Which dzongkhags have the most households?**
  - Answer: Map visualization with color-coding shows relative household density
  - Location: Interactive map with hover tooltips and legend
  - Action: Users can switch to "Households" visualization mode

- **Which dzongkhags have the most enumeration areas?**
  - Answer: Map visualization highlights dzongkhags by EA count
  - Location: Interactive map when "Enumeration Areas" mode is selected
  - Action: Users can switch visualization mode to see EA distribution

- **How are households distributed geographically across Bhutan?**
  - Answer: Color-coded map shows relative concentrations
  - Location: Main map interface with gradient legend
  - Insight: Darker colors indicate higher values, enabling quick pattern recognition

#### 3. **Comparison and Ranking Questions**
- **Which dzongkhag ranks highest in household count?**
  - Answer: List view shows all dzongkhags sorted, with statistics displayed
  - Location: "List" tab in the sidebar
  - Feature: Clickable cards to drill down for detailed views



- **How does my dzongkhag compare to others?**
  - Answer: Users can view all dzongkhags side-by-side in the list view
  - Location: List tab with comparative statistics displayed

#### 4. **Data Access and Export Questions**
- **Can I download the national boundary data for my own analysis?**
  - Answer: Yes, users can download dzongkhag boundaries as GeoJSON or KML
  - Location: Download button in the map controls
  - Formats: GeoJSON (for GIS software), KML (for Google Earth)

- **What is included in the downloadable data?**
  - Answer: Geographic boundaries of all dzongkhags with associated statistics
  - Feature: Includes both spatial geometry and attribute data

#### 5. **Understanding Sampling Frame Questions**
- **What is a sampling frame and why is it important?**
  - Answer: Information box explains that a sampling frame is a population from which a sample can be drawn
  - Location: Info box in the sidebar header
  - Purpose: Educational context for non-technical users

- **What is the breakdown between urban and rural enumeration areas?**
  - Answer: Info box displays statistics like "3,310 EAs total (1,464 urban, 1,846 rural)"
  - Location: Info box in sidebar (content configurable by administrators)

---

## Dzongkhag Data Viewer Dashboard

**Purpose**: Provides detailed, district-level insights into the sampling frame, showing how households and enumeration areas are organized within a specific dzongkhag through its administrative zones (Gewogs and Thromdes).

### Key Questions This Dashboard Answers

#### 1. **District-Level Scale Questions**
- **How many households are in this dzongkhag?**
  - Answer: Total households displayed prominently in the overview tab
  - Location: "Total Households" card in the Overview tab
  - Feature: Clicking the card switches map visualization to households mode

- **How many enumeration areas does this dzongkhag have?**
  - Answer: Total enumeration areas count shown in the overview
  - Location: "Total Enumeration Areas" card in the Overview tab
  - Feature: Clicking switches map to EA visualization mode

- **What is the average number of households per enumeration area in this dzongkhag?**
  - Answer: Automatically calculated and displayed in the EA card
  - Location: Enumeration Areas card, below the total count
  - Use Case: Helps understand EA size consistency across the dzongkhag

#### 2. **Administrative Structure Questions**
- **How many Gewogs (rural administrative zones) are in this dzongkhag?**
  - Answer: Total Gewogs count shown in Administrative Zones summary
  - Location: Overview tab, Administrative Zones card

- **How many Thromdes (urban administrative zones) are in this dzongkhag?**
  - Answer: Total Thromdes count displayed in the summary
  - Location: Overview tab, Administrative Zones card

- **What are all the Gewogs and Thromdes in this dzongkhag?**
  - Answer: Complete list with individual statistics for each administrative zone
  - Location: "Gewogs/Thromdes" tab
  - Feature: Each zone is clickable to view detailed information

#### 3. **Within-District Distribution Questions**
- **Which administrative zones (Gewogs/Thromdes) have the most households?**
  - Answer: Map visualization with color-coding shows relative household density
  - Location: Interactive map with hover tooltips
  - Action: Switch to "Households" visualization mode and observe color intensity

- **Which administrative zones have the most enumeration areas?**
  - Answer: Color-coded map visualization when EA mode is selected
  - Location: Main map interface
  - Feature: Legend shows the range of values across all zones

- **Are households evenly distributed across Gewogs and Thromdes?**
  - Answer: Users can compare values using the list view and map visualization
  - Location: Gewogs/Thromdes tab and map comparison
  - Insight: Color gradients reveal concentration patterns

#### 4. **Detailed Zone Information Questions**
- **What are the statistics for a specific Gewog or Thromde?**
  - Answer: Detailed popup appears when hovering/clicking on map zones, or view in list
  - Location: Map popups and Gewogs/Thromdes tab
  - Details Include:
    - Zone name and type (Gewog/Thromde)
    - Total households
    - Total enumeration areas
    - Area code

- **Can I view detailed information for a specific administrative zone?**
  - Answer: Yes, clicking "View Details" in popup or list item navigates to zone-level viewer
  - Location: Popup buttons and list items
  - Navigation: Links to Administrative Zone Data Viewer

#### 5. **Data Export Questions**
- **Can I download this dzongkhag's administrative zone boundaries?**
  - Answer: Yes, download as GeoJSON or KML formats
  - Location: Download button in map controls
  - Use Case: Users can import boundaries into GIS software for their own analysis

- **What data formats are available?**
  - Answer: GeoJSON (for GIS applications) and KML (for Google Earth)
  - Location: Download popover menu

---

## Cross-Dashboard Questions

### Navigation and Exploration

- **How do I navigate from national view to a specific dzongkhag?**
  - Answer: Click on any dzongkhag in the map popup or list to drill down
  - Navigation Flow: National → Dzongkhag → Administrative Zone

- **How do I go back to the national view?**
  - Answer: "Return to National View" button (dzongkhag viewer) or direct navigation
  - Location: Error state or can navigate via browser back button

### Data Quality and Availability

- **Are there dzongkhags without data?**
  - Answer: Map visualization uses gray styling for dzongkhags without data
  - Location: Map displays (national viewer)
  - Popup Message: "No data available for this dzongkhag" when applicable

- **How current is this data?**
  - Answer: Data reflects current statistics from the system (no explicit timestamp shown, but represents latest available)
  - Note: Users can verify data currency through the system interface

### Map Interaction and Visualization

- **How do I change what the map colors represent?**
  - Answer: Switch between "Households" and "Enumeration Areas" visualization modes
  - Location: Visualization mode selector cards in the sidebar
  - Impact: Map colors update immediately to reflect selected metric

- **Can I change the map background?**
  - Answer: Yes, multiple basemap options available (Positron, OpenStreetMap, Satellite, etc.)
  - Location: Map controls panel (top right on desktop)
  - Options: Various cartographic and satellite basemaps

- **What do the colors in the legend mean?**
  - Answer: Gradient legend shows value ranges - darker colors = higher values
  - Location: Legend panel in map controls
  - Feature: Interactive tooltips on map features show exact values

---

## User Journey Examples

### Example 1: Policy Researcher
**Goal**: Understand household distribution patterns for resource allocation research

**Questions Answered**:
1. What is the total household count nationally? → National Viewer
2. Which dzongkhags have the highest household concentrations? → National Viewer (map visualization)
3. Within a high-concentration dzongkhag, how are households distributed across Gewogs? → Dzongkhag Viewer
4. Can I export this data for further analysis? → Download features in both dashboards

### Example 2: Local Government Official
**Goal**: Verify administrative zone statistics for planning purposes

**Questions Answered**:
1. What are the total households and EAs in my dzongkhag? → Dzongkhag Viewer Overview
2. How many Gewogs and Thromdes are in my dzongkhag? → Dzongkhag Viewer Overview
3. Which Gewogs have the most households? → Dzongkhag Viewer (Gewogs/Thromdes tab and map)
4. What are the exact statistics for a specific Gewog? → Click through to Administrative Zone Viewer

### Example 3: General Public Citizen
**Goal**: Understand the sampling frame structure and scale

**Questions Answered**:
1. What is a sampling frame? → Info box explanation in National Viewer
2. How many households and enumeration areas exist nationally? → National Viewer key statistics
3. How does my dzongkhag compare to others? → National Viewer list view
4. What is the structure of my dzongkhag? → Dzongkhag Viewer Overview and Gewogs/Thromdes tab

### Example 4: GIS Analyst
**Goal**: Obtain spatial data for mapping and analysis projects

**Questions Answered**:
1. Can I download dzongkhag boundaries? → National Viewer download feature
2. Can I download administrative zone boundaries for a specific dzongkhag? → Dzongkhag Viewer download feature
3. What file formats are available? → GeoJSON and KML options
4. What attribute data is included? → Boundaries with associated statistics (households, EAs)

---

## Key Metrics and Calculations

### National Level
- **Total Households**: Sum of all households across all dzongkhags
- **Total Enumeration Areas**: Sum of all EAs across all dzongkhags
- **Total Dzongkhags**: Count of dzongkhags with available data
- **Average Households per EA**: Total Households / Total Enumeration Areas

### Dzongkhag Level
- **Total Households**: Sum of households across all administrative zones in the dzongkhag
- **Total Enumeration Areas**: Sum of EAs across all administrative zones
- **Total Gewogs**: Count of rural administrative zones
- **Total Thromdes**: Count of urban administrative zones
- **Average Households per EA**: Total Households / Total Enumeration Areas (dzongkhag-specific)

### Administrative Zone Level (visible in list view)
- **Households per Zone**: Total households within the specific Gewog/Thromde
- **EAs per Zone**: Total enumeration areas within the specific Gewog/Thromde

---

## Technical Capabilities

### Map Features
- **Interactive Mapping**: Click, hover, and zoom interactions
- **Color-Scaled Visualization**: Continuous gradient color scales based on selected metric
- **Multiple Basemaps**: Support for various cartographic styles
- **Boundary Labels**: Permanent labels showing administrative zone names
- **Popup Details**: Interactive popups with statistics and navigation options

### Data Export
- **Formats**: GeoJSON (JSON format for GIS), KML (XML format for Google Earth)
- **Content**: Spatial boundaries with associated statistical attributes
- **Scope**: National-level (all dzongkhags) or Dzongkhag-level (all administrative zones)

### Responsive Design
- **Desktop View**: Full sidebar and map layout
- **Mobile View**: Collapsible drawer interface, optimized controls
- **Touch Interactions**: Mobile-friendly map interactions and navigation

---

## Summary

These dashboards collectively answer fundamental questions about Bhutan's sampling frame:

1. **Scale**: How many households and enumeration areas exist at national and district levels?
2. **Distribution**: Where are these households and EAs located geographically?
3. **Structure**: How is the sampling frame organized administratively?
4. **Comparison**: How do different regions compare in terms of scale and distribution?
5. **Access**: How can users obtain the underlying spatial and statistical data?

The dashboards provide transparency into the statistical infrastructure while serving practical needs for research, planning, and public information access.

