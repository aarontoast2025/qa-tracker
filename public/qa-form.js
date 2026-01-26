(function() {
    if (document.getElementById('qa-tracker-root')) return;
    console.log("QA Tool: Initializing...");

    var SUPABASE_URL = 'https://lobhwknisejjvubweall.supabase.co';
    var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvYmh3a25pc2VqanZ1YndlYWxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1Nzk4NjIsImV4cCI6MjA4NDE1NTg2Mn0.2OTSmBD62Fgcecuxps6YoaW9-lPPu1MFA7cWl1g9MUk';
    var FORM_ID = '41e96e83-dad5-4752-be7f-ae0a5dd31406';

    var styles = "#qa-tracker-root { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 2147483647; pointer-events: none; font-family: sans-serif; }" +
    "#qa-tracker-main { position: fixed; top: 20px; right: 20px; width: 550px; max-height: 85vh; background: white; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); display: flex; flex-direction: column; pointer-events: auto; border: 1px solid #e0e0e0; overflow: hidden; }" +
    "#qa-tracker-header { padding: 15px 20px; background: #fff; border-bottom: 1px solid #e0e0e0; color: #333; display: flex; justify-content: space-between; align-items: center; cursor: grab; font-weight: 600; font-size: 18px; user-select: none; }" +
    "#qa-tracker-body { flex: 1; overflow-y: auto; padding: 20px; background: #fff; }" +
    "#qa-tracker-footer { padding: 16px; border-top: 1px solid #e0e0e0; background: #fff; display: flex; gap: 8px; justify-content: flex-end; }" +
    ".qa-card { border: 1px solid #e0e0e0; border-radius: 4px; margin-bottom: 8px; overflow: hidden; }" +
    ".qa-card-header { padding: 10px 16px; background: #f5f5f5; display: flex; align-items: center; justify-content: space-between; cursor: pointer; }" +
    ".header-success { background: #f0fdf4 !important; }" +
    ".header-destructive { background: #fef2f2 !important; }" +
    ".header-warning { background: #fffbeb !important; }" +
    ".header-default { background: #eff6ff !important; }" +
    ".qa-card-body { padding: 12px 16px; border-top: 1px solid #e0e0e0; background: #fafafa; display: none; }" +
    ".qa-card.expanded .qa-card-body { display: block; }" +
    ".qa-section-title { font-size: 16px; font-weight: bold; color: #1d4ed8; border-bottom: 2px solid #1d4ed8; padding-bottom: 4px; margin: 20px 0 10px; }" +
    ".qa-compact-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 15px; }" +
    ".qa-field-wrap { display: flex; align-items: center; border: 1px solid #ccc; border-radius: 4px; padding: 6px 10px; background: white; }" +
    ".qa-field-icon { margin-right: 8px; font-size: 14px; opacity: 0.7; width: 18px; text-align: center; }" +
    ".qa-field-input { width: 100%; border: none; outline: none; font-size: 13px; background: transparent; }" +
    ".qa-label-small { display: block; margin-bottom: 4px; font-weight: 600; font-size: 12px; color: #333; }" +
    ".qa-btn-group { display: flex; gap: 6px; margin-bottom: 8px; flex-wrap: wrap; }" +
    ".qa-opt-btn { flex: 1; min-width: 60px; padding: 8px; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; font-weight: 500; font-size: 12px; background: white; text-transform: uppercase; }" +
    ".btn-success.selected { background: #dcfce7 !important; color: #14532d !important; border-color: #15803d !important; }" +
    ".btn-destructive.selected { background: #fee2e2 !important; color: #7f1d1d !important; border-color: #b91c1c !important; }" +
    ".btn-warning.selected { background: #fef3c7 !important; color: #92400e !important; border-color: #d97706 !important; }" +
    ".btn-default.selected { background: #f3f4f6 !important; color: #374151 !important; border-color: #9ca3af !important; }" +
    ".qa-tag-group { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px; }" +
    ".qa-tag-btn { padding: 4px 8px; font-size: 10px; font-weight: 600; border: 1px solid #ccc; border-radius: 12px; background: white; cursor: pointer; text-transform: uppercase; }" +
    ".qa-tag-btn.selected { background: #2563eb; color: white; border-color: #1e40af; }" +
    ".qa-btn { padding: 8px 16px; border-radius: 4px; cursor: pointer; border: 1px solid #ccc; font-size: 14px; font-weight: 500; }" +
    ".qa-btn-cancel { background: white; color: #333; }" +
    ".qa-btn-save { background: #059669; color: white; border: none; }" +
    ".qa-btn-gen { background: #4f46e5; color: white; border: none; }" +
    ".qa-btn-both { background: #2563eb; color: white; border: none; }" +
    ".qa-checkbox { width: 16px; height: 16px; margin-right: 12px; cursor: pointer; }" +
    ".qa-item-label { font-size: 14px; color: #333; font-weight: 400; }" +
    ".qa-textarea { width: 100%; border: 1px solid #ccc; border-radius: 4px; padding: 8px; font-family: inherit; resize: vertical; height: 60px; font-size: 13px; box-sizing: border-box; }";

    var state = { structure: [], answers: {}, feedback: {}, checked: {}, expanded: {}, selectedTags: {}, header: {} };

    function sb(table, query) {
        return fetch(SUPABASE_URL + '/rest/v1/' + table + '?' + query, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
        }).then(function(r) { return r.json(); }).catch(function() { return []; });
    }

    function updateFeedback(itemId) {
        var itm = null;
        for(var i=0; i<state.structure.length; i++) {
            for(var j=0; j<state.structure[i].items.length; j++) {
                if(state.structure[i].items[j].id === itemId) itm = state.structure[i].items[j];
            }
        }
        if(!itm) return;
        var opt = itm.options.filter(function(o){ return o.id === state.answers[itemId]; })[0];
        if(!opt) return;
        var tags = state.selectedTags[itemId] || [];
        if(tags.length > 0) {
            var txts = [];
            for(var k=0; k<opt.feedback_tags.length; k++) {
                if(tags.indexOf(opt.feedback_tags[k].id) > -1) txts.push(opt.feedback_tags[k].feedback_text);
            }
            state.feedback[itemId] = txts.join(' ');
        } else {
            state.feedback[itemId] = (opt.feedback_general && opt.feedback_general[0]) ? opt.feedback_general[0].feedback_text : "";
        }
    }

    function scrape() {
        var h4s = document.querySelectorAll('h4'), id="", adv="", ani="", dur="";
        for(var i=0; i<h4s.length; i++) {
            var t = h4s[i].textContent.trim(), v = h4s[i].nextElementSibling ? h4s[i].nextElementSibling.textContent.trim() : "";
            if(t.indexOf('Interaction ID')>-1) id=v; if(t.indexOf('ANI')>-1) ani=v; if(t.indexOf('DNIS')>-1) ani = ani?ani+" / "+v:v; if(t.indexOf('Call Duration')>-1) dur=v;
        }
        var h2 = document.querySelector('.review-info h2'); adv = h2?h2.textContent.trim():"";
        state.header = { id: id, adv: adv, ani: ani, dur: dur };
    }

    function render() {
        var body = document.getElementById('qa-tracker-body'); if(!body) return;
        body.innerHTML = '<div class="qa-compact-grid">' +
        '<div class="qa-field-wrap"><span class="qa-field-icon">\uD83C\uDD94</span><input class="qa-field-input" id="h-id" placeholder="Interaction ID" value="'+(state.header.id||"")+'"></div>' +
        '<div class="qa-field-wrap"><span class="qa-field-icon">\uD83D\uDC64</span><input class="qa-field-input" id="h-adv" placeholder="Advocate Name" value="'+(state.header.adv||"")+'"></div>' +
        '<div class="qa-field-wrap"><span class="qa-field-icon">\uD83D\uDCDE</span><input class="qa-field-input" id="h-ani" placeholder="ANI/DNIS" value="'+(state.header.ani||"")+'"></div>' +
        '<div style="grid-column: 1 / -1; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">' +
            '<div class="qa-field-wrap"><span class="qa-field-icon">\uD83D\uDD22</span><input class="qa-field-input" id="h-case" placeholder="Case #"></div>' +
            '<div class="qa-field-wrap"><span class="qa-field-icon">\u23F1</span><input class="qa-field-input" id="h-dur" placeholder="Call Duration" value="'+(state.header.dur||"")+'"></div>' +
        '</div>' +
        '<div style="grid-column: 1 / -1; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">' +
            '<div style="margin-bottom:12px"><label class="qa-label-small">Date of Interaction</label><input type="date" class="qa-field-input" style="border:1px solid #ccc; padding:6px; border-radius:4px" id="h-datei"></div>' +
            '<div style="margin-bottom:12px"><label class="qa-label-small">Date of Evaluation</label><input type="date" class="qa-field-input" style="border:1px solid #ccc; padding:6px; border-radius:4px" id="h-datee" value="'+new Date().toISOString().split('T')[0]+'"></div>' +
        '</div>' +
        '<div class="qa-field-wrap" style="grid-column: 1 / -1;"><span class="qa-field-icon">\uD83D\uDCC2</span><input class="qa-field-input" id="h-cat" placeholder="Case Category" value="Payroll > "></div>' +
        '<div class="qa-field-wrap" style="grid-column: 1 / -1; align-items:flex-start;"><span class="qa-field-icon" style="margin-top:3px">✍</span><textarea class="qa-field-input" id="h-issue" rows="2" placeholder="Issue/Concern"></textarea></div></div>';

        state.structure.forEach(function(g) {
            var t = document.createElement('div'); t.className = 'qa-section-title'; t.textContent = g.title; body.appendChild(t);
            g.items.forEach(function(item) {
                var curOpt = item.options.filter(function(o){ return o.id === state.answers[item.id]; })[0];
                var hClr = curOpt ? "header-" + (curOpt.color || "default") : "";
                var card = document.createElement('div'); card.className = 'qa-card' + (state.expanded[item.id] ? ' expanded' : '');
                var head = document.createElement('div'); head.className = 'qa-card-header ' + hClr;
                var left = document.createElement('div'); left.style.display = 'flex'; left.style.alignItems = 'center';
                var cb = document.createElement('input'); cb.type = 'checkbox'; cb.className = 'qa-checkbox'; cb.checked = !!state.checked[item.id];
                cb.onclick = function(e){ e.stopPropagation(); state.checked[item.id] = this.checked; };
                var lbl = document.createElement('span'); lbl.className = 'qa-item-label'; lbl.textContent = item.short_name || item.question_text;
                left.appendChild(cb); left.appendChild(lbl);
                var arr = document.createElement('span'); arr.textContent = state.expanded[item.id] ? '\u25B2' : '\u25BC';
                head.appendChild(left); head.appendChild(arr);
                head.onclick = function(){ state.expanded[item.id] = !state.expanded[item.id]; render(); };
                var cont = document.createElement('div'); cont.className = 'qa-card-body';
                var bGrp = document.createElement('div'); bGrp.className = 'qa-btn-group';
                item.options.forEach(function(o) {
                    var b = document.createElement('button'); b.className = 'qa-opt-btn ' + (o.color ? 'btn-' + o.color : 'btn-default') + (state.answers[item.id] === o.id ? ' selected' : '');
                    b.textContent = o.label; b.onclick = function(){ state.answers[item.id] = o.id; state.selectedTags[item.id] = []; updateFeedback(item.id); render(); };
                    bGrp.appendChild(b);
                });
                cont.appendChild(bGrp);
                if(curOpt && curOpt.feedback_tags && curOpt.feedback_tags.length > 0) {
                    var tGrp = document.createElement('div'); tGrp.className = 'qa-tag-group';
                    curOpt.feedback_tags.forEach(function(tag) {
                        var tb = document.createElement('div'); var isS = (state.selectedTags[item.id] || []).indexOf(tag.id) > -1;
                        tb.className = 'qa-tag-btn' + (isS ? ' selected' : ''); tb.textContent = tag.tag_label;
                        tb.onclick = function() {
                            var c = state.selectedTags[item.id] || []; var i = c.indexOf(tag.id); if(i > -1) c.splice(i, 1); else c.push(tag.id);
                            state.selectedTags[item.id] = c; updateFeedback(item.id); render();
                        }; tGrp.appendChild(tb);
                    }); cont.appendChild(tGrp);
                }
                var area = document.createElement('textarea'); area.className = 'qa-textarea'; area.placeholder = 'Comments...'; area.value = state.feedback[item.id] || '';
                area.oninput = function(){ state.feedback[item.id] = this.value; }; cont.appendChild(area);
                card.appendChild(head); card.appendChild(cont); body.appendChild(card);
            });
        });
    }

    function automate() {
        var tasks = [];
        state.structure.forEach(function(g){ g.items.forEach(function(i){
            if(state.checked[i.id] && state.answers[i.id]) {
                var o = i.options.filter(function(opt){ return opt.id === state.answers[i.id]; })[0];
                tasks.push({ g: g.title, q: i.question_text, a: o.label, f: state.feedback[i.id], x: i.order_index + 1 });
            }
        });});
        var run = function(idx) {
            if(idx >= tasks.length) return;
            var t = tasks[idx], h2s = document.querySelectorAll('h2'), h2 = null;
            for(var i=0; i<h2s.length; i++) { if(h2s[i].textContent.indexOf(t.g) > -1) h2 = h2s[i]; }
            var cont = h2 ? h2.closest('.padding-xlarge') || h2.parentElement : document;
            var el = cont.querySelector('[data-idx="' + t.x + '"]');
            if(el) {
                el.querySelector('div[style*="cursor: pointer"]').click();
                setTimeout(function(){
                    var bs = el.querySelectorAll('button'), b = null;
                    for(var j=0; j<bs.length; j++) { if(bs[j].textContent.trim().toLowerCase() === t.a.toLowerCase()) b = bs[j]; }
                    if(b) b.click();
                    setTimeout(function(){
                        var a = el.querySelector('textarea'); if(a){ a.value = t.f || ("Automated: " + t.a); a.dispatchEvent(new Event('input', {bubbles:true})); }
                        run(idx + 1);
                    }, 1000);
                }, 400);
            } else { run(idx + 1); }
        }; run(0);
    }

    var root = document.createElement('div'); root.id = 'qa-tracker-root';
    var st = document.createElement('style'); st.textContent = styles; document.head.appendChild(st);
    root.innerHTML = '<div id="qa-tracker-main"><div id="qa-tracker-header"><span>QA Form Tool</span><span onclick="document.getElementById(\'qa-tracker-root\').remove()" style="cursor:pointer">\u2715</span></div><div id="qa-tracker-body">Loading...</div><div id="qa-tracker-footer"><button class="qa-btn qa-btn-cancel" onclick="document.getElementById(\'qa-tracker-root\').remove()">Cancel</button><button class="qa-btn qa-btn-save">Save</button><button class="qa-btn qa-btn-gen" id="qa-g">Generate</button><button class="qa-btn qa-btn-both">Save & Generate</button></div></div>';
    document.body.appendChild(root);
    document.getElementById('qa-g').onclick = automate;
    
    var m = document.getElementById('qa-tracker-main'), h = document.getElementById('qa-tracker-header');
    h.onmousedown = function(e) {
        if(e.target !== h && e.target.parentNode !== h) return;
        var p3 = e.clientX, p4 = e.clientY;
        document.onmouseup = function(){ document.onmouseup = null; document.onmousemove = null; };
        document.onmousemove = function(e){
            var p1 = p3 - e.clientX, p2 = p4 - e.clientY; p3 = e.clientX; p4 = e.clientY;
            m.style.top = (m.offsetTop - p2) + "px"; m.style.left = (m.offsetLeft - p1) + "px"; m.style.right = 'auto';
        };
    };

    Promise.all([
        sb('tracker_audit_groups', 'form_id=eq.'+FORM_ID+'&order=order_index'),
        sb('tracker_audit_items', 'order=order_index'),
        sb('tracker_audit_item_options', 'order=order_index'),
        sb('feedback_general', 'select=*'),
        sb('feedback_tags', 'select=*')
    ]).then(function(res) {
        var groups = res[0], items = res[1], opts = res[2], fGen = res[3], fTags = res[4];
        state.structure = groups.map(function(g) {
            g.items = items.filter(function(i){ return i.group_id === g.id; }).map(function(i) {
                i.options = opts.filter(function(o){ return o.item_id === i.id; }).map(function(o) {
                    o.feedback_general = fGen.filter(function(f){ return f.option_id === o.id; });
                    o.feedback_tags = fTags.filter(function(f){ return f.option_id === o.id; });
                    return o;
                });
                var def = i.options.filter(function(o){ return o.is_default; })[0];
                if(def) { state.answers[i.id] = def.id; state.feedback[i.id] = (def.feedback_general && def.feedback_general[0]) ? def.feedback_general[0].feedback_text : ""; }
                state.checked[i.id] = true; return i;
            });
            return g;
        });
        scrape(); render();
    });
})();
