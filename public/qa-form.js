(function() {
    // Prevent multiple instances
    if (document.getElementById('qa-tracker-root')) return;

    var API_BASE = 'https://qa-tracker-toast.vercel.app/api/embed';
    var FORM_ID = '41e96e83-dad5-4752-be7f-ae0a5dd31406';

    // Styles
    var styles = `
    #qa-tracker-root { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 2147483647; pointer-events: none; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif; }
    #qa-tracker-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.2); pointer-events: auto; }
    #qa-tracker-main { position: absolute; top: 20px; right: 20px; bottom: 20px; width: 450px; background: white; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); display: flex; flex-direction: column; overflow: hidden; pointer-events: auto; border: 1px solid #e5e7eb; }
    #qa-tracker-header { padding: 16px; border-bottom: 1px solid #e5e7eb; background: #fff; display: flex; justify-content: space-between; align-items: center; cursor: move; }
    #qa-tracker-title { font-weight: 700; font-size: 16px; color: #111827; }
    #qa-tracker-close { cursor: pointer; color: #6b7280; padding: 4px; }
    #qa-tracker-close:hover { color: #111827; }
    #qa-tracker-body { flex: 1; overflow-y: auto; padding: 16px; background: #f9fafb; }
    #qa-tracker-footer { padding: 16px; border-top: 1px solid #e5e7eb; background: #fff; display: flex; gap: 8px; justify-content: flex-end; }
    
    .qa-section-title { font-size: 12px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin: 20px 0 10px; }
    .qa-card { background: white; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 8px; overflow: hidden; transition: all 0.2s; }
    .qa-card-header { padding: 12px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; user-select: none; }
    .qa-card-header:hover { background: #f3f4f6; }
    .qa-card-header.active { background: #eff6ff; }
    .qa-card-body { padding: 12px; border-top: 1px solid #e5e7eb; background: #fff; display: none; }
    .qa-card.expanded .qa-card-body { display: block; }
    
    .qa-input-group { margin-bottom: 12px; }
    .qa-input-label { display: block; font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 4px; }
    .qa-input { width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; box-sizing: border-box; }
    .qa-input:focus { outline: none; border-color: #3b82f6; ring: 2px solid #93c5fd; }
    
    .qa-options-grid { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
    .qa-option-btn { flex: 1; min-width: 60px; padding: 8px; font-size: 12px; font-weight: 600; border: 1px solid #e5e7eb; background: #fff; border-radius: 6px; cursor: pointer; text-align: center; color: #374151; }
    .qa-option-btn:hover { background: #f9fafb; }
    .qa-option-btn.selected { border-color: #3b82f6; background: #eff6ff; color: #1d4ed8; }
    
    .qa-tags-grid { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px; }
    .qa-tag-btn { padding: 4px 8px; font-size: 11px; font-weight: 500; border: 1px solid #e5e7eb; background: #f3f4f6; border-radius: 4px; cursor: pointer; color: #4b5563; }
    .qa-tag-btn:hover { background: #e5e7eb; }
    .qa-tag-btn.selected { background: #dbeafe; color: #1e40af; border-color: #bfdbfe; }
    
    .qa-btn { padding: 8px 16px; font-size: 13px; font-weight: 600; border-radius: 6px; cursor: pointer; border: none; }
    .qa-btn-secondary { background: white; border: 1px solid #d1d5db; color: #374151; }
    .qa-btn-primary { background: #2563eb; color: white; }
    .qa-btn-success { background: #059669; color: white; }
    
    .qa-toast { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: #1f2937; color: white; padding: 10px 20px; border-radius: 50px; font-size: 13px; font-weight: 500; z-index: 2147483648; opacity: 0; transition: opacity 0.3s; pointer-events: none; }
    `;

    // State
    var state = {
        form: null,
        structure: null,
        answers: {}, //itemId -> optionId
        feedback: {}, //itemId -> text
        tags: {}, //itemId -> [tagId]
        expanded: {}, //itemId -> bool
        header: {}
    };

    // UI Elements
    var root, main, body, toast;

    // Helpers
    function createElement(tag, className, text) {
        var el = document.createElement(tag);
        if (className) el.className = className;
        if (text) el.textContent = text;
        return el;
    }

    function showToast(msg) {
        toast.textContent = msg;
        toast.style.opacity = '1';
        setTimeout(function() { toast.style.opacity = '0'; }, 3000);
    }

    // Scraper
    function scrapePage() {
        var getVal = function(s) { var el = document.querySelector(s); return el ? el.textContent.trim() : ""; };
        var h4s = Array.from(document.querySelectorAll('h4'));
        var findH4Val = function(txt) {
            var h4 = h4s.find(function(el) { return el.textContent.trim().includes(txt) });
            return h4 && h4.nextElementSibling ? h4.nextElementSibling.textContent.trim() : "";
        };
        var extractTranscript = function() {
            var els = document.querySelectorAll('.spec-transcript-content');
            return Array.from(els).map(function(el) { return el.innerText.trim(); }).join("\n");
        };

        state.header = {
            interaction_id: findH4Val('Interaction ID'),
            advocate_name: getVal('.review-info h2'),
            call_ani_dnis: (findH4Val('ANI') + ' / ' + findH4Val('DNIS')).replace(/^ \/ $/, ''),
            call_duration: findH4Val('Call Duration'),
            transcript: extractTranscript(),
            page_url: window.location.href,
            evaluation_date: new Date().toISOString().split('T')[0]
        };

        // Populate header inputs
        if(state.header.interaction_id) document.getElementById('qa-inp-interaction-id').value = state.header.interaction_id;
        if(state.header.advocate_name) document.getElementById('qa-inp-advocate').value = state.header.advocate_name;
        if(state.header.call_ani_dnis) document.getElementById('qa-inp-ani').value = state.header.call_ani_dnis;
        if(state.header.call_duration) document.getElementById('qa-inp-duration').value = state.header.call_duration;
    }

    // Render Form
    function renderForm() {
        body.innerHTML = '';
        
        // Header Fields
        var headerDiv = createElement('div', 'qa-card');
        headerDiv.style.padding = '16px';
        headerDiv.innerHTML = `
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div class="qa-input-group"><label class="qa-input-label">Interaction ID</label><input id="qa-inp-interaction-id" class="qa-input" placeholder="ID"></div>
                <div class="qa-input-group"><label class="qa-input-label">Advocate</label><input id="qa-inp-advocate" class="qa-input" placeholder="Name"></div>
                <div class="qa-input-group"><label class="qa-input-label">ANI/DNIS</label><input id="qa-inp-ani" class="qa-input" placeholder="Phone"></div>
                <div class="qa-input-group"><label class="qa-input-label">Duration</label><input id="qa-inp-duration" class="qa-input" placeholder="00:00"></div>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div class="qa-input-group"><label class="qa-input-label">Case #</label><input id="qa-inp-case" class="qa-input" placeholder="Case"></div>
                <div class="qa-input-group"><label class="qa-input-label">Category</label><input id="qa-inp-category" class="qa-input" placeholder="Category" value="Payroll > "></div>
            </div>
            <div class="qa-input-group"><label class="qa-input-label">Issue/Concern</label><textarea id="qa-inp-issue" class="qa-input" rows="2" placeholder="Describe issue..."></textarea></div>
        `;
        body.appendChild(headerDiv);

        // Dynamic Groups
        state.structure.forEach(function(group) {
            var groupTitle = createElement('div', 'qa-section-title', group.title);
            body.appendChild(groupTitle);

            group.items.forEach(function(item) {
                var card = createElement('div', 'qa-card');
                if (state.expanded[item.id]) card.classList.add('expanded');

                var header = createElement('div', 'qa-card-header');
                var title = createElement('span', '', (item.order_index + 1) + '. ' + item.question_text);
                title.style.fontWeight = '600';
                title.style.fontSize = '13px';
                
                var status = createElement('span', '', '▼');
                status.style.fontSize = '10px';
                status.style.color = '#9ca3af';

                header.appendChild(title);
                header.appendChild(status);
                
                header.onclick = function() {
                    state.expanded[item.id] = !state.expanded[item.id];
                    card.classList.toggle('expanded');
                    status.textContent = state.expanded[item.id] ? '▲' : '▼';
                };

                var content = createElement('div', 'qa-card-body');

                // Options
                var optionsGrid = createElement('div', 'qa-options-grid');
                item.options.forEach(function(opt) {
                    var btn = createElement('div', 'qa-option-btn', opt.label);
                    if (state.answers[item.id] === opt.id) btn.classList.add('selected');
                    
                    btn.onclick = function() {
                        state.answers[item.id] = opt.id;
                        state.tags[item.id] = []; // Reset tags
                        
                        // Default feedback
                        var gen = opt.feedback_general && opt.feedback_general[0] ? opt.feedback_general[0].feedback_text : '';
                        state.feedback[item.id] = gen;
                        
                        renderForm(); // Re-render to update UI (could be optimized)
                    };
                    optionsGrid.appendChild(btn);
                });
                content.appendChild(optionsGrid);

                // Tags (if option selected)
                var selectedOptId = state.answers[item.id];
                var selectedOpt = item.options.find(function(o){ return o.id === selectedOptId });
                
                if (selectedOpt && selectedOpt.feedback_tags && selectedOpt.feedback_tags.length > 0) {
                    var tagsGrid = createElement('div', 'qa-tags-grid');
                    selectedOpt.feedback_tags.forEach(function(tag) {
                        var tBtn = createElement('div', 'qa-tag-btn', tag.tag_label);
                        if (state.tags[item.id] && state.tags[item.id].includes(tag.id)) {
                            tBtn.classList.add('selected');
                        }
                        
                        tBtn.onclick = function() {
                            var currentTags = state.tags[item.id] || [];
                            if (currentTags.includes(tag.id)) {
                                currentTags = currentTags.filter(function(t){ return t !== tag.id });
                            } else {
                                currentTags.push(tag.id);
                            }
                            state.tags[item.id] = currentTags;

                            // Update feedback text
                            if (currentTags.length > 0) {
                                var txt = selectedOpt.feedback_tags
                                    .filter(function(t){ return currentTags.includes(t.id) })
                                    .map(function(t){ return t.feedback_text })
                                    .join(' ');
                                state.feedback[item.id] = txt;
                            } else {
                                var gen = selectedOpt.feedback_general && selectedOpt.feedback_general[0] ? selectedOpt.feedback_general[0].feedback_text : '';
                                state.feedback[item.id] = gen;
                            }

                            renderForm();
                        };
                        tagsGrid.appendChild(tBtn);
                    });
                    content.appendChild(tagsGrid);
                }

                // Feedback Textarea
                var txt = createElement('textarea', 'qa-input');
                txt.rows = 2;
                txt.placeholder = 'Comments...';
                txt.value = state.feedback[item.id] || '';
                txt.oninput = function(e) { state.feedback[item.id] = e.target.value; };
                content.appendChild(txt);

                card.appendChild(header);
                card.appendChild(content);
                body.appendChild(card);
            });
        });
    }

    // Initialize
    async function init() {
        // Create Styles
        var styleEl = document.createElement('style');
        styleEl.textContent = styles;
        document.head.appendChild(styleEl);

        // Create Container
        root = createElement('div');
        root.id = 'qa-tracker-root';
        
        var overlay = createElement('div');
        overlay.id = 'qa-tracker-overlay';
        overlay.onclick = function(e) { if(e.target === overlay) root.remove(); };
        
        main = createElement('div');
        main.id = 'qa-tracker-main';
        
        // Header
        var header = createElement('div');
        header.id = 'qa-tracker-header';
        header.innerHTML = '<div id="qa-tracker-title">QA Form</div><div id="qa-tracker-close">✕</div>';
        header.querySelector('#qa-tracker-close').onclick = function() { root.remove(); };
        
        // Body
        body = createElement('div');
        body.id = 'qa-tracker-body';
        body.textContent = 'Loading form...';

        // Footer
        var footer = createElement('div');
        footer.id = 'qa-tracker-footer';
        
        var btnGenerate = createElement('button', 'qa-btn qa-btn-secondary', 'Generate');
        btnGenerate.onclick = handleGenerate;
        
        var btnSave = createElement('button', 'qa-btn qa-btn-success', 'Save & Generate');
        btnSave.onclick = handleSaveAndGenerate;

        footer.appendChild(btnGenerate);
        footer.appendChild(btnSave);

        // Toast
        toast = createElement('div', 'qa-toast', 'Notification');
        root.appendChild(toast);

        main.appendChild(header);
        main.appendChild(body);
        main.appendChild(footer);
        
        overlay.appendChild(main);
        root.appendChild(overlay);
        document.body.appendChild(root);

        // Fetch Data
        try {
            var res = await fetch(API_BASE + '/form/' + FORM_ID);
            if (!res.ok) throw new Error('Failed to load form');
            var data = await res.json();
            
            state.form = data.form;
            state.structure = data.structure;
            
            // Set defaults
            state.structure.forEach(function(g){
                g.items.forEach(function(i){
                    var def = i.options.find(function(o){ return o.is_default });
                    if(def) {
                        state.answers[i.id] = def.id;
                        if(def.feedback_general && def.feedback_general[0]) {
                            state.feedback[i.id] = def.feedback_general[0].feedback_text;
                        }
                    }
                });
            });

            renderForm();
            scrapePage();
            showToast('Form Loaded');

        } catch (e) {
            body.innerHTML = '<div style="color:red;padding:20px;">Error loading form: ' + e.message + '</div>';
        }
    }

    // Actions
    async function handleSaveAndGenerate() {
        var btn = this;
        btn.textContent = 'Saving...';
        btn.disabled = true;

        try {
            // Collect Header Data from Inputs
            var headerData = {
                interaction_id: document.getElementById('qa-inp-interaction-id').value,
                advocate_name: document.getElementById('qa-inp-advocate').value,
                call_ani_dnis: document.getElementById('qa-inp-ani').value,
                call_duration: document.getElementById('qa-inp-duration').value,
                case_number: document.getElementById('qa-inp-case').value,
                case_category: document.getElementById('qa-inp-category').value,
                issue_concern: document.getElementById('qa-inp-issue').value,
                page_url: window.location.href,
                evaluation_date: new Date().toISOString()
            };

            // Collect Items
            var items = [];
            state.structure.forEach(function(g) {
                g.items.forEach(function(i) {
                    if (state.answers[i.id]) {
                        var opt = i.options.find(function(o){ return o.id === state.answers[i.id] });
                        items.push({
                            item_id: i.id,
                            answer_id: state.answers[i.id],
                            answer_text: opt ? opt.label : '',
                            feedback_text: state.feedback[i.id] || '',
                            selected_tags: state.tags[i.id] || []
                        });
                    }
                });
            });

            var payload = {
                form_id: FORM_ID,
                header_data: headerData,
                items: items
            };

            var res = await fetch(API_BASE + '/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Save failed');
            
            showToast('Saved Successfully!');
            handleGenerate();

        } catch (e) {
            alert('Error: ' + e.message);
        } finally {
            btn.textContent = 'Save & Generate';
            btn.disabled = false;
        }
    }

    function handleGenerate() {
        showToast('Running Automation...');
        
        // Flatten items for automation
        var tasks = [];
        state.structure.forEach(function(g) {
            g.items.forEach(function(i) {
                if(state.answers[i.id]) {
                    var opt = i.options.find(function(o){ return o.id === state.answers[i.id] });
                    
                    var tagLabels = [];
                    if(state.tags[i.id]) {
                         tagLabels = opt.feedback_tags
                            .filter(function(t){ return state.tags[i.id].includes(t.id) })
                            .map(function(t){ return t.tag_label });
                    }

                    tasks.push({
                        groupName: g.title,
                        fullQuestion: i.question_text,
                        answer: opt.label,
                        feedback: state.feedback[i.id],
                        tags: tagLabels,
                        index: i.order_index + 1
                    });
                }
            });
        });

        // Run Automation Logic (Same as before but local)
        var processItem = function(index) {
            if (index >= tasks.length) {
                showToast('Automation Complete');
                return;
            }
            var item = tasks[index];
            
            // Find Container
            var h2s = Array.from(document.querySelectorAll('h2'));
            var h2 = h2s.find(function(el){return el.textContent.trim().toLowerCase().includes(item.groupName.toLowerCase())});
            var container = h2 ? h2.closest('.padding-xlarge') || h2.parentElement : document;
            
            // Find Item by Index or Label
            var itemEl = container.querySelector('[data-idx="' + item.index + '"]');
            if(!itemEl){
                var labels = Array.from(container.querySelectorAll('label'));
                var label = labels.find(function(l){return l.textContent.toLowerCase().includes(item.fullQuestion.toLowerCase())});
                itemEl = label ? label.closest('div') : null;
            }

            if(itemEl){
                var header = itemEl.querySelector('div[style*="cursor: pointer"]') || itemEl.firstElementChild;
                if(header) {
                    header.click();
                    setTimeout(function(){
                        var buttons = Array.from(itemEl.querySelectorAll('button'));
                        var targetBtn = buttons.find(function(b){return b.textContent.trim().toLowerCase() === item.answer.toLowerCase()});
                        if(targetBtn){
                            targetBtn.click();
                            setTimeout(function(){
                                if(item.tags.length > 0){
                                    var allBtns = Array.from(itemEl.querySelectorAll('button'));
                                    item.tags.forEach(function(tagLabel){
                                        var tBtn = allBtns.find(function(b){
                                            return b.textContent.trim().toLowerCase().includes(tagLabel.toLowerCase());
                                        });
                                        if(tBtn) tBtn.click();
                                    });
                                }
                                setTimeout(function(){
                                    var textarea = itemEl.querySelector('textarea');
                                    if(textarea){
                                        var finalText = item.feedback || ("Automated: " + item.answer);
                                        try {
                                            var proto = Object.getPrototypeOf(textarea);
                                            var setter = Object.getOwnPropertyDescriptor(proto, "value").set;
                                            if(setter) setter.call(textarea, finalText);
                                            else textarea.value = finalText;
                                        } catch(err) {
                                            textarea.value = finalText;
                                        }
                                        textarea.dispatchEvent(new Event('input', {bubbles:true}));
                                        textarea.dispatchEvent(new Event('change', {bubbles:true}));
                                    }
                                    processItem(index + 1);
                                }, 500);
                            }, 2500);
                        } else { processItem(index + 1); }
                    }, 500);
                } else { processItem(index + 1); }
            } else { processItem(index + 1); }
        };

        processItem(0);
        // Minimize the modal while running? Maybe just keep it.
    }

    // Start
    init();

})();