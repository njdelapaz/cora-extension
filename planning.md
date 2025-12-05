


For grabbing from the HoosList API:

Base URL: https://hooslist.virginia.edu

| Endpoint | Method | Description |
| :--- | :---- | :--- |
| /Search/ | ... | For filtering courses |
| /Search/ | _SubjectSearch | Left blank, returns key/table JSON of acronym and subject name (e.g. CS, Computer Science) <br> **?s=** defines the searched acronym (returns all that contain it in the key) |
| /ClassSchedule/ | _GetLatestClassEnrollments | Returns enrollment history data for a specific class <br> **?termCode=xxxx** (4 digits, e.g. 1258 for Spring 2025) <br> **?classNumber=xxxxx** (5 digits, unique class identifier) <br> Returns JSON array with: `enrolled`, `waitlist`, `t` (timestamp) |
|  |  |  |





## COMPLETED: Enrollment Graph Feature (v1.0.9)

Implemented enrollment history graph as a new tab in the CoRA popup:
- Created `HooslistService` with retry logic and exponential backoff
- Added "Enrollment" tab to CoRA panel with tab switching functionality
- Extract `termCode` from URL parameters and `classNumber` from class card
- Fetch enrollment data from HoosList API: `/ClassSchedule/_GetLatestClassEnrollments`
- Display interactive SVG graph showing enrolled and waitlist trends over time
- Hover tooltips show exact enrollment numbers and timestamps for each data point
- Graph includes legend, grid lines, axis labels, and date range display 