# How to Fix Quiz Not Found Error

## Problem
The quiz with ID `3918a3b8-a14d-483d-b206-43ddf85c8eda` is not being found in the database.

## Solution

### Step 1: Run the Diagnostic SQL
1. Go to your **Supabase Dashboard** → **SQL Editor**
2. Open the file: `COMPLETE_QUIZ_FIX.sql`
3. Copy and paste the entire content into the SQL Editor
4. Click **Run**

### Step 2: Check the Results

**If STEP 1 returns a row:**
- ✅ The quiz exists in the database
- The RLS policies have been fixed
- Try accessing the quiz again in your browser
- It should work now!

**If STEP 1 returns NO rows:**
- ❌ The quiz doesn't exist in the database yet
- You need to create it through your **Coach Interface**

### Step 3: If Quiz Doesn't Exist - Create It

**Option A: Through Coach Interface (Recommended)**
1. Log in as a coach/admin
2. Go to your course builder
3. Add a quiz to the lesson that should contain this quiz
4. Make sure to **publish** the quiz
5. The quiz will be created with a NEW ID
6. Update the content item to reference the new quiz ID

**Option B: Manually via SQL**
1. In `COMPLETE_QUIZ_FIX.sql`, find the commented INSERT statement in STEP 4
2. Uncomment it (remove the `/*` and `*/`)
3. Update the title, description, and lesson_id
4. Run the modified SQL in Supabase

### Step 4: Verify the Fix

After running the SQL:
1. Refresh your browser
2. Try accessing the quiz again
3. Check the browser console - you should see:
   ```
   QuizSession: Successfully fetched quiz: [Quiz Title] [quiz-id]
   ```

## What the Fix Does

1. **Diagnoses** if the quiz exists
2. **Finds** where the quiz is referenced (lesson_content_items or module_content_items)
3. **Removes** all conflicting RLS policies
4. **Creates** clean, simple policies that allow authenticated users to view quizzes
5. **Ensures** the quiz has a proper lesson_id set

## Common Issues

### "Quiz still not found after running SQL"
- The quiz genuinely doesn't exist in the database
- Create it through the coach interface

### "Permission denied" error when running SQL
- Make sure you're running it in the Supabase SQL Editor (not in your app)
- You need to be logged in as a Supabase admin

### "Multiple policies conflict"
- The SQL script removes all old policies before creating new ones
- This is handled automatically

## Next Steps

Once the quiz is accessible:
1. Test taking the quiz as a student
2. Verify questions appear correctly
3. Check that submissions work
4. Ensure scores are calculated properly
