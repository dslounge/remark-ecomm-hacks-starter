---
name: Fuzzy product search
overview: Add fuzzy search over product names and colors across backend API and frontend UI.
todos:
  - id: backend-fuzzy
    content: Add Fuse.js and implement fuzzy search in ProductService
    status: completed
  - id: frontend-search
    content: Wire existing search input to API search filter
    status: completed
  - id: validate
    content: Verify search API/UI returns expected paginated results
    status: completed
---

# Fuzzy Product Search

1) Backend fuzzy search logic

- Add Fuse.js dependency to `packages/backend` and use it in `ProductService.getProducts` to run fuzzy matching on product `name` and `colors` when `search` is provided.
- Apply existing filters (category/price/subcategory) via SQL, then run Fuse on the filtered set, order by score, and paginate the top results (default 20) while keeping non-search paths unchanged.

2) Frontend search wiring (input already exists)

- Reuse the existing search input; ensure its value is sent as the `search` filter to the products API (covering names and colors in fuzzy match), with a hint that name/color is supported if needed.
- Keep the search term synced in the URL query params so it persists across navigation and drives `useProducts`.

3) Validation

- Spot-check API response structure (data + pagination) for search and no-search cases, confirming top results are limited to requested page/pageSize.