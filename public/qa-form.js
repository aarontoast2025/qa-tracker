(function() {
    if (document.getElementById('qa-tracker-root')) return;

    // --- CONFIGURATION ---
    var SUPABASE_URL = 'https://gmawsnjwdeefwzradbzn.supabase.co';
    var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtYXdzbmp3ZGVlZnd6cmFkYnpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4MjY2MzEsImV4cCI6MjA4MzQwMjYzMX0.TurtWcLSXyx25IiPFXlly7FPWOn3nCcbzmZGJzI_1nI';
    var FORM_ID = '41e96e83-dad5-4752-be7f-ae0a5dd31406';
    var APP_URL = 'https://qa-tracker-toast.vercel.app';

    // --- STYLES ---
    var styles = `
    #qa-tracker-root { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 2147483647; pointer-events: none; font-family: system-ui, -apple-system, sans-serif; }
    #qa-tracker-main { position: fixed; top: 20px; right: 20px; width: 480px; max-height: 85vh; background: white; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.3), 0 10px 10px -5px rgba(0,0,0,0.1); display: flex; flex-direction: column; pointer-events: auto; border: 1px solid #e5e7eb; overflow: hidden; }
    #qa-tracker-header { padding: 15px 20px; background: #111827; color: white; display: flex; justify-content: space-between; align-items: center; cursor: grab; user-select: none; }
    #qa-tracker-header:active { cursor: grabbing; }
    #qa-tracker-body { flex: 1; overflow-y: auto; padding: 20px; background: #f9fafb; scroll-behavior: smooth; }
    #qa-tracker-footer { padding: 16px; border-top: 1px solid #e5e7eb; background: white; display: flex; gap: 10px; justify-content: flex-end; }
    
    .qa-card { background: white; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 10px; overflow: hidden; transition: box-shadow 0.2s; }
    .qa-card-header { padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; background: #fff; transition: background 0.2s; }
    .qa-card-header:hover { background: #f3f4f6; }
    .qa-card-body { padding: 16px; border-top: 1px solid #e5e7eb; background: #fafafa; display: none; }
    .qa-card.expanded .qa-card-body { display: block; }

    .qa-section-title { font-size: 13px; font-weight: 800; color: #1d4ed8; text-transform: uppercase; margin: 24px 0 12px; letter-spacing: 0.05em; display: flex; align-items: center; border-bottom: 2px solid #1d4ed8; padding-bottom: 4px; }
    
    .qa-btn-group { display: flex; gap: 8px; margin-bottom: 12px; }
    .qa-opt-btn { flex: 1; padding: 10px; font-size: 12px; font-weight: 700; border-radius: 6px; border: 1px solid #d1d5db; background: white; cursor: pointer; text-align: center; text-transform: uppercase; transition: all 0.2s; color: #374151; }
    
    /* Dynamic Colors from DB */
    .btn-success.selected { background: #dcfce7; color: #14532d; border-color: #15803d; }
    .btn-destructive.selected { background: #fee2e2; color: #7f1d1d; border-color: #b91c1c; }
    .btn-warning.selected { background: #fef3c7; color: #92400e; border-color: #d97706; }
    .btn-default.selected { background: #eff6ff; color: #1e40af; border-color: #3b82f6; }

    .qa-input { width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; box-sizing: border-box; outline: none; transition: border-color 0.2s; }
    .qa-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
    
    .qa-btn { padding: 10px 20px; border-radius: 8px; cursor: pointer; border: none; font-weight: 700; font-size: 14px; transition: all 0.2s; }
    .qa-btn-main { background: #2563eb; color: white; }
    .qa-btn-main:hover { background: #1d4ed8; }
    .qa-btn-success { background: #059669; color: white; }
    .qa-btn-success:hover { background: #047857; }
    
    .qa-checkbox { width: 18px; height: 18px; cursor: pointer; margin-right: 12px; accent-color: #2563eb; }
    `;

    var state = { structure: [], answers: {}, feedback: {}, checked: {}, expanded: {}, header: {} };

    async function sb(table, query) {
        var res = await fetch(SUPABASE_URL + '/rest/v1/' + table + '?' + query, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
        });
        return res.ok ? res.json() : [];
    }

    async function loadForm() {
        try {
            var groups = await sb('tracker_audit_groups', 'form_id=eq.' + FORM_ID + '&order=order_index');
            var groupIds = groups.map(g => g.id);
            var items = await sb('tracker_audit_items', 'group_id=in.(' + groupIds.join(',') + ')&order=order_index');
            var itemIds = items.map(i => i.id);
            var options = await sb('tracker_audit_item_options', 'item_id=in.(' + itemIds.join(',') + ')&order=order_index');

            state.structure = groups.map(g => {
                g.items = items.filter(i => i.group_id === g.id).map(i => {
                    i.options = options.filter(o => o.item_id === i.id);
                    var def = i.options.find(o => o.is_default);
                    if (def) state.answers[i.id] = def.id;
                    state.checked[i.id] = true; // Default checked
                    return i;
                });
                return g;
            });
            scrape();
            render();
        } catch (e) {
            document.getElementById('qa-tracker-body').innerHTML = '<div style="color:red;padding:20px;">' + e.message + '</div>';
        }
    }

    function scrape() {
        var getVal = function(s) { var el = document.querySelector(s); return el ? el.textContent.trim() : ""; };
        var h4s = Array.from(document.querySelectorAll('h4'));
        var findH4Val = function(txt) {
            var h4 = h4s.find(function(el) { return el.textContent.trim().includes(txt) });
            return h4 && h4.nextElementSibling ? h4.nextElementSibling.textContent.trim() : "";
        };
        state.header = {
            id: findH4Val('Interaction ID'),
            adv: getVal('.review-info h2'),
            dur: findH4Val('Call Duration')
        };
    }

    function render() {
        var body = document.getElementById('qa-tracker-body');
        if (!body) return;
        body.innerHTML = '';
        
        // Header Fields
        var hCard = document.createElement('div'); hCard.className = 'qa-card'; hCard.style.padding = '16px';
        hCard.innerHTML = `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
                <div><label style="font-size:11px;font-weight:700;color:#6b7280">INT ID</label><input class="qa-input" id="h-id" value="${state.header.id||''}"></div>
                <div><label style="font-size:11px;font-weight:700;color:#6b7280">ADVOCATE</label><input class="qa-input" id="h-adv" value="${state.header.adv||''}"></div>
            </div>
            <label style="font-size:11px;font-weight:700;color:#6b7280">ISSUE/CONCERN</label>
            <textarea class="qa-input" id="h-issue" rows="2" placeholder="Describe issue..."></textarea>
        `;
        body.appendChild(hCard);

        state.structure.forEach(group => {
            var gTitle = document.createElement('div'); gTitle.className = 'qa-section-title';
            gTitle.textContent = group.title;
            body.appendChild(gTitle);

            group.items.forEach(item => {
                var card = document.createElement('div'); 
                card.className = 'qa-card' + (state.expanded[item.id] ? ' expanded' : '');
                
                var header = document.createElement('div'); header.className = 'qa-card-header';
                
                var left = document.createElement('div'); left.style.display = 'flex'; left.style.alignItems = 'center';
                var cb = document.createElement('input'); cb.type = 'checkbox'; cb.className = 'qa-checkbox';
                cb.checked = state.checked[item.id];
                cb.onclick = (e) => { e.stopPropagation(); state.checked[item.id] = cb.checked; };
                
                var label = document.createElement('span'); 
                label.style.fontWeight = '700'; label.style.fontSize = '13px';
                label.textContent = item.question_text;
                
                left.appendChild(cb); left.appendChild(label);
                
                var arrow = document.createElement('span'); arrow.textContent = state.expanded[item.id] ? '▲' : '▼';
                arrow.style.color = '#9ca3af'; arrow.style.fontSize = '10px';
                
                header.appendChild(left); header.appendChild(arrow);
                header.onclick = () => { state.expanded[item.id] = !state.expanded[item.id]; render(); };
                
                var content = document.createElement('div'); content.className = 'qa-card-body';
                
                // Buttons
                var btnGroup = document.createElement('div'); btnGroup.className = 'qa-btn-group';
                item.options.forEach(opt => {
                    var btn = document.createElement('button');
                    var isSel = state.answers[item.id] === opt.id;
                    btn.className = 'qa-opt-btn ' + (opt.color ? 'btn-' + opt.color : 'btn-default') + (isSel ? ' selected' : '');
                    btn.textContent = opt.label;
                    btn.onclick = () => { state.answers[item.id] = opt.id; render(); };
                    btnGroup.appendChild(btn);
                });
                content.appendChild(btnGroup);
                
                var textarea = document.createElement('textarea'); textarea.className = 'qa-input';
                textarea.placeholder = 'Feedback...';
                textarea.value = state.feedback[item.id] || '';
                textarea.oninput = (e) => { state.feedback[item.id] = e.target.value; };
                content.appendChild(textarea);
                
                card.appendChild(header); card.appendChild(content);
                body.appendChild(card);
            });
        });
    }

    function makeDraggable(el, handle) {
        var p1 = 0, p2 = 0, p3 = 0, p4 = 0;
        handle.onmousedown = (e) => {
            p3 = e.clientX; p4 = e.clientY;
            document.onmouseup = () => { document.onmouseup = null; document.onmousemove = null; };
            document.onmousemove = (e) => {
                p1 = p3 - e.clientX; p2 = p4 - e.clientY;
                p3 = e.clientX; p4 = e.clientY;
                el.style.top = (el.offsetTop - p2) + "px";
                el.style.left = (el.offsetLeft - p1) + "px";
                el.style.right = 'auto';
            };
        };
    }

    async function handleSave() {
        var btn = document.getElementById('qa-save');
        btn.disabled = true; btn.textContent = 'Processing...';
        
        var tasks = [];
        state.structure.forEach(g => g.items.forEach(i => {
            if (state.checked[i.id] && state.answers[i.id]) {
                var opt = i.options.find(o => o.id === state.answers[i.id]);
                tasks.push({ group: g.title, q: i.question_text, a: opt.label, f: state.feedback[i.id], idx: i.order_index + 1 });
            }
        }));

        var run = (idx) => {
            if (idx >= tasks.length) { btn.disabled = false; btn.textContent = 'Save & Generate'; return; }
            var t = tasks[idx];
            var h2 = Array.from(document.querySelectorAll('h2')).find(el => el.textContent.includes(t.group));
            var cont = h2 ? h2.closest('.padding-xlarge') || h2.parentElement : document;
            var itemEl = cont.querySelector('[data-idx="' + t.idx + '"]');
            
            if (itemEl) {
                var head = itemEl.querySelector('div[style*="cursor: pointer"]') || itemEl.firstElementChild;
                head.click();
                setTimeout(() => {
                    var b = Array.from(itemEl.querySelectorAll('button')).find(el => el.textContent.trim().toLowerCase() === t.a.toLowerCase());
                    if (b) b.click();
                    setTimeout(() => {
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
    root.innerHTML = `<div id="qa-tracker-main">
        <div id="qa-tracker-header"><b>QA TRACKER PRO</b><span onclick="document.getElementById('qa-tracker-root').remove()" style="cursor:pointer">✕</span></div>
        <div id="qa-tracker-body">Loading...</div>
        <div id="qa-tracker-footer"><button class="qa-btn qa-btn-success" id="qa-save">Save & Generate</button></div>
    </div>`;
    document.body.appendChild(root);
    makeDraggable(document.getElementById('qa-tracker-main'), document.getElementById('qa-tracker-header'));
    loadForm();
})();