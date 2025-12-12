Public Data Viewer Revamp Plan
Overview
Revamp the public-home component to follow the admin data viewer hierarchy structure. Create separate components for each level (National, Dzongkhag, Administrative Zone, Sub-Administrative Zone, Enumeration Area) with maps, statistics (Households and EAs), and download functionality.

Components to Create
1. public-national-data-viewer
Location: src/app/presentations/public/data-viewer/public-national-data-viewer/
Features:
National map showing all dzongkhags
Statistics: Total Households, Total EAs
Download: National GeoJSON, National KML
Click on dzongkhag to navigate to dzongkhag viewer
2. public-dzongkhag-data-viewer
Location: src/app/presentations/public/data-viewer/public-dzongkhag-data-viewer/
Route: /public/data-viewer/dzongkhag/:id
Features:
Dzongkhag map with administrative zones
Statistics: Households, EAs for the dzongkhag
Download: Dzongkhag GeoJSON, Dzongkhag KML
Click on administrative zone to navigate to AZ viewer
3. public-administrative-zone-data-viewer
Location: src/app/presentations/public/data-viewer/public-administrative-zone-data-viewer/
Route: /public/data-viewer/administrative-zone/:dzongkhagId/:id
Features:
Administrative zone map with sub-administrative zones
Statistics: Households, EAs for the administrative zone
Download: Administrative Zone GeoJSON, Administrative Zone KML
Click on SAZ to navigate to SAZ viewer
4. public-sub-administrative-zone-data-viewer
Location: src/app/presentations/public/data-viewer/public-sub-administrative-zone-data-viewer/
Route: /public/data-viewer/sub-administrative-zone/:administrativeZoneId/:id
Features:
Sub-administrative zone map with enumeration areas
Statistics: Households, EAs for the sub-administrative zone
Download: Sub-Administrative Zone GeoJSON, Sub-Administrative Zone KML
Click on EA to navigate to EA viewer
5. public-enumeration-area-data-viewer
Location: src/app/presentations/public/data-viewer/public-enumeration-area-data-viewer/
Route: /public/data-viewer/enumeration-area/:subAdministrativeZoneId/:id
Features:
Enumeration area map
Statistics: Households, EAs (single EA = 1)
Download: Enumeration Area GeoJSON, Enumeration Area KML
Statistics Structure
Each component will display:

Households: Number of households (from annual stats or EA data)
EAs: Number of enumeration areas
Routes Configuration
Update public.routes.ts
{
  path: 'data-viewer',
  children: [
    { path: 'national', component: PublicNationalDataViewerComponent },
    { path: 'dzongkhag/:id', component: PublicDzongkhagDataViewerComponent },
    { path: 'administrative-zone/:dzongkhagId/:id', component: PublicAdministrativeZoneDataViewerComponent },
    { path: 'sub-administrative-zone/:administrativeZoneId/:id', component: PublicSubAdministrativeZoneDataViewerComponent },
    { path: 'enumeration-area/:subAdministrativeZoneId/:id', component: PublicEnumerationAreaDataViewerComponent },
  ]
}

Map Section: Leaflet map with basemap selector, boundaries toggle
Statistics Panel: Households and EAs counts
Download Section: KML and GeoJSON download buttons
Navigation: Click on features to navigate to next level