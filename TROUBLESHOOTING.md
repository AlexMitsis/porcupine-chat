# 🔧 Troubleshooting Guide

## ❌ **"Malformed UTF-8 data" Error**

**Cause:** Old messages in database with incompatible encryption format

**Solution:** Clear the messages table in Supabase:

### Option 1: Quick Fix (Recommended)
1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor** 
3. Run this command:
```sql
DELETE FROM messages;
```

### Option 2: Complete Reset
Run the contents of `clear-messages.sql` in Supabase SQL Editor

---

## 🔐 **Messages Show "[Wrong key - cannot decrypt]"**

**Cause:** Using wrong encryption key or messages were encrypted with different key

**Solutions:**
1. **Set correct key** using the "🔑 Set Key" button
2. **Use the same key** that was used to encrypt the messages
3. **Clear old messages** if you don't remember the key

---

## 🚫 **Cannot Send Messages**

**Possible Causes & Solutions:**

### Database Permissions
Run this in Supabase SQL Editor:
```sql
-- Fix RLS policies
DROP POLICY IF EXISTS "Users can insert messages" ON messages;
CREATE POLICY "Authenticated users can insert messages" ON messages
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
```

### Missing Encryption Key
- Click "🔑 Set Key" button first
- Enter a secure password/phrase
- Try sending again

### Authentication Issues
- Sign out and sign in again
- Check Google OAuth is enabled in Supabase

---

## 📱 **App Won't Load**

### Check Supabase Configuration
1. Verify `.env.local` has correct:
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`

2. Restart the development server:
```bash
# Stop current server (Ctrl+C)
npm start
```

### Database Setup
Make sure the `messages` table exists:
```sql
CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    text TEXT NOT NULL,
    name TEXT NOT NULL,
    uid TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🎯 **Quick Reset (Start Fresh)**

If everything is broken, run these in order:

1. **Clear messages:** `DELETE FROM messages;`
2. **Restart app:** Stop server, run `npm start`  
3. **Sign in** with Google
4. **Set new encryption key**
5. **Send test message**

---

## ✅ **App Working Correctly When:**
- ✅ No console errors
- ✅ Can sign in with Google  
- ✅ Can set encryption key
- ✅ Messages send and appear in real-time
- ✅ Messages decrypt properly with correct key

---

## 🆘 **Still Having Issues?**

1. **Check browser console** for specific error messages
2. **Clear browser cache** and refresh
3. **Verify all SQL scripts** have been run in Supabase
4. **Check network tab** for failed requests
5. **Try incognito/private browsing mode**

The app should work perfectly once old incompatible messages are cleared! 🎉