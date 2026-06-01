# Local Testing Guide - Resume Maker

## Quick Start: Test Locally Before Pushing to GitHub

Follow these steps to verify everything works on your machine before committing.

---

## Step 1: Setup Backend

### Prerequisites
- Node.js (v14+)
- npm or yarn
- MongoDB running (if using local DB)

### Setup

```bash
# Navigate to Backend directory
cd Backend

# Install dependencies
npm install

# Check environment variables
cat .env
# Make sure DATABASE_URL, JWT_SECRET, OPENAI_API_KEY are set

# Start the backend server
npm start
# or npm run dev (if available)
```

### Expected Output
```
✓ Server running on http://localhost:5000
✓ MongoDB connected
✓ API ready at /api
```

### Verify Backend is Working
```bash
# In another terminal, test the health endpoint
curl http://localhost:5000/health

# Expected response:
# {"status":"ok","timestamp":"2026-06-01T...","uptime":...}
```

---

## Step 2: Setup Frontend

### In a new terminal

```bash
# Navigate to Frontend directory
cd Frontend

# Install dependencies
npm install

# Check environment variables (if needed)
cat .env

# Start the frontend development server
npm start
# or npm run dev
```

### Expected Output
```
✓ Frontend running on http://localhost:3000
✓ Hot reload enabled
✓ Connected to backend at http://localhost:5000/api
```

---

## Step 3: Test Key Features

### Test 1: Backend Error Handling

```bash
# Test 1A: Missing resume data (should return 400)
curl -X POST http://localhost:5000/api/resume \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{}'
# Expected: 400 error with errorCode

# Test 1B: Invalid authorization (should return 401)
curl http://localhost:5000/api/resume
# Expected: 401 Unauthorized

# Test 1C: Non-existent endpoint (should return 404)
curl http://localhost:5000/api/nonexistent
# Expected: 404 Not Found
```

### Test 2: Frontend API Client

1. Open browser console (F12)
2. Go to http://localhost:3000
3. Look for logs like:
   - `[API] Request: POST /resume`
   - `[API] Response: 200`
   - `[API] Retry attempt 1 of 3`

### Test 3: Resume Auto-Save

1. Open the Resume Builder
2. Edit a field (name, email, etc.)
3. Watch console for:
   - `[Resume] Debounced save triggered`
   - `[API] Request: POST /resume`
   - `[API] Response: 200 Resume saved successfully`
4. Refresh the page - your changes should persist

### Test 4: Error Handling UI

1. Stop the backend server
2. Try to save a resume
3. You should see:
   - Red error alert box
   - User-friendly error message
   - "Retry" button
4. Start backend again and click retry
5. Resume should save successfully

### Test 5: Loading States

1. Open AI Optimizer
2. Click "Optimize" button
3. You should see:
   - Loading spinner
   - Button disabled with "Optimizing..." text
   - Console: `[Resume] AI improvement started`

---

## Step 4: Check Console Logs

### Backend Console Should Show:

```
[INFO] Resume saved for user 123abc (duration: 245ms)
[INFO] Resume fetched for user 123abc
[METRIC] AI Resume Improvement: 1234ms
[ERROR] Improve resume error: message
```

### Frontend Console Should Show:

```
[API] Request: POST /resume
[API] Response: 200 Resume saved successfully
[Resume] Debounced save triggered
[Resume] State updated
```

---

## Step 5: Test Multi-Resume (if built)

1. Click "Add Resume" button
2. Create new resume with different title
3. Verify resume switcher shows both
4. Switch between resumes
5. Verify each saves independently

---

## Step 6: Test Export/PDF

1. Click "Export as PDF"
2. PDF should download successfully
3. Check console for:
   - `[API] Request: POST /resume/pdf`
   - `[API] Response: 200 PDF generated`

---

## Common Issues & Solutions

### Issue: "Cannot GET /api/resume"

**Cause:** Backend not running or wrong URL

**Fix:**
```bash
# Check if backend is running
lsof -i :5000
# If not running:
cd Backend && npm start
```

### Issue: "Network Error" in Frontend

**Cause:** Backend not accessible or different port

**Fix:**
1. Verify backend is running: `curl http://localhost:5000/health`
2. Check Frontend .env for correct API URL
3. Clear browser cache (Ctrl+Shift+Delete)
4. Restart frontend: `npm start`

### Issue: "Module not found" Error

**Cause:** Dependencies not installed

