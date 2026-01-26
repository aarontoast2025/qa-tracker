(function() {
    if (document.getElementById('qa-tracker-root')) return;

    // --- CONFIGURATION ---
    var APP_URL = 'https://qa-tracker-toast.vercel.app';
    var SUPABASE_URL = 'https://lobhwknisejjvubweall.supabase.co';
    var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvYmh3a25pc2VqanZ1YndlYWxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1Nzk4NjIsImV4cCI6MjA4NDE1NTg2Mn0.2OTSmBD62Fgcecuxps6YoaW9-lPPu1MFA7cWl1g9MUk';
    var FORM_ID = '41e96e83-dad5-4752-be7f-ae0a5dd31406';

    var styles = `
    #qa-tracker-root { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 2147483647; pointer-events: none; font-family: -apple-system, sans-serif; }
    #qa-tracker-main { position: fixed; top: 20px; right: 20px; width: 450px; max-height: 90vh; background: white; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.4); display: flex; flex-direction: column; pointer-events: auto; border: 1px solid #e5e7eb; overflow: hidden; }
    #qa-tracker-header { padding: 12px 16px; background: #111827; color: white; display: flex; justify-content: space-between; align-items: center; cursor: move; }
    #qa-tracker-body { flex: 1; overflow-y: auto; padding: 16px; background: #f9fafb; }
    #qa-tracker-footer { padding: 12px; border-top: 1px solid #e5e7eb; background: white; display: flex; gap: 8px; justify-content: flex-end; }
    .qa-card { background: white; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 8px; padding: 12px; }
    .qa-btn { padding: 8px 16px; border-radius: 6px; cursor: pointer; border: none; font-weight: 600; font-size: 13px; transition: opacity 0.2s; }
    .qa-btn-primary { background: #2563eb; color: white; }
    .qa-btn-success { background: #059669; color: white; }
    .qa-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .qa-input { width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; margin-bottom: 8px; box-sizing: border-box; }
    .qa-section-title { font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; margin: 15px 0 8px; letter-spacing: 0.05em; }
    .qa-option-btn { flex: 1; padding: 8px; font-size: 11px; font-weight: 600; border: 1px solid #e5e7eb; background: white; cursor: pointer; text-align: center; border-radius: 6px; text-transform: uppercase; }
    .qa-option-btn.selected { background: #eff6ff; border-color: #3b82f6; color: #1d4ed8; }
    .qa-tag-btn { padding: 4px 8px; font-size: 10px; font-weight: 600; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 4px; cursor: pointer; text-transform: uppercase; }
    .qa-tag-btn.selected { background: #2563eb; color: white; border-color: #1d4ed8; }
    `;

    var state = { structure: [], answers: {}, feedback: {}, tags: {}, header: {} };

    async function sb(path, method, body) {
        var options = {
            method: method || 'GET',
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json' }
        };
        if (body) options.body = JSON.stringify(body);
        var res = await fetch(SUPABASE_URL + '/rest/v1/' + path, options);
        return res.ok ? res.json() : null;
    }

    async function loadForm() {
        var groups = await sb('tracker_audit_groups?form_id=eq.' + FORM_ID + '&select=*,items:tracker_audit_items(*,options:tracker_audit_item_options(*))&order=order_index');
        if (!groups) return;
        
        state.structure = groups;
        state.structure.forEach(function(g) {
            g.items.sort((a,b) => a.order_index - b.order_index);
            g.items.forEach(function(i) {
                i.options.sort((a,b) => a.order_index - b.order_index);
                var def = i.options.find(function(o){ return o.is_default });
                if(def) state.answers[i.id] = def.id;
            });
        });
        scrape();
        render();
    }

    function scrape() {
        var getVal = function(s) { var el = document.querySelector(s); return el ? el.textContent.trim() : ""; };
        var h4s = Array.from(document.querySelectorAll('h4'));
        var findH4Val = function(txt) {
            var h4 = h4s.find(function(el) { return el.textContent.trim().includes(txt) });
            return h4 && h4.nextElementSibling ? h4.nextElementSibling.textContent.trim() : "";
        };
        state.header = {
            interaction_id: findH4Val('Interaction ID'),
            advocate_name: getVal('.review-info h2'),
            call_ani_dnis: findH4Val('ANI') || findH4Val('DNIS'),
            call_duration: findH4Val('Call Duration'),
            page_url: window.location.href
        };
    }

    function render() {
        var body = document.getElementById('qa-tracker-body');
        if (!body) return;
        body.innerHTML = '';
        
        // Header Info
        var hDiv = document.createElement('div'); hDiv.className = 'qa-card';
        hDiv.innerHTML = `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
                <input class="qa-input" id="h-id" placeholder="Int ID" value="${state.header.interaction_id}">
                <input class="qa-input" id="h-adv" placeholder="Advocate" value="${state.header.advocate_name}">
            </div>
            <textarea class="qa-input" id="h-issue" placeholder="Issue/Concern..." rows="2"></textarea>
        `;
        body.appendChild(hDiv);

        state.structure.forEach(function(group) {
            var gTitle = document.createElement('div'); gTitle.className = 'qa-section-title';
            gTitle.textContent = group.title;
            body.appendChild(gTitle);

            group.items.forEach(function(item) {
                var card = document.createElement('div'); card.className = 'qa-card';
                card.innerHTML = `<div style="font-weight:700;font-size:12px;margin-bottom:8px;color:#374151">${item.question_text}</div>`;
                
                var grid = document.createElement('div'); grid.style.display = 'flex'; grid.style.gap = '6px';
                item.options.forEach(function(opt) {
                    var btn = document.createElement('div');
                    btn.className = 'qa-option-btn' + (state.answers[item.id] === opt.id ? ' selected' : '');
                    btn.textContent = opt.label;
                    btn.onclick = function() { state.answers[item.id] = opt.id; state.tags[item.id] = []; render(); };
                    grid.appendChild(btn);
                });
                card.appendChild(grid);

                // Feedback
                var txt = document.createElement('textarea'); txt.className = 'qa-input'; txt.style.marginTop='8px';
                txt.placeholder = 'Comments...';
                txt.value = state.feedback[item.id] || '';
                txt.oninput = function(e) { state.feedback[item.id] = e.target.value; };
                card.appendChild(txt);

                div = document.createElement('div'); div.appendChild(card);
                body.appendChild(div);
            });
        });
    }

    async function handleSave() {
        var btn = document.getElementById('qa-save-btn');
        btn.disabled = true; btn.textContent = 'Saving...';
        
        var payload = {
            form_id: FORM_ID,
            interaction_id: document.getElementById('h-id').value,
            advocate_name: document.getElementById('h-adv').value,
            issue_concern: document.getElementById('h-issue').value,
            page_url: window.location.href,
            evaluation_date: new Date().toISOString()
        };

        var sub = await sb('audit_submissions', 'POST', payload);
        alert('Saved to Database!');
        automate();
        btn.disabled = false; btn.textContent = 'Save & Generate';
    }

    function automate() {
        var tasks = [];
        state.structure.forEach(function(g) {
            g.items.forEach(function(i) {
                if (state.answers[i.id]) {
                    var opt = i.options.find(o => o.id === state.answers[i.id]);
                    tasks.push({ group: g.title, q: i.question_text, a: opt.label, f: state.feedback[i.id], idx: i.order_index + 1 });
                }
            });
        });

        var run = function(idx) {
            if (idx >= tasks.length) return;
            var t = tasks[idx];
            var h2 = Array.from(document.querySelectorAll('h2')).find(el => el.textContent.includes(t.group));
            var cont = h2 ? h2.closest('.padding-xlarge') || h2.parentElement : document;
            var itemEl = cont.querySelector('[data-idx="' + t.idx + '"]');
            
            if (itemEl) {
                var head = itemEl.querySelector('div[style*="cursor: pointer"]') || itemEl.firstElementChild;
                head.click();
                setTimeout(function() {
                    var btn = Array.from(itemEl.querySelectorAll('button')).find(b => b.textContent.trim().toLowerCase() === t.a.toLowerCase());
                    if (btn) btn.click();
                    setTimeout(function() {
                        var area = itemEl.querySelector('textarea');
                        if (area) { area.value = t.f || ("Automated: " + t.a); area.dispatchEvent(new Event('input', {bubbles:true})); }
                        run(idx + 1);
                    }, 1500);
                }, 500);
            } else { run(idx + 1); }
        };
        run(0);
    }

    var root = document.createElement('div'); root.id = 'qa-tracker-root';
    var style = document.createElement('style'); style.textContent = styles; document.head.appendChild(style);
    root.innerHTML = `<div id="qa-tracker-main"><div id="qa-tracker-header"><b>QA TRACKER PRO</b><span onclick="document.getElementById('qa-tracker-root').remove()" style="cursor:pointer">✕</span></div><div id="qa-tracker-body">Loading...</div><div id="qa-tracker-footer"><button class="qa-btn qa-btn-success" id="qa-save-btn">Save & Generate</button></div></div>`;
    document.body.appendChild(root);
    document.getElementById('qa-save-btn').onclick = handleSave;
    loadForm();
})();