# HAESL CAR Extractor - Remote Access Control Setup

## 🎯 **What This System Does:**

✅ **Complete Remote Control** - Enable/disable access instantly via GitHub  
✅ **User Management** - Add/remove users without touching their browsers  
✅ **Maintenance Mode** - Put system in maintenance without user interaction  
✅ **Automatic Updates** - Push script updates through GitHub  
✅ **Access Logging** - Track who's using the system and when  

---

## 🚀 **Setup Instructions:**

### **Step 1: Prepare Your GitHub Repository**

1. **Commit the files to your GitHub repository:**
   ```bash
   git add .
   git commit -m "Add remote access control system"
   git push origin main
   ```

2. **Make sure these files are in your repo:**
   - `access-control.json` - Controls who can access
   - `car-extractor-main.js` - The actual script functionality  
   - `tampermonkey-remote-controlled.js` - The distributed script

### **Step 2: Configure Access Control**

1. **Edit `access-control.json` to add your colleagues:**
   ```json
   {
     "version": "1.0",
     "enabled": true,
     "authorizedUsers": [
       {
         "id": "user001", 
         "name": "John Doe",
         "email": "john@company.com",
         "enabled": true,
         "expires": "2025-12-31T23:59:59Z"
       }
     ]
   }
   ```

2. **Or use the management tool:**
   ```bash
   ./manage-access.sh
   ```

### **Step 3: Distribute to Colleagues**

1. **Give them this URL to install in Tampermonkey:**
   ```
   https://raw.githubusercontent.com/JwoToLee/MorningMeeting/main/tampermonkey-remote-controlled.js
   ```

2. **Installation steps for colleagues:**
   - Open Tampermonkey Dashboard
   - Click "Create a new script"  
   - Delete all content
   - Paste the script from the GitHub URL above
   - Save and enable

3. **Get their User IDs:**
   - They run the script once
   - Open browser console (F12)
   - Look for: `👤 User Fingerprint: XXXXXXXX`
   - Add this ID to your `access-control.json`

---

## 🎛️ **Managing Access:**

### **Instantly Disable Someone:**
```bash
./manage-access.sh
# Choose option 7 to disable user
```

### **Global System Disable:**
```bash
./manage-access.sh  
# Choose option 3 to disable globally
```

### **Maintenance Mode:**
```bash
./manage-access.sh
# Choose option 4 for maintenance mode
```

### **Deploy Changes:**
```bash
./manage-access.sh
# Choose option 8 to push to GitHub
```

---

## 🔒 **Security Features:**

✅ **GitHub-Based Control** - All access managed through your GitHub repo  
✅ **User Fingerprinting** - Unique IDs prevent sharing  
✅ **Expiration Dates** - Automatic access expiry  
✅ **Real-time Checking** - Verifies access every 5 minutes  
✅ **Maintenance Mode** - Instant system-wide disable  

---

## 📊 **Management Commands:**

| Command | Purpose |
|---------|---------|
| `./manage-access.sh` | Interactive access management |
| `git push origin main` | Deploy changes to users |
| Edit `access-control.json` | Modify user permissions |
| Check GitHub commits | See when access was changed |

---

## 🚨 **Emergency Access Revocation:**

**To immediately cut off all access:**

1. **Quick Method:**
   ```bash
   # Edit access-control.json
   # Change "enabled": true to "enabled": false
   git add access-control.json
   git commit -m "Emergency disable"
   git push origin main
   ```

2. **Or use management tool:**
   ```bash
   ./manage-access.sh
   # Option 3: Disable system globally
   # Option 8: Deploy to GitHub
   ```

**Result:** All users lose access within 5 minutes (next periodic check)

---

## 🔧 **Troubleshooting:**

| Issue | Solution |
|-------|----------|
| User can't access | Check their ID in `access-control.json` |
| Script won't load | Verify GitHub URLs are correct |
| Changes not taking effect | Make sure you pushed to GitHub |
| User ID unknown | Have them check browser console |

---

## 📈 **Advanced Features:**

- **Custom Messages:** Edit messages in `access-control.json`
- **Permission Levels:** Different users can have different permissions
- **Rate Limiting:** Control how fast users can extract data
- **Usage Tracking:** Monitor who's using the system when

**Your colleagues get a working script, but you maintain 100% control through GitHub!** 🎯
