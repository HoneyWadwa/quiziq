# Dynamic Questions Migration Guide

## Overview
This document summarizes the changes made to remove hardcoded question counts and make the quiz application fully dynamic based on actual backend data.

## Changes Made

### Backend Changes

#### 1. **Question Controller** (`backend/src/controllers/question.controller.js`)
- **Added**: New function `getQuestionCounts()`
- **Purpose**: Returns the actual number of questions per topic from the database
- **Response Format**:
  ```json
  {
    "success": true,
    "counts": {
      "javascript": 15,
      "react": 15,
      "python": 15,
      "dsa": 15
    }
  }
  ```

#### 2. **Question Routes** (`backend/src/routes/question.routes.js`)
- **Added**: New GET endpoint `/api/questions/stats/counts`
- **Placement**: Added before `/:id` route to avoid conflict with dynamic routing
- **Authentication**: Protected (requires auth middleware)

### Frontend Changes

#### 1. **API Services** (`frontend/src/api/services.js`)
- **Added**: New API method `quizAPI.getQuestionCounts()`
- **Purpose**: Fetches question counts from backend

#### 2. **Quiz Page** (`frontend/src/components/pages/QuizPage.jsx`)
- **Removed**: Import of `TOTAL_QUESTIONS` constant
- **Added**: State variable `totalQuestions` to store actual count per topic
- **Added**: `useEffect` hook to fetch question counts on component mount
- **Updated**: All references to `TOTAL_QUESTIONS`:
  - Progress calculation: `((qIndex + 1) / totalQuestions) * 100`
  - Question counter: `{qIndex + 1}/{totalQuestions}`
  - Quiz completion check: `nextIndex >= totalQuestions`
  - Submit button text: Uses `totalQuestions` to determine if quiz is complete
- **Fallback**: If fetch fails, defaults to 10 questions
- **Waits**: Fetches question counts before starting the quiz

#### 3. **Topic Page** (`frontend/src/components/pages/TopicPage.jsx`)
- **Added**: Import of `quizAPI`
- **Added**: State variable `questionCounts` to store counts for all topics
- **Added**: State variable `loadingCounts` for loading state
- **Added**: `useEffect` hook to fetch counts on mount
- **Updated**: Topic cards to show actual question count
- **Fallback**: Shows "Loading..." while fetching, defaults to 0 if fetch fails

#### 4. **Dashboard Page** (`frontend/src/components/pages/DashboardPage.jsx`)
- **Added**: Import of `quizAPI`
- **Added**: State variable `questionCounts`
- **Updated**: Analytics fetch to also include question counts
- **Optimized**: Uses `Promise.all()` to fetch analytics and counts in parallel
- **Updated**: Topic cards to display actual question count

#### 5. **Constants** (`frontend/src/data/constants.js`)
- **Removed**: `TOTAL_QUESTIONS = 10` constant
- **Reason**: Now fetched dynamically from backend

## How It Works

### Flow Diagram
```
User opens quiz app
    ↓
Frontend fetches question counts from backend
    ↓
Counts stored in state (questionCounts)
    ↓
Components display actual counts
    ↓
When starting a quiz:
  - Fetch total questions for selected topic
  - Store in totalQuestions state
  - Use for progress tracking and quiz completion
    ↓
Results show dynamically calculated total
```

### Data Flow

**1. Topic Selection (TopicPage)**
```
useEffect on mount
  ↓
Call GET /api/questions/stats/counts
  ↓
Display count for each topic: "{count} questions"
```

**2. Quiz Start (QuizPage)**
```
useEffect with totalQuestions dependency
  ↓
Call GET /api/questions/stats/counts
  ↓
Get count for selected topic
  ↓
Use for progress: (qIndex + 1) / totalQuestions
```

**3. Dashboard (DashboardPage)**
```
useEffect on mount
  ↓
Promise.all([
  userAPI.getAnalytics(),
  quizAPI.getQuestionCounts()
])
  ↓
Display counts in topic cards
```

## Benefits

✅ **No Hardcoded Values**
- Question counts automatically sync with database
- Adding/removing questions updates UI automatically

✅ **Scalable**
- Works with any number of questions per topic
- Easy to add new topics

✅ **Robust**
- Handles loading states gracefully
- Fallback values prevent UI breaking
- Error handling with console logging

✅ **Performant**
- Parallel API calls (Promise.all)
- Single fetch for entire app lifecycle
- Minimal re-renders

✅ **Beginner-Friendly**
- Clear state management with useState
- Straightforward effect hooks
- Well-commented code

## Testing Checklist

- [ ] **Backend**: Test `/api/questions/stats/counts` endpoint
  ```bash
  curl -H "Authorization: Bearer <token>" http://localhost:5200/api/questions/stats/counts
  ```

- [ ] **Topic Page**: Verify question counts display for all topics

- [ ] **Quiz Page**: 
  - Counts match topic selection
  - Progress bar fills correctly
  - Quiz completes after correct number of questions
  - Results show correct total

- [ ] **Dashboard**: Topic cards show correct counts

- [ ] **Error Handling**:
  - Check browser console when backend is down
  - Verify fallback values work
  - Network fail doesn't break UI

## Database Schema Notes

Current structure has:
- 15 questions per topic (javascript, react, python, dsa)
- 3 difficulty levels (easy, medium, hard)
- 5 questions per difficulty per topic

To add more questions to a topic:
```javascript
// In backend/src/data/seed.js, add questions with topic: "topic-id"
const QUESTIONS = [
  { topic: "javascript", difficulty: "easy", question: "...", ... },
  // ...
];
```

Then run: `npm run seed`

The UI will automatically show the updated count!

## Files Modified Summary

| File | Changes |
|------|---------|
| `backend/src/controllers/question.controller.js` | Added `getQuestionCounts()` function |
| `backend/src/routes/question.routes.js` | Added `/stats/counts` route |
| `frontend/src/api/services.js` | Added `getQuestionCounts()` API method |
| `frontend/src/components/pages/QuizPage.jsx` | Fetch & use dynamic `totalQuestions` |
| `frontend/src/components/pages/TopicPage.jsx` | Fetch & display `questionCounts` |
| `frontend/src/components/pages/DashboardPage.jsx` | Fetch & display `questionCounts` |
| `frontend/src/data/constants.js` | Removed `TOTAL_QUESTIONS` |

## Backwards Compatibility

✅ **Existing functionality preserved**:
- All quiz mechanics work the same
- Authentication unchanged
- User stats unchanged
- Progress tracking unchanged

⚠️ **Breaking Changes**: None
- Fallback values ensure app works even if new endpoint isn't called
- Graceful degradation if backend is slow

## Future Enhancements

Possible improvements:
- Cache question counts in localStorage
- Show question count in results
- Add difficulty-specific question counts
- Display "out of stock" when topic has 0 questions
