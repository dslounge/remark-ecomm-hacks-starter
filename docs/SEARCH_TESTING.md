# Search Functionality Testing Guide

## Overview

This document outlines the manual testing procedures for the product search
functionality, including search suggestions dropdown and expandable search
interface.

## Features to Test

### 1. Search Suggestions Dropdown

#### Test: Debounce Behavior

- **Steps:**
  1. Click on the search input in the header
  2. Type characters quickly (e.g., "tent")
  3. Observe network requests in browser DevTools
- **Expected Result:**
  - API calls should be debounced (300ms delay)
  - Only one request should be made after you stop typing
  - No request should be made for inputs with less than 2 characters

#### Test: Suggestion Display

- **Steps:**
  1. Focus the search input
  2. Type at least 2 characters (e.g., "ja")
  3. Wait for suggestions to appear
- **Expected Result:**
  - Up to 10 product suggestions should appear below the search bar
  - Each suggestion should show:
    - Product image
    - Product name
    - Product price
  - Loading state should display while fetching

#### Test: Keyboard Navigation

- **Steps:**
  1. Type in the search box to show suggestions
  2. Press Arrow Down key multiple times
  3. Press Arrow Up key
  4. Press Enter when a suggestion is highlighted
- **Expected Result:**
  - Arrow Down: Moves selection down through suggestions
  - Arrow Up: Moves selection up through suggestions
  - Enter: Navigates to selected product detail page
  - Selected item should have highlighted background

#### Test: Mouse Interaction

- **Steps:**
  1. Type in search to show suggestions
  2. Hover over different suggestions
  3. Click on a suggestion
- **Expected Result:**
  - Hovering changes background color
  - Clicking navigates to product detail page
  - Dropdown closes after selection

#### Test: Empty/Error States

- **Steps:**
  1. Type a search term that matches no products (e.g., "zzzzzz")
  2. Test with network disconnected (DevTools offline mode)
- **Expected Result:**
  - "No products found" message for no matches
  - Error logged to console for network failures
  - UI remains functional

### 2. Expandable Search Interface

#### Test: Search Expansion on Focus

- **Steps:**
  1. Click/focus on the search input
  2. Observe the header layout
- **Expected Result:**
  - Search bar expands to full width
  - Logo fades out (opacity-0)
  - Navigation menu fades out
  - Cart icon fades out
  - Dark overlay appears over the page content
  - Close (X) button appears inside search input

#### Test: Collapse on Close Button

- **Steps:**
  1. Focus the search input to expand it
  2. Click the X button inside the search input
- **Expected Result:**
  - Search collapses back to normal width
  - Logo, nav, and cart fade back in
  - Overlay disappears
  - Input loses focus

#### Test: Collapse on Overlay Click

- **Steps:**
  1. Focus the search input to expand it
  2. Click on the dark overlay outside the search bar
- **Expected Result:**
  - Search collapses
  - All header elements return to normal
  - Overlay disappears

#### Test: Escape Key Behavior

- **Steps:**
  1. Focus search input (expanded state)
  2. Type to show suggestions
  3. Press Escape once
  4. Press Escape again
- **Expected Result:**
  - First Escape: Closes suggestions dropdown only
  - Second Escape: Collapses the entire search interface
  - Input loses focus after second Escape

#### Test: Body Scroll Lock

- **Steps:**
  1. Scroll down the page
  2. Focus the search input to expand it
  3. Try to scroll the page
  4. Close the search
- **Expected Result:**
  - Page scroll should be locked when search is expanded
  - Page scroll should be restored when search collapses

#### Test: Search Submission

- **Steps:**
  1. Expand search by focusing
  2. Type a search term
  3. Press Enter (without selecting a suggestion)
- **Expected Result:**
  - Navigate to products page with search query
  - Search collapses
  - Results filtered by search term

#### Test: Responsive Behavior (All Breakpoints)

- **Steps:**
  1. Test on mobile viewport (< 640px)
  2. Test on tablet viewport (640px - 1024px)
  3. Test on desktop viewport (> 1024px)
  4. Focus search on each breakpoint
- **Expected Result:**
  - Search should expand to full width on all breakpoints
  - Overlay should cover entire viewport
  - Search bar should have appropriate base width for each breakpoint:
    - Mobile: w-32
    - Small: w-48
    - Medium: w-56
    - Large: w-64

### 3. Integration Tests

#### Test: Search from Products Page

- **Steps:**
  1. Navigate to /products
  2. Use header search to search for a product
  3. Submit the search
- **Expected Result:**
  - Stay on products page
  - URL updates with search query parameter
  - Products filtered by search term

#### Test: Search from Home Page

- **Steps:**
  1. Navigate to home page (/)
  2. Use header search
  3. Submit search
- **Expected Result:**
  - Navigate to /products with search query
  - Products filtered by search term

#### Test: Suggestion Selection Navigation

- **Steps:**
  1. Type in search
  2. Click/select a product suggestion
- **Expected Result:**
  - Navigate to /products/{productId}
  - Product detail page loads
  - Search collapses

## API Endpoint Testing

### GET /api/products/suggestions

**Request:**

```
GET /api/products/suggestions?q=tent&limit=10
```

**Expected Response:**

```json
{
  "data": [
    {
      "id": 1,
      "name": "Example Product",
      "priceInCents": 9999,
      "imageUrl": "..."
      // ... other product fields
    }
    // ... up to 10 products
  ]
}
```

**Test Cases:**

1. Query with 1 character → Returns empty array
2. Query with 2+ characters → Returns matching products
3. Query with no matches → Returns empty array
4. Invalid limit parameter → Returns validation error
5. Missing query parameter → Returns validation error

## Performance Testing

### Metrics to Monitor

- API response time: < 200ms for suggestions
- Debounce prevents excessive API calls
- Smooth animations (no jank) when expanding/collapsing
- No memory leaks (clean up event listeners and timers)

## Browser Compatibility

Test on:

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile Safari (iOS)
- Mobile Chrome (Android)

## Accessibility Testing

### Keyboard Navigation

- Tab to search input
- Enter to submit
- Arrow keys to navigate suggestions
- Escape to close

### Screen Reader

- Search input has proper aria-label
- Close button has aria-label
- Overlay has aria-hidden="true"

## Known Issues / Future Improvements

- Consider adding search history
- Consider adding category filters in dropdown
- Consider highlighting matched text in suggestions
- Consider adding keyboard shortcuts (e.g., Cmd+K to focus search)