**Fix:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm start
```

### Issue: MongoDB Connection Error

**Cause:** MongoDB not running

**Fix:**
```bash
# Start MongoDB locally
# macOS:
brew services start mongodb-community

# Linux:
sudo systemctl start mongod

# Or use Docker:
docker run -d -p 27017:27017 --name mongo mongo:latest
```

### Issue: Port 3000 or 5000 Already in Use

**Fix:**
```bash
# Find process using port
lsof -i :3000  # or :5000

# Kill the process
kill -9 <PID>

# Or use different port
PORT=3001 npm start  # Frontend
```

---

## Step 7: Verify All Files Are Present

```bash
# Check Backend files
ls -la Backend/src/middleware/
ls -la Backend/src/utils/logger.js
ls -la Backend/src/services/resume.service.js

# Check Frontend files
ls -la Frontend/src/utils/apiClient.js
ls -la Frontend/src/features/resume/context/resume.context.jsx
ls -la Frontend/src/features/resume/hooks/useAPIError.js
ls -la Frontend/src/features/resume/components/FormInput.jsx
```

---

## Step 8: Ready to Commit?

Once you've verified:
- ✓ Backend starts without errors
- ✓ Frontend starts without errors
- ✓ No console errors in browser
- ✓ Resume save/load works
- ✓ Error handling displays properly
- ✓ All test scenarios pass

You're ready to commit!

```bash
# From project root
git status
# Review changes

git add .
git commit -m "feat: Complete Phase 1-5 improvements - error handling, validation, API client, UI components, versioning"

git push origin v0/ai-resume-maker-a3777106
# or your branch name
```

---

## Debugging Tips

### Enable Extra Logging

In Frontend, edit `src/utils/apiClient.js` and set:
```javascript
const DEBUG = true; // Shows all API calls
```

In Backend, set:
```bash
export DEBUG=*
npm start
```

### Check Network Activity

1. Open DevTools (F12)
2. Go to "Network" tab
3. Make a request
4. Check:
   - Status code (200, 400, 401, etc.)
   - Response body (should have errorCode)
   - Headers (Content-Type, etc.)

### Inspect State

In Frontend, add to components:
```javascript
console.log("[v0] Resume state:", resume);
console.log("[v0] API error:", error);
console.log("[v0] Loading state:", loading);
```

Then remove when done debugging.

---

## Test Checklist

Use this checklist as you test:

```
Backend:
[ ] Backend starts without errors
[ ] Health check endpoint works
[ ] MongoDB connects successfully
[ ] Error handler middleware loaded
[ ] Validation middleware loaded

Frontend:
[ ] Frontend starts without errors
[ ] No console errors
[ ] API client initializes
[ ] Resume context loads

Features:
[ ] Resume saves successfully
[ ] Error messages display
[ ] Loading states work
[ ] Auto-save functions
[ ] Export/PDF works

Advanced:
[ ] Multi-resume switching works
[ ] Version history displays
[ ] Network errors handled gracefully
[ ] Retry logic works
[ ] Timeout handling works

Ready to Push:
[ ] All tests pass
[ ] No console errors
[ ] No network warnings
[ ] Changes reviewed
[ ] Ready to commit
```

---

## Next Steps After Testing

Once local testing is complete:

1. **Stage your changes:**
   ```bash
   git add Backend/src/middleware/
   git add Backend/src/utils/logger.js
   git add Backend/src/services/resume.service.js
   git add Frontend/src/utils/apiClient.js
   git add Frontend/src/features/resume/
   ```

2. **Review changes:**
   ```bash
   git diff --staged
   ```

3. **Commit with descriptive message:**
   ```bash
   git commit -m "feat: Implement error handling, validation, API client, UI components

   - Add global error handler middleware
   - Add input validation and XSS prevention
   - Create API client with interceptors and retry logic
   - Add error/loading/success UI components
   - Implement Resume Context with auto-save
   - Add multi-resume and versioning support"
   ```

4. **Push to GitHub:**
   ```bash
   git push origin v0/ai-resume-maker-a3777106
   ```

5. **Create Pull Request:**
   - Go to GitHub
   - Create PR from your branch to main
   - Add description of changes
   - Request review if needed

---

## Support

If you encounter issues:

1. Check the error message carefully
2. Look in this guide for the solution
3. Check console logs (both browser and terminal)
4. Try restarting both servers
5. Check all environment variables are set

Good luck with your testing! 🚀
