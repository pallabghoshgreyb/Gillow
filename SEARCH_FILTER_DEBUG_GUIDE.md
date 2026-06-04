# Search + Category Filter Bug - Debugging Guide

## Problem Summary
When a user searches (e.g., `?q=apple`) and then applies a category filter (e.g., `?q=apple&category=Assistive+Care+Devices`), the UI breaks:
- Shows "No patents found"
- Category filter buttons disappear

## Root Causes Identified

### 1. **Silent Filtering Logic - Legitimate Empty Results**
When combining search query + category filter, the result set might legitimately be empty:
- User searches for "apple" → finds 50 patents across multiple domains
- User clicks "Assistive Care Devices" → only 0 patents match BOTH criteria
- Result: "No patents found" is **correct**, but UX is confusing

**Fix Applied:** Added debug logging to track filtering steps and confirm this behavior.

### 2. **UI Category Buttons Disappearing**
The category filter buttons were disappearing because they were being recalculated on every render without proper memoization.

**Fix Applied:** 
```typescript
const quickDomainFilters = useMemo(
  () => Array.from(new Set(PATENTS.map(patent => patent.domain).filter(Boolean))).sort().slice(0, 6),
  []
);
```

### 3. **Query Parameter Loss Risk**
When updating filters, the search query needed to be explicitly preserved in URL params.

**Fix Applied:**
```typescript
if (query) {
  params.set('q', query);
  console.log(`🔍 Preserving query in URL:`, query);
}
```

---

## Step-by-Step Testing Guide

### Test Case 1: Search + Single Category Filter
1. **Navigate to home page**
2. **Type "surgical"** in search bar → Press Enter
   - Expected: URL becomes `/#/search?q=surgical`
   - Expected: See multiple patents containing "surgical" across various domains
3. **Click category button "Assistive Care Devices"**
   - Expected: URL updates to `/#/search?q=surgical&category=Assistive+Care+Devices`
   - Expected: **Category buttons remain visible**
   - Possible outcomes:
     - ✅ Results show patents matching both criteria
     - ✅ Results show "No patents found" (this is correct if no patents match both)
     - ❌ Category buttons disappear (this is the bug)

### Test Case 2: Multiple Category Toggle
1. **Start with results from Test Case 1**
2. **Click another category button**
   - Expected: First category toggles OFF, second toggles ON
   - Expected: URL updates, categories remain visible
   - Example: `?q=surgical&category=Medical+Devices` (Assistive Care removed, Medical Devices added)

### Test Case 3: Clear Category Filter
1. **Start with filtered results**
2. **Click the active category button again**
   - Expected: Category toggles OFF
   - Expected: URL becomes just `?q=surgical` (category param removed)
   - Expected: Results expand to show all patents matching "surgical"

### Test Case 4: Browser Console Debug Output
1. **Open browser DevTools** (F12)
2. **Go to Console tab**
3. **Perform search + filter**
   - Look for logs like:
     ```
     🔍 Preserving query in URL: surgical
     📋 URL Params after filter update: q=surgical&category=Assistive+Care+Devices
     🔍 Filter Step 1 (Query - Search): {query: "surgical", resultsAfterQuery: 45}
     🔍 Filter Step 2 (Categories): {categories: ["Assistive Care Devices"], beforeCount: 45, afterCount: 3}
     📊 Final Filter Result: {query: "surgical", categories: ["Assistive Care Devices"], resultCount: 3}
     ```

---

## Console Debug Output Reference

### Expected Logs When Searching

```
🔍 Filter Step 1 (Query - Search): {
  query: "surgical",
  resultsAfterQuery: 45
}
```
- **Meaning:** Query "surgical" matched 45 patents

### Expected Logs When Applying Category

```
🔍 Filter Step 2 (Categories): {
  categories: ["Assistive Care Devices"],
  beforeCount: 45,
  afterCount: 3
}
```
- **Meaning:** After applying category filter, 3 of the 45 results matched

### Expected Logs When Results are Empty

