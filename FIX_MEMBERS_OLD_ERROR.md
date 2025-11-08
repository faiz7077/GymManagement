# Fix for "members_old" Table Error

## Problem
You're getting this error when creating receipts:
```
SqliteError: no such table: main.members_old
```

This happened because the database migration for adding the "pending" subscription status didn't complete properly.

## Solution

### Option 1: Restart the Application (Recommended)
The migration code has been updated with automatic cleanup. Simply:

1. **Close the application completely**
2. **Restart the application**
3. The migration will automatically detect and clean up the `members_old` table

### Option 2: Manual Cleanup Script
If restarting doesn't work, run the cleanup script:

```bash
node cleanup-database.js
```

This will:
- Check for the `members_old` table
- Remove it if found
- Show you all current tables in the database

### Option 3: Manual Database Cleanup
If you prefer to do it manually:

1. Find your database file at:
   ```
   ~/Library/Application Support/gym-cms-test/database/faizanNewGym.db
   ```

2. Open it with a SQLite tool (like DB Browser for SQLite)

3. Run this SQL command:
   ```sql
   DROP TABLE IF EXISTS members_old;
   ```

4. Save and close

5. Restart your application

## What Was Fixed

The migration code now:
1. ✅ Checks for leftover `members_old` table before starting
2. ✅ Cleans up automatically if found
3. ✅ Verifies cleanup after migration completes
4. ✅ Handles errors gracefully with automatic cleanup

## Verification

After applying the fix, you should be able to:
- Create receipts without errors
- Add new members
- Update existing members
- See the "pending" subscription status for partial members

## Need Help?

If you still see the error after trying these solutions:
1. Check the console logs for migration messages
2. Verify the database path is correct
3. Make sure you have write permissions to the database directory
