# QA Tracker Bookmarklet

This bookmarklet loads the QA form tool from GitHub Pages, which is trusted by Stellaconnect and other target sites.

## How to Use

### Step 1: Create the Bookmarklet

1. Create a new bookmark in your browser
2. Name it something like "QA Form Tool"
3. Copy the code below and paste it into the **URL** or **Address** field:

```javascript
javascript:(function(){const s=document.createElement('script');s.src='https://aarontoast2025.github.io/qa-tracker/public/qa-form.js?v='+(new Date).getTime();document.head.appendChild(s);}());
```

### Step 2: Use the Bookmarklet

1. Navigate to the page you want to audit (e.g., a Stellaconnect interaction page)
2. Click the bookmarklet you created
3. The QA form tool will appear on the right side of the page
4. Fill out the form and use the automation features as needed

## How It Works

1. The bookmarklet loads `qa-form.js` from GitHub Pages (https://aarontoast2025.github.io/qa-tracker/)
2. The script fetches the form structure from your Vercel API endpoint
3. The form renders as an overlay on the current page
4. You can fill out the form, and it can automatically populate fields on the target page

## Updating the Script

After making changes to `public/qa-form.js`:

1. Commit and push your changes to GitHub
2. The GitHub Pages site will automatically update
3. The bookmarklet will load the latest version (cache-busted with timestamp)

## Troubleshooting

If the bookmarklet shows "Loading..." forever:

1. Open browser DevTools (F12)
2. Check the Console tab for errors
3. Common issues:
   - API endpoint not accessible (check CORS settings)
   - Form ID not found in database
   - Network connectivity issues

## Alternative: Console Paste Method

If the bookmarklet doesn't work due to strict CSP policies:

1. Open the page you want to audit
2. Press **F12** to open Developer Tools
3. Click the **Console** tab
4. Copy the entire content of `public/qa-form.js`
5. Paste it into the Console and press **Enter**