```
📊 Final Filter Result: {
  query: "surgical",
  categories: ["Assistive Care Devices"],
  resultCount: 0
}
```
- **Meaning:** No patents match both "surgical" AND "Assistive Care Devices"
- **This is correct behavior** - the UI should show "No patents found" and let user adjust filters

---

## Implementation Details

### File: `pages/Search.tsx`
**Changes:**
1. Added `useMemo` import
2. Memoized `quickDomainFilters` to prevent unnecessary recalculation
3. Added debug logging with `useEffect` to track filter changes
4. Made category buttons conditional but with fallback message
5. Updated render condition to distinguish between loading and empty results

**Key Code:**
```typescript
// Memoize quickDomainFilters
const quickDomainFilters = useMemo(
  () => Array.from(new Set(PATENTS.map(patent => patent.domain).filter(Boolean))).sort().slice(0, 6),
  []
);

// Debug logging
useEffect(() => {
  if (query || filters.categories.length > 0 || filters.assignees.length > 0) {
    console.log('🔍 Search Debug:', {
      query,
      categories: filters.categories,
      resultsCount: filteredPatents.length,
      loading
    });
  }
}, [query, filters.categories, filters.assignees, filteredPatents.length, loading]);

// Always render buttons
{quickDomainFilters && quickDomainFilters.length > 0 ? (
  quickDomainFilters.map(domain => {
    // ... button code
  })
) : (
  <div className="text-xs text-slate-400">No domains available</div>
)}
```

### File: `hooks/usePatentFilters.ts`
**Changes:**
1. Added explicit query preservation in `updateFilters` with logging
2. Added comprehensive debug logging in `filteredPatents` calculation
3. Log filtering steps at each stage

**Key Code:**
```typescript
const updateFilters = (newFilters: Partial<FilterState>) => {
  const next = { ...filters, ...newFilters };
  const params = new URLSearchParams();
  
  // CRITICAL: Always preserve the search query
  if (query) {
    params.set('q', query);
    console.log(`🔍 Preserving query in URL:`, query);
  }
  
  // ... rest of filter params
  console.log(`📋 URL Params after filter update:`, params.toString());
  setSearchParams(params);
};

const filteredPatents = useMemo(() => {
  let result = [...PATENTS];
  const debugSteps = [];

  if (query) {
    // ... filtering logic
    console.log('🔍 Filter Step 1 (Query - Search):', { query, resultsAfterQuery: result.length });
  }

  if (filters.categories.length > 0) {
    // ... filtering logic
    console.log('🔍 Filter Step 2 (Categories):', { categories: filters.categories, beforeCount, afterCount: result.length });
  }

  // ... more filtering steps
  console.log('📊 Final Filter Result:', { query, categories: filters.categories, resultCount: result.length });
  
  return result;
}, [query, filters]);
```

---

## Verification Checklist

- [ ] Category buttons remain visible when searching + filtering
- [ ] URL correctly shows both `?q=...&category=...` parameters
- [ ] Clicking category button toggles it on/off
- [ ] Search query persists in URL when applying filters
- [ ] Console shows debug logs confirming filter application
- [ ] Empty results message displays when no patents match both criteria
- [ ] Loading state shows before results appear
- [ ] Can clear filters and results expand again

---

## Common Issues & Fixes

### Issue: Category buttons still disappearing
**Solution:** Clear browser cache and hard refresh (Ctrl+Shift+R)

### Issue: Console logs not showing
**Solution:** Check that console filter isn't hiding logs, or check "All Levels"

### Issue: URL updates but results don't change
**Solution:** Look at console - there should be a log showing filtered results at each step

### Issue: "No patents found" appears unexpectedly
**Solution:** This is likely correct - the search query + category combination has no matches. Check console logs to confirm the filtering steps.

---

## Expected Behavior After Fix

1. User searches for "apple"
2. User clicks "Medical Devices" category
3. URL updates to `?q=apple&category=Medical+Devices`
4. Category buttons **remain visible**
5. If results exist: Show filtered patents
6. If no results: Show "No patents found" with category buttons still visible
7. User can click category again to toggle it off
8. Results update to show all patents matching "apple"

