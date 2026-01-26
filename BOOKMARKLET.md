# QA Tracker Bookmarklet

Copy the code below and paste it into the **URL** or **Address** field of a new bookmark in your browser.

### Bookmarklet Code:
```javascript
javascript:(function(){var s=document.createElement('script');s.src='https://qa-tracker-toast.vercel.app/qa-form.js?v='+Date.now();document.body.appendChild(s);})();
```

---

### How to install:
1. **Right-click** your bookmarks bar and select **Add Page** or **Add Bookmark**.
2. Set the **Name** to something like `Launch QA Form`.
3. In the **URL** field, paste the code above.
4. Click **Save**.

### How to use:
1. Navigate to the page you want to audit (e.g., a call recording or transcript page).
2. Click the `Launch QA Form` bookmark.
3. Enter the **Form ID** from your QA Tracker app.
4. The audit window will open and automatically begin pulling data from the page.
