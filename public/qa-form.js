(function() {
    if (document.getElementById('qa-tracker-root')) return;

    // --- CONFIGURATION ---
    var APP_URL = 'https://qa-tracker-toast.vercel.app';
    var SUPABASE_URL = 'https://gmawsnjwdeefwzradbzn.supabase.co';
    var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtYXdzbmp3ZGVlZnd6cmFkYnpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4MjY2MzEsImV4cCI6MjA4MzQwMjYzMX0.TurtWcLSXyx25IiPFXlly7FPWOn3nCcbzmZGJzI_1nI';
    var FORM_ID = '41e96e83-dad5-4752-be7f-ae0a5dd31406';

    var styles = `
    #qa-tracker-root { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 2147483647; pointer-events: none; font-family: -apple-system, system-ui, sans-serif; }
    #qa-tracker-main { position: fixed; top: 20px; right: 20px; width: 420px; max-height: 90vh; background: white; border-radius: 12px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); display: flex; flex-direction: column; pointer-events: auto; border: 1px solid #e5e7eb; overflow: hidden; }
    #qa-tracker-header { padding: 14px 18px; background: #111827; color: white; display: flex; justify-content: space-between; align-items: center; font-size: 14px; letter-spacing: 0.025em; }
    #qa-tracker-body { flex: 1; overflow-y: auto; padding: 16px; background: #f9fafb; scroll-behavior: smooth; }
    #qa-tracker-footer { padding: 12px 16px; border-top: 1px solid #e5e7eb; background: white; display: flex; gap: 8px; justify-content: flex-end; }
    .qa-card { background: white; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 12px; padding: 14px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
    .qa-btn { padding: 8px 16px; border-radius: 6px; cursor: pointer; border: none; font-weight: 600; font-size: 13px; transition: all 0.2s; }
    .qa-btn-primary { background: #2563eb; color: white; }
    .qa-btn-primary:hover { background: #1d4ed8; }
    .qa-btn-success { background: #059669; color: white; }
    .qa-btn-success:hover { background: #047857; }
    .qa-input { width: 100%; padding: 8px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; margin-bottom: 8px; box-sizing: border-box; outline: none; transition: border-color 0.2s; }
    .qa-input:focus { border-color: #3b82f6; ring: 2px solid #93c5fd; }
    .qa-section-title { font-size: 11px; font-weight: 800; color: #6b7280; text-transform: uppercase; margin: 20px 0 10px; letter-spacing: 0.05em; display: flex; align-items: center; }
    .qa-section-title::after { content: ""; flex: 1; height: 1px; background: #e5e7eb; margin-left: 10px; }
    .qa-option-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap: 6px; margin-bottom: 10px; }
    .qa-option-btn { padding: 8px 4px; font-size: 11px; font-weight: 700; border: 1px solid #e5e7eb; background: #fff; cursor: pointer; text-align: center; border-radius: 6px; color: #4b5563; text-transform: uppercase; transition: all 0.2s; }
    .qa-option-btn:hover { background: #f9fafb; }
    .qa-option-btn.selected { background: #eff6ff; border-color: #3b82f6; color: #1d4ed8; box-shadow: 0 0 0 1px #3b82f6; }
    .qa-summary-btn { cursor: pointer; color: #3b82f6; font-size: 12px; font-weight: 600; margin-top: -5px; margin-bottom: 10px; display: inline-block; }
    .qa-summary-btn:hover { text-decoration: underline; }
    `;

    var state = { structure: [], answers: {}, feedback: {}, header: {} };

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
                if(def) {
                    state.answers[i.id] = def.id;
                    // Note: You can add logic here to pull default feedback if available
                }
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
        var transcript = (function() {
            var els = document.querySelectorAll('.spec-transcript-content');
            return Array.from(els).map(function(el) { return el.innerText.trim(); }).join("\n");
        })();

        state.header = {
            interaction_id: findH4Val('Interaction ID'),
            advocate_name: getVal('.review-info h2'),
            transcript: transcript
        };
    }

    async function handleSummarize() {
        var btn = document.getElementById('qa-summarize');
        if (!state.header.transcript) { alert('No transcript found.'); return; }
        
        btn.textContent = 'Summarizing...';
        try {
            var res = await fetch(APP_URL + '/api/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript: state.header.transcript })
            });
            var data = await res.json();
            if (data.summary) document.getElementById('h-issue').value = data.summary;
        } catch (e) { alert('Summary failed: ' + e); }
        btn.textContent = '✨ Auto-Summarize';
    }

    function render() {
        var body = document.getElementById('qa-tracker-body');
        if (!body) return;
        body.innerHTML = '';
        
        // Header
        var hDiv = document.createElement('div'); hDiv.className = 'qa-card';
        hDiv.innerHTML = `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
                <div><label style="font-size:10px;font-weight:700;color:#9ca3af">INT ID</label><input class="qa-input" id="h-id" value="${state.header.interaction_id}"></div>
                <div><label style="font-size:10px;font-weight:700;color:#9ca3af">ADVOCATE</label><input class="qa-input" id="h-adv" value="${state.header.advocate_name}"></div>
            </div>
            <label style="font-size:10px;font-weight:700;color:#9ca3af">ISSUE/CONCERN</label>
            <div id="qa-summarize" class="qa-summary-btn">✨ Auto-Summarize</div>
            <textarea class="qa-input" id="h-issue" rows="3" placeholder="Describe the issue..."></textarea>
        `;
        body.appendChild(hDiv);
        hDiv.querySelector('#qa-summarize').onclick = handleSummarize;

        state.structure.forEach(function(group) {
            var gTitle = document.createElement('div'); gTitle.className = 'qa-section-title';
            gTitle.textContent = group.title;
            body.appendChild(gTitle);

            group.items.forEach(function(item) {
                var card = document.createElement('div'); card.className = 'qa-card';
                card.innerHTML = `<div style="font-weight:700;font-size:13px;margin-bottom:10px;color:#111827">${item.question_text}</div>`;
                
                var grid = document.createElement('div'); grid.className = 'qa-option-grid';
                item.options.forEach(function(opt) {
                    var btn = document.createElement('div');
                    btn.className = 'qa-option-btn' + (state.answers[item.id] === opt.id ? ' selected' : '');
                    btn.textContent = opt.label;
                    btn.onclick = function() { state.answers[item.id] = opt.id; render(); };
                    grid.appendChild(btn);
                });
                card.appendChild(grid);

                var txt = document.createElement('textarea'); txt.className = 'qa-input';
                txt.placeholder = 'Feedback...';
                txt.value = state.feedback[item.id] || '';
                txt.oninput = function(e) { state.feedback[item.id] = e.target.value; };
                card.appendChild(txt);

                body.appendChild(card);
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
            evaluation_date: new Date().toISOString()
        };

        await sb('audit_submissions', 'POST', payload);
        alert('Audit Saved!');
        
        // Automation Logic
        var tasks = [];
        state.structure.forEach(g => g.items.forEach(i => {
            if (state.answers[i.id]) {
                var opt = i.options.find(o => o.id === state.answers[i.id]);
                tasks.push({ group: g.title, q: i.question_text, a: opt.label, f: state.feedback[i.id], idx: i.order_index + 1 });
            }
        }));

        var run = function(idx) {
            if (idx >= tasks.length) { btn.disabled = false; btn.textContent = 'Save & Generate'; return; }
            var t = tasks[idx];
            var h2 = Array.from(document.querySelectorAll('h2')).find(el => el.textContent.includes(t.group));
            var cont = h2 ? h2.closest('.padding-xlarge') || h2.parentElement : document;
            var itemEl = cont.querySelector('[data-idx="' + t.idx + '"]');
            if (itemEl) {
                itemEl.querySelector('div[style*="cursor: pointer"]').click();
                setTimeout(function() {
                    var b = Array.from(itemEl.querySelectorAll('button')).find(el => el.textContent.trim().toLowerCase() === t.a.toLowerCase());
                    if (b) b.click();
                    setTimeout(function() {
                        var area = itemEl.querySelector('textarea');
                        if (area) { area.value = t.f || ("Automated: " + t.a); area.dispatchEvent(new Event('input', {bubbles:true})); }
                        run(idx + 1);
                    }, 1000);
                }, 400);
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
