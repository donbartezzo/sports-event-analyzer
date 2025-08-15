# Events List View Implementation Plan (multi-sport)

## 1. Overview
The "Events List" view allows users to browse upcoming sports events across multiple team sports (football/soccer, basketball, volleyball, baseball, ice hockey). The view focuses on presenting a list of events, without going into details of individual events or authentication mechanisms, which are handled in separate views.

## 2. View Routing
The view should be available at: `/events/list`.

## 3. Component Structure
- **EventsList** – main component displaying a list of upcoming events (max 100 items, sorted chronologically).
  - **EventCard** – single list item representing an event with basic information such as discipline, team names, country, league/competition, and start time.

## 4. Component Details
### EventsList
- **Description:** Displays a list of upcoming sports events.
- **Elements:** Header, list of `EventCard` components.
- **Interactions:** Clicking on a list item may redirect user to the detailed view (handled at routing level, but the list view focuses on presentation).
- **Validation:** Checking data validity, such as presence of discipline, team names, country, league/competition, and start date.
- **Types:** `EventDTO` with fields: id, discipline, teamA, teamB, country, league, startTime.
- **Props:** List of `EventDTO` objects fetched from API or passed by parent.

- **EventCard**
- **Description:** Represents a single event in the list.
- **Elements:** Display of discipline, team names, country, league/competition, and start time.
- **Interactions:** OnClick – redirect to event details (`/event/card/:id`) (handled by another view).
- **Validation:** Verification of all required data presence before rendering.
- **Types:** Fragment of `EventDTO`.
- **Props:** Event object and click handler callback.

## 5. Types
- **EventDTO:**
  - id: string
  - discipline: 'football' | 'basketball' | 'volleyball' | 'baseball' | 'hockey'
  - teamA: string
  - teamB: string
  - country: string
  - league: string
  - startTime: Date | string

## 6. State Management
The view will be managed using React hooks, including:
- `useState` for storing the events list.
- Potentially `useEffect` for initial API data fetching.

## 7. API Integration
- Fetching events list: Integration with API endpoint responsible for providing upcoming events data (filtered by discipline when applicable).
- Verification of data received from API (200 status code for success, error messages for failures).

## 8. User Interactions
- User sees a list of upcoming events. Clicking on a list item redirects to the detailed view (`/event/card/:id`) (handled by another view).
- In case of data fetching errors, user sees an error message.

## 9. Conditions and Validation
- Input data validation for events: validity of fields such as discipline, team names, country, league/competition, and start date.
- Verification that the events list does not exceed 100 items.

## 10. Error Handling
- Display of readable messages in case of API connection errors or incomplete data.
- Error logging for diagnostic purposes.

## 11. Implementation Steps
1. Creation of new page/routing for events list view (`/events/list`).
2. Implementation of `EventsList` component, fetching data from API and rendering list of `EventCard` components.
3. Implementation of `EventCard` component displaying basic match information.
4. Integration with API for fetching match data, including response validation.
5. View testing and error handling, including error messages displayed to user.
6. Code optimization and review according to project guidelines.
