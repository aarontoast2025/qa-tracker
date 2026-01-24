javascript:(function(){
    const w=500,h=800,l=(screen.width-w)/2,t=(screen.height-h)/2;
    const p=window.location.pathname;
    
    /* 1. Identify Form ID */
    const parts = p.split('/');
    const bIdx = parts.indexOf('form-builder');
    const f = (bIdx !== -1 && parts[bIdx+1]) ? parts[bIdx+1] : '77777777-7777-7777-7777-777777777777';
    
    /* 2. Open Popup */
    const u = 'https://qa-tracker-toast.vercel.app/embed/audit/' + f;
    const popup = window.open(u, 'QAForm', `width=${w},height=${h},top=${t},left=${l},scrollbars=yes`);

    /* 3. The Bridge: Listen for commands from the Popup */
    window.removeEventListener('message', window.__qaBridge); // Clean up old listeners
    window.__qaBridge = function(e) {
        if (e.origin !== 'https://qa-tracker-toast.vercel.app' && !e.origin.includes('localhost')) return;
        
        if (e.data.type === 'AUTOMATE_PAGE') {
            console.log('Automation received:', e.data.data);
            const items = e.data.data;
            
            items.forEach(item => {
                // Find group container (matching your old project logic)
                const h2s = Array.from(document.querySelectorAll('h2'));
                const h2 = h2s.find(el => el.textContent.trim().includes(item.groupName));
                const container = h2 ? h2.closest('.padding-xlarge') || h2.parentElement : document;

                if (!container) return;

                // Find item by ID (data-idx)
                const itemEl = container.querySelector(`[data-idx="${item.index}"]`);
                if (!itemEl) return;

                // 1. Click the button (Yes/No/etc)
                const buttons = Array.from(itemEl.querySelectorAll('button'));
                const targetBtn = buttons.find(b => b.textContent.trim().toLowerCase() === item.answer?.toLowerCase());
                if (targetBtn) targetBtn.click();

                // 2. Fill the textarea (if answer has comments)
                const textarea = itemEl.querySelector('textarea');
                if (textarea) {
                    textarea.value = `Automated answer: ${item.answer}`;
                    textarea.dispatchEvent(new Event('input', { bubbles: true }));
                }
            });
        }
    };
    window.addEventListener('message', window.__qaBridge);
})();