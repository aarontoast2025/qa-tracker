# QA Tracker Bookmarklet

To use this, create a new bookmark in your browser and paste the following code into the **URL** (or **Location**) field.

### The Bookmarklet Code (Copy this):

```javascript
javascript:(function(){const w=500,h=800,l=(screen.width-w)/2,t=(screen.height-h)/2;const p=window.location.pathname;const f=p.split('/')[p.split('/').indexOf('form-builder')+1]||'YOUR_FORM_ID_HERE';const u='https://qa-tracker-toast.vercel.app/audit/fill/'+f;window.open(u,'QAForm',`width=${w},height=${h},top=${t},left=${l},scrollbars=yes`);})();
```

### How to use it:
1. **From Form Builder:** If you are currently editing a form in the tracker, just click the bookmark. It will automatically detect which form you are working on and open it in the popup.
2. **From Any Site:** If you want to use it while auditing another website, you can edit the bookmark and replace `'YOUR_FORM_ID_HERE'` with the specific ID of the form you want to use most often.

---
*Note: If the popup doesn't appear, check if your browser is blocking popups for the site you are currently on.*
