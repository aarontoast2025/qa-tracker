# QA Tracker Bookmarklet

Since the target site has strict security policies that block loading external scripts directly, we will use a "Fetch & Execute" approach.

### Option 1: Bookmarklet (Try this first)
Copy the code below and paste it into the **URL** or **Address** field of a new bookmark.

```javascript
javascript:(function(){const s=document.createElement('script');s.src='https://aarontoast2025.github.io/qa-tracker/public/qa-form.js?v='+(new Date).getTime();document.head.appendChild(s);}());
```

**How it works:**
1. It fetches the latest script code from your Vercel app (as text).
2. It executes that code immediately in the browser.
3. This often bypasses the "Block external script loading" rule, provided the site allows "eval" (executing text as code).

---

### Option 2: Console Paste (Guaranteed fallback)
If Option 1 fails (e.g., nothing happens or you see an error about `eval` or `connect-src`), follow these steps:

1. Open the page you want to audit.
2. Press **F12** (or right-click -> Inspect) to open Developer Tools.
3. Click the **Console** tab.
4. Copy the entire code from this link: [View Raw Script](https://qa-tracker-toast.vercel.app/qa-form.js)
   *(Or copy the content of `public/qa-form.js` from your project)*
5. Paste it into the Console and press **Enter**.
