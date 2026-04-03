# Test Script: Verify Question Counts API

## Backend API Test (Already Verified ✅)
```bash
curl -H "Authorization: Bearer <token>" http://localhost:5200/api/questions/stats/counts
# Returns: {"success":true,"counts":{"dsa":15,"javascript":15,"python":15,"react":15}}
```

## Frontend Implementation Summary

### 1. Backend Route (`/backend/src/routes/question.routes.js`)
```javascript
router.get("/stats/counts", getQuestionCounts);
```

### 2. Backend Controller (`/backend/src/controllers/question.controller.js`)
```javascript
export const getQuestionCounts = async (req, res, next) => {
  const counts = await Question.aggregate([
    { $group: { _id: "$topic", count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);

  const result = {};
  counts.forEach(item => result[item._id] = item.count);

  res.json({ success: true, counts: result });
};
```

### 3. Frontend API Service (`/frontend/src/api/services.js`)
```javascript
export const quizAPI = {
  getQuestionCounts: () => client.get("/questions/stats/counts"),
  // ... other methods
};
```

### 4. Frontend Component (`/frontend/src/components/pages/DashboardPage.jsx`)
```javascript
const [questionCounts, setQuestionCounts] = useState({});
const [countsLoading, setCountsLoading] = useState(true);

useEffect(() => {
  const fetchData = async () => {
    try {
      const resCounts = await quizAPI.getQuestionCounts();
      setQuestionCounts(resCounts.counts);
    } catch (error) {
      console.error('Failed to fetch question counts:', error);
      setQuestionCounts({});
    } finally {
      setCountsLoading(false);
    }
  };
  fetchData();
}, []);

// In render:
<span className="text-dim text-sm">
  {countsLoading ? "Loading..." : `${questionCounts[t.id] || 0} questions`}
</span>
```

## Expected Behavior

1. **User visits dashboard** → Shows "Loading..." for question counts
2. **API call succeeds** → Shows "15 questions" for each topic
3. **API call fails** → Shows "0 questions" (fallback)
4. **User not authenticated** → Redirected to login page

## Troubleshooting

### Issue: Shows "0 questions"
- **Check**: Is user logged in? (Should be redirected to /login if not)
- **Check**: Open browser console (F12) for error messages
- **Check**: Is backend running on port 5200?
- **Check**: Does database have questions? (Run `npm run seed`)

### Issue: Shows "Loading..." forever
- **Check**: Browser network tab for failed API requests
- **Check**: CORS headers (backend should allow frontend origin)
- **Check**: JWT token validity

### Issue: API returns 401 Unauthorized
- **Check**: User is logged in with valid token
- **Check**: Token not expired (login again if needed)

## Manual Test Steps

1. **Start Backend**: `cd backend && npm run dev` (runs on :5200)
2. **Start Frontend**: `cd frontend && npm run dev` (runs on :5174)
3. **Seed Database**: `npm run seed` (adds 60 questions)
4. **Login**: Go to http://localhost:5174/login
5. **Check Dashboard**: http://localhost:5174/dashboard
6. **Verify**: Should show "15 questions" for each topic

## API Response Format
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

The implementation is complete and should work correctly! 🎯