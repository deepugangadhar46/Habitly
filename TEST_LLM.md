# 🧪 Testing LLM Integration

## How to Test the LLM Feature

### Step 1: Start the App
```bash
npm run dev
```
Open: http://localhost:5173

### Step 2: Create a Habit (Test 1)
1. Click **"Add Habit"** button
2. Fill in:
   - **Name**: "Morning Meditation"
   - **Category**: "Mindfulness"
   - **Emoji**: 🧘 (or any emoji)
3. Click **"Create Habit"**

**Expected Result**: 
- Success toast appears with personalized message like:
  - "Start small, stay consistent. Even 5 minutes daily transforms your peace."
  - OR similar warm, encouraging message

### Step 3: Create Another Habit (Test 2)
1. Click **"Add Habit"** again
2. Fill in:
   - **Name**: "Gym Workout"
   - **Category**: "Fitness"
   - **Emoji**: 💪
3. Click **"Create Habit"**

**Expected Result**:
- Different personalized message appears like:
  - "Push yourself daily—your future self will thank you for the strength you're building."
  - Message should be different from Test 1

### Step 4: Create Template Habit (Test 3)
1. Click **"Add Habit"**
2. Click **"From Templates"** tab
3. Select any template habit (e.g., "Running")
4. Click **"Add"**

**Expected Result**:
- Personalized message appears for the template habit

---

## ✅ What Success Looks Like

| Test | Input | Expected Output |
|------|-------|-----------------|
| Test 1 | "Morning Meditation" + "Mindfulness" | Personalized message about meditation |
| Test 2 | "Gym Workout" + "Fitness" | Different personalized message about fitness |
| Test 3 | Template habit | Personalized message for template |

---

## 🔍 How to Check Console Logs

1. Open browser DevTools: **F12**
2. Go to **Console** tab
3. Create a habit
4. Look for:
   - ✅ No red errors
   - ✅ Message appears in toast
   - ✅ Habit saved to database

### Expected Console Output (if no errors):
```
✅ Habit created successfully
✅ Motivation message generated
✅ Toast notification shown
```

### If There Are Errors:
```
❌ Error generating motivation: [error message]
→ App still works with fallback message
```

---

## 🧪 Test Cases

### Test Case 1: Custom Habit with Category
- **Input**: Name="Reading", Category="Learning"
- **Expected**: Personalized message about learning/reading
- **Status**: ✅ PASS / ❌ FAIL

### Test Case 2: Different Categories
- **Input**: Create 3 habits with different categories
- **Expected**: Each gets different personalized message
- **Status**: ✅ PASS / ❌ FAIL

### Test Case 3: Template Habit
- **Input**: Select template habit
- **Expected**: Personalized message for template
- **Status**: ✅ PASS / ❌ FAIL

### Test Case 4: Error Handling
- **Input**: Disconnect internet, create habit
- **Expected**: Fallback message shown, app still works
- **Status**: ✅ PASS / ❌ FAIL

---

## 🐛 Troubleshooting

### Issue: No message appears
**Solution**:
1. Check .env has API key: `VITE_GROQ_API_KEY=gsk_...`
2. Restart dev server: `npm run dev`
3. Check console (F12) for errors
4. Check Groq API status

### Issue: Error in console
**Solution**:
1. Check API key is valid
2. Check internet connection
3. Check Groq API quota
4. Restart dev server

### Issue: Message takes too long
**Solution**:
1. Normal - Groq API can take 1-2 seconds
2. If > 5 seconds, check internet connection
3. Check Groq API status

---

## 📊 Success Criteria

✅ **All tests pass when:**
1. App loads without errors
2. Habit creation works
3. Personalized messages appear
4. Messages are different for different habits
5. No console errors
6. Fallback works if API unavailable

---

## 🎯 Quick Test Script

Run these commands in sequence:

```bash
# 1. Start app
npm run dev

# 2. In browser:
# - Open http://localhost:5173
# - Click "Add Habit"
# - Create "Morning Run" in "Fitness"
# - See personalized message
# - Create "Learn Python" in "Learning"
# - See different personalized message

# 3. Check console (F12)
# - Should see no errors
# - Should see habit created
```

---

## 📝 Test Results Template

```
Date: ___________
Tester: ___________

Test 1 (Custom Habit - Mindfulness):
  Message Received: ___________
  Status: ✅ PASS / ❌ FAIL

Test 2 (Custom Habit - Fitness):
  Message Received: ___________
  Status: ✅ PASS / ❌ FAIL

Test 3 (Template Habit):
  Message Received: ___________
  Status: ✅ PASS / ❌ FAIL

Test 4 (Error Handling):
  Fallback Message: ___________
  Status: ✅ PASS / ❌ FAIL

Overall Status: ✅ ALL PASS / ❌ SOME FAILED
```

---

**Ready to test!** 🚀
