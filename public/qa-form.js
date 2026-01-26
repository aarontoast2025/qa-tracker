(function() {
    if (document.getElementById('qa-tracker-root')) return;

    // --- CONFIGURATION ---
    var SUPABASE_URL = 'https://lobhwknisejjvubweall.supabase.co';
    var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvYmh3a25pc2VqanZ1YndlYWxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1Nzk4NjIsImV4cCI6MjA4NDE1NTg2Mn0.2OTSmBD62Fgcecuxps6YoaW9-lPPu1MFA7cWl1g9MUk';
    var FORM_ID = '41e96e83-dad5-4752-be7f-ae0a5dd31406';

    var styles = `
    #qa-tracker-root { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 2147483647; pointer-events: none; font-family: system-ui, -apple-system, sans-serif; }
    #qa-tracker-main { position: fixed; top: 20px; right: 20px; width: 550px; max-height: 85vh; background: white; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); display: flex; flex-direction: column; pointer-events: auto; border: 1px solid #e0e0e0; overflow: hidden; }
    #qa-tracker-header { padding: 15px 20px; background: #fff; border-bottom: 1px solid #e0e0e0; color: #333; display: flex; justify-content: space-between; align-items: center; cursor: grab; font-weight: 600; font-size: 18px; user-select: none; }
    #qa-tracker-body { flex: 1; overflow-y: auto; padding: 20px; background: #fff; }
    #qa-tracker-footer { padding: 16px; border-top: 1px solid #e0e0e0; background: #fff; display: flex; gap: 10px; justify-content: flex-end; }
    
    .qa-card { border: 1px solid #e0e0e0; border-radius: 4px; margin-bottom: 8px; overflow: hidden; }
    .qa-card-header { padding: 10px 16px; background: #f5f5f5; display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: background 0.2s; }
    .qa-card-body { padding: 12px 16px; border-top: 1px solid #e0e0e0; background: #fafafa; display: none; }
    .qa-card.expanded .qa-card-body { display: block; }

    .qa-section-title { font-size: 16px; font-weight: bold; color: #1d4ed8; border-bottom: 2px solid #1d4ed8; padding-bottom: 4px; margin: 20px 0 10px; }
    
    .qa-compact-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 15px; }
    .qa-field-wrap { display: flex; align-items: center; border: 1px solid #ccc; border-radius: 4px; padding: 6px 10px; background: white; }
    .qa-field-icon { margin-right: 8px; font-size: 14px; opacity: 0.7; width: 18px; text-align: center; }
    .qa-field-input { width: 100%; border: none; outline: none; font-size: 13px; background: transparent; }
    .qa-label-small { display: block; margin-bottom: 4px; font-weight: 600; font-size: 12px; color: #333; }

    .qa-btn-group { display: flex; gap: 6px; margin-bottom: 8px; }
    .qa-opt-btn { flex: 1; padding: 8px; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; font-weight: 500; font-size: 12px; background: white; transition: all 0.2s; }
    
    .btn-success.selected { background: #dcfce7; color: #14532d; border-color: #15803d; }
    .btn-destructive.selected { background: #fee2e2; color: #7f1d1d; border-color: #b91c1c; }
    .btn-warning.selected { background: #fef3c7; color: #92400e; border-color: #d97706; }
    .btn-default.selected { background: #f3f4f6; color: #374151; border-color: #9ca3af; }

    .qa-btn { padding: 8px 16px; border-radius: 4px; cursor: pointer; border: 1px solid #ccc; font-size: 14px; font-weight: 500; transition: all 0.2s; }
    .qa-btn-cancel { background: white; color: #333; }
    .qa-btn-save { background: #059669; color: white; border: none; }
    .qa-btn-gen { background: #4f46e5; color: white; border: none; }
    .qa-btn-both { background: #2563eb; color: white; border: none; }
    
    .qa-checkbox { width: 16px; height: 16px; margin-right: 12px; cursor: pointer; }
    .qa-item-label { font-size: 14px; color: #333; font-weight: 400; }
    .qa-textarea { width: 100%; border: 1px solid #ccc; border-radius: 4px; padding: 8px; font-family: inherit; resize: vertical; height: 50px; font-size: 13px; }
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
                    state.checked[i.id] = false;
                    return i;
                });
                return g;
            });
            scrape();
            render();
        } catch (e) { console.error(e); }
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
            ani: findH4Val('ANI') || findH4Val('DNIS'),
            dur: findH4Val('Call Duration')
        };
    }

    function render() {
        var body = document.getElementById('qa-tracker-body');
        if (!body) return;
        body.innerHTML = '';
        
        // Header Fields with Icons and Ghosttext
        var hGrid = document.createElement('div'); hGrid.className = 'qa-compact-grid';
        hGrid.innerHTML = `
            <div class="qa-field-wrap"><span class="qa-field-icon">🆔</span><input class="qa-field-input" id="h-id" placeholder="Interaction ID" value="${state.header.id||''}"></div>
            <div class="qa-field-wrap"><span class="qa-field-icon">👤</span><input class="qa-field-input" id="h-adv" placeholder="Advocate Name" value="${state.header.adv||''}"></div>
            <div class="qa-field-wrap"><span class="qa-field-icon">📞</span><input class="qa-field-input" id="h-ani" placeholder="ANI/DNIS" value="${state.header.ani||''}"></div>
            <div style="grid-column: 1 / -1; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div class="qa-field-wrap"><span class="qa-field-icon">🔢</span><input class="qa-field-input" id="h-case" placeholder="Case #"></div>
                <div class="qa-field-wrap"><span class="qa-field-icon">⏱️</span><input class="qa-field-input" id="h-dur" placeholder="Call Duration" value="${state.header.dur||''}"></div>
            </div>
            <div style="grid-column: 1 / -1; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div style="margin-bottom:12px"><label class="qa-label-small">Date of Interaction</label><input type="date" class="qa-field-input" style="border:1px solid #ccc; padding:6px; border-radius:4px" id="h-datei"></div>
                <div style="margin-bottom:12px"><label class="qa-label-small">Date of Evaluation</label><input type="date" class="qa-field-input" style="border:1px solid #ccc; padding:6px; border-radius:4px" id="h-datee" value="${new Date().toISOString().split('T')[0]}"></div>
            </div>
            <div class="qa-field-wrap" style="grid-column: 1 / -1;"><span class="qa-field-icon">🗂️</span><input class="qa-field-input" id="h-cat" placeholder="Case Category" value="Payroll > "></div>
            <div class="qa-field-wrap" style="grid-column: 1 / -1; align-items:flex-start;"><span class="qa-field-icon" style="margin-top:3px">✍️</span><textarea class="qa-field-input" id="h-issue" rows="2" placeholder="Issue/Concern"></textarea></div>
        `;
        body.appendChild(hGrid);

        state.structure.forEach(group => {
            var gTitle = document.createElement('div'); gTitle.className = 'qa-section-title';
            gTitle.textContent = group.title;
            body.appendChild(gTitle);

            group.items.forEach(item => {
                var card = document.createElement('div'); card.className = 'qa-card' + (state.expanded[item.id] ? ' expanded' : '');
                var header = document.createElement('div'); header.className = 'qa-card-header';
                
                var left = document.createElement('div'); left.style.display = 'flex'; left.style.alignItems = 'center';
                var cb = document.createElement('input'); cb.type = 'checkbox'; cb.className = 'qa-checkbox';
                cb.checked = state.checked[item.id];
                cb.onclick = (e) => { e.stopPropagation(); state.checked[item.id] = cb.checked; };
                
                var label = document.createElement('span'); label.className = 'qa-item-label';
                label.textContent = item.short_name || item.question_text;
                
                left.appendChild(cb); left.appendChild(label);
                var arrow = document.createElement('span'); arrow.textContent = state.expanded[item.id] ? '▲' : '▼';
                header.appendChild(left); header.appendChild(arrow);
                header.onclick = () => { state.expanded[item.id] = !state.expanded[item.id]; render(); };
                
                var content = document.createElement('div'); content.className = 'qa-card-body';
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
                
                var area = document.createElement('textarea'); area.className = 'qa-textarea';
                area.placeholder = 'Comments...';
                area.value = state.feedback[item.id] || '';
                area.oninput = (e) => { state.feedback[item.id] = e.target.value; };
                content.appendChild(area);
                card.appendChild(header); card.appendChild(content);
                body.appendChild(card);
            });
        });
    }

    function makeDraggable(el, handle) {
        var p1 = 0, p2 = 0, p3 = 0, p4 = 0;
        handle.onmousedown = (e) => {
            if (e.target !== handle && e.target.parentNode !== handle) return;
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

    async function handleAutomate() {
        var tasks = [];
        state.structure.forEach(g => g.items.forEach(i => {
            if (state.checked[i.id] && state.answers[i.id]) {
                var opt = i.options.find(o => o.id === state.answers[i.id]);
                tasks.push({ group: g.title, q: i.question_text, a: opt.label, f: state.feedback[i.id], idx: i.order_index + 1 });
            }
        }));

        var run = (idx) => {
            if (idx >= tasks.length) return;
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
        <div id="qa-tracker-header"><span>QA Form Tool</span><span onclick="document.getElementById('qa-tracker-root').remove()" style="cursor:pointer">✕</span></div>
        <div id="qa-tracker-body">Loading...</div>
        <div id="qa-tracker-footer">
            <button class="qa-btn qa-btn-cancel" onclick="document.getElementById('qa-tracker-root').remove()">Cancel</button>
            <button class="qa-btn qa-btn-save">Save</button>
            <button class="qa-btn qa-btn-gen" id="qa-g">Generate</button>
            <button class="qa-btn qa-btn-both">Save & Generate</button>
        </div>
    </div>`;
    document.body.appendChild(root);
    document.getElementById('qa-g').onclick = handleAutomate;
    makeDraggable(document.getElementById('qa-tracker-main'), document.getElementById('qa-tracker-header'));
    loadForm();
})();
