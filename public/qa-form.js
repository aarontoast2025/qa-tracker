(function() {
    if (document.getElementById('qa-modal-overlay')) return;
    console.log("QA Tool: Initializing...");

    var API_BASE_URL = 'https://qa-tracker-toast.vercel.app';
    // Only use local API if explicitly requested OR if we are running on a local development environment
    var isLocal = window.QA_TOOL_LOCAL === true || 
                 window.location.hostname === 'localhost' || 
                 window.location.hostname === '127.0.0.1';
                 
    if (isLocal && !window.QA_FORCE_PROD) {
        API_BASE_URL = 'http://localhost:3000';
    }
    
    var FORM_ID = 'afb48a57-c3d3-47c7-a0fe-555db55f3b7b';

    var state = {};
    var globalStructure = [];
    var globalFeedbackGeneral = [];
    var globalFeedbackTags = [];
    var existingRecordId = null;

    // Colors
    // Palette definitions are handled inside getColors

    // Styles
    var sOverlay = "position:fixed;top:0;left:0;right:0;bottom:0;background:transparent;display:flex;align-items:flex-start;justify-content:center;z-index:99999;font-family:system-ui,sans-serif;padding-top:20px;overflow-y:auto;pointer-events:none";
    var sModal = "background:white;border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,0.2);width:90%;max-width:550px;height:80vh;max-height:800px;overflow:hidden;display:flex;flex-direction:column;cursor:grab;user-select:none;margin-bottom:20px;pointer-events:auto;position:relative";
    var sHeader = "padding:15px 20px;border-bottom:1px solid #e0e0e0;font-size:18px;font-weight:600;color:#333;cursor:grab;display:flex;justify-content:space-between;align-items:center";
    var sContent = "padding:20px;flex:1;color:#666;font-size:14px;line-height:1.6;overflow-y:auto";
    var sGroupHeader = "margin:20px 0 10px;font-size:16px;font-weight:bold;color:#1d4ed8;border-bottom:2px solid #1d4ed8;padding-bottom:4px";
    var sItemContainer = "margin-bottom:8px;border:1px solid #e0e0e0;border-radius:4px;overflow:hidden";
    var sItemHeader = "width:100%;padding:10px 16px;background:#f5f5f5;border:none;text-align:left;cursor:pointer;font-weight:500;color:#333;display:flex;justify-content:space-between;align-items:center";
    var sItemBody = "display:none;padding:12px 16px;border-top:1px solid #e0e0e0;background:#fafafa";
    var sBtnGroup = "margin-bottom:8px;display:flex;gap:6px";
    var sBtnBase = "flex:1;padding:8px;border:1px solid;border-radius:4px;cursor:pointer;font-weight:500;font-size:12px;transition:all 0.2s";
    var sSelect = "width:100%;padding:8px;border:1px solid #ccc;border-radius:4px;margin-bottom:8px;font-size:13px";
    var sTextarea = "width:100%;border:1px solid #ccc;border-radius:4px;padding:8px;font-family:inherit;resize:vertical;height:50px;font-size:13px";
    var sInput = "width:100%;padding:8px;border:1px solid #ccc;border-radius:4px;font-size:13px;box-sizing:border-box";
    var sLabel = "display:block;margin-bottom:4px;font-weight:600;font-size:12px;color:#333";
    var sFooter = "padding:16px;border-top:1px solid #e0e0e0;display:flex;gap:12px;justify-content:flex-end";
    var sBtnCancel = "padding:8px 16px;border:1px solid #ccc;background:white;border-radius:4px;cursor:pointer;font-size:14px;color:#333";
    var sBtnGenerate = "padding:8px 16px;border:none;background:#2563eb;color:white;border-radius:4px;cursor:pointer;font-size:14px;font-weight:500";
    var sTagContainer = "display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px";
    var sLoading = "position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(255,255,255,0.8);display:flex;justify-content:center;align-items:center;z-index:10;font-size:14px;color:#666;font-weight:500;flex-direction:column;gap:10px";

    var createElement = function(tag, css) {
        var el = document.createElement(tag);
        if(css) el.style.cssText = css;
        return el;
    };

    var addListener = function(el, event, handler) {
        el.addEventListener(event, handler);
    };

    var getTheme = function(item, sel) {
        var opt = item.options.filter(function(o){ return o.id === sel; })[0];
        if(!opt || !opt.color) return 'gray';
        return opt.color.toLowerCase();
    };

    var getColors = function(theme) {
        theme = (theme || 'gray').toLowerCase();
        
        var palettes = {
            green: { bg: "#d1fae5", border: "#10b981", txt: "#064e3b", header: "#ecfdf5" }, 
            red: { bg: "#fee2e2", border: "#ef4444", txt: "#7f1d1d", header: "#fef2f2" },
            yellow: { bg: "#fef3c7", border: "#f59e0b", txt: "#78350f", header: "#fffbeb" },
            gray: { bg: "#f3f4f6", border: "#9ca3af", txt: "#1f2937", header: "#f9fafb" },
            blue: { bg: "#dbeafe", border: "#3b82f6", txt: "#1e3a8a", header: "#eff6ff" }
        };

        if(theme === 'success') theme = 'green';
        if(theme === 'destructive') theme = 'red';
        if(theme === 'warning') theme = 'yellow';
        if(theme === 'neutral') theme = 'gray';

        return palettes[theme] || palettes.gray;
    };

    var updateText = function(key) {
        var s = state[key];
        if(!s || !s.domTextarea) return;
        
        var txt = "";
        var sources = [];

        var cleanText = function(t) {
            if (!t) return "";
            // Remove "Source: ..." block from the end of the text if present
            return t.replace(/\s*Source:[\s\S]*$/i, "").trim();
        };

        var addSource = function(srcStr) {
            if (!srcStr) return;
            // Split by semicolon OR comma
            srcStr.split(/[;,]/).forEach(function(src) {
                var trimmed = src.trim();
                // Deduplicate
                if (trimmed && sources.indexOf(trimmed) === -1) {
                    sources.push(trimmed);
                }
            });
        };

        if(s.selectedTags.length > 0) {
            txt = s.selectedTags.map(function(t){ return cleanText(t.feedback_text); }).join(" ");
            s.selectedTags.forEach(function(t) {
                addSource(t.source);
            });
        } else {
            var genFeedback = globalFeedbackGeneral.filter(function(f){ 
                return f.option_id === s.sel; 
            })[0];
            
            if (genFeedback) {
                txt = cleanText(genFeedback.feedback_text);
                addSource(genFeedback.source);
            }
        }
        
        // Append sources if any
        if (sources.length > 0) {
            txt += "\n\nSource:\n" + sources.join("\n");
        }
        
        s.text = txt;
        s.domTextarea.value = txt;
        s.domTextarea.dispatchEvent(new Event('input'));
    };

    var refreshAllUI = function() {
        Object.keys(state).forEach(function(key){
            if(state[key].refreshUI) state[key].refreshUI();
            if(state[key].domTextarea) {
                state[key].domTextarea.value = state[key].text;
            }
        });
    };

    var extractText = function(selector) { 
        var el = document.querySelector(selector); 
        return el ? el.textContent.trim() : ""; 
    };

    var extractTranscript = function() {
        var els = document.querySelectorAll('.spec-transcript-content');
        return Array.from(els).map(function(el){ return el.innerText.trim(); }).join("\n");
    };

    var generateSummary = function() {
        var transcript = extractTranscript();
        if(!transcript) {
            showToast("No transcript found on page.", true);
            return Promise.resolve(null);
        }
        
        return fetch(API_BASE_URL + '/api/summarize', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ transcript: transcript })
        })
        .then(function(res){ return res.json(); })
        .then(function(data){ return data.summary || null; })
        .catch(function(e){
            console.error("Summary Generation Failed:", e);
            showToast("Failed to generate summary", true);
            return null;
        });
    };

    var getInteractionId = function() {
        var h4s = Array.from(document.querySelectorAll('h4'));
        var h4 = h4s.find(function(el){ return el.textContent.trim() === 'Interaction ID'; });
        return h4 && h4.nextElementSibling ? h4.nextElementSibling.textContent.trim() : "";
    };

    var getAdvocateName = function() { 
        return extractText('.review-info h2'); 
    };

    var getAniDnisOptions = function() {
        var h4s = Array.from(document.querySelectorAll('h4'));
        var opts = [];
        var dnisH4 = h4s.find(function(el){ return el.textContent.trim() === 'DNIS'; });
        if(dnisH4 && dnisH4.nextElementSibling) opts.push(dnisH4.nextElementSibling.textContent.trim());
        var aniH4 = h4s.find(function(el){ return el.textContent.trim() === 'ANI'; });
        if(aniH4 && aniH4.nextElementSibling) opts.push(aniH4.nextElementSibling.textContent.trim());
        return opts;
    };

    var getCallDuration = function() {
        var h4s = Array.from(document.querySelectorAll('h4'));
        var h4 = h4s.find(function(el){ return el.textContent.includes('Call Duration'); });
        if(h4 && h4.nextElementSibling) {
            var val = parseFloat(h4.nextElementSibling.textContent.trim());
            return isNaN(val) ? "" : Math.round(val);
        }
        return "";
    };

    var createCompactField = function(placeholder, icon, type, fullWidth, useLabel, initialValue, options) {
        type = type || "text";
        fullWidth = fullWidth || false;
        useLabel = useLabel || false;
        initialValue = initialValue || "";
        options = options || [];

        var wrapper = createElement("div");
        if(fullWidth) wrapper.style.gridColumn = "1 / -1";

        if(useLabel) {
            var lbl = createElement("label");
            lbl.textContent = placeholder;
            lbl.style.cssText = sLabel;
            var input = createElement("input");
            input.type = type;
            input.style.cssText = sInput;
            if(initialValue) input.value = initialValue;
            wrapper.appendChild(lbl);
            wrapper.appendChild(input);
            return { div: wrapper, input: input };
        } else {
            var container = createElement("div");
            container.style.cssText = "display:flex;align-items:center;border:1px solid #ccc;border-radius:4px;padding:6px 10px;background:white;transition:border-color 0.2s";
            
            var ico = createElement("span");
            ico.textContent = icon;
            ico.style.cssText = "margin-right:8px;font-size:14px;opacity:0.7;user-select:none;min-width:18px;text-align:center";
            
            var input;
            if(options && options.length > 0) {
                input = createElement("select");
                input.style.cssText = "width:100%;border:none;outline:none;font-family:inherit;font-size:13px;background:transparent;cursor:pointer";
                options.forEach(function(opt){
                    var o = createElement("option");
                    o.value = opt;
                    o.textContent = opt;
                    input.appendChild(o);
                });
            } else if(type === "textarea") {
                input = createElement("textarea");
                input.style.cssText = "width:100%;border:none;outline:none;font-family:inherit;font-size:13px;resize:vertical;height:60px;padding:0";
                input.placeholder = placeholder;
                container.style.alignItems = "flex-start";
                ico.style.marginTop = "3px";
                if(initialValue) input.value = initialValue;
            } else {
                input = createElement("input");
                input.type = type;
                input.style.cssText = "width:100%;border:none;outline:none;font-family:inherit;font-size:13px;background:transparent";
                input.placeholder = placeholder;
                if(initialValue) input.value = initialValue;
            }

            addListener(input, "focus", function(){ container.style.borderColor = "#2563eb"; });
            addListener(input, "blur", function(){ container.style.borderColor = "#ccc"; });

            container.appendChild(ico);
            container.appendChild(input);
            wrapper.appendChild(container);
            return { div: wrapper, input: input };
        }
    };

    var showToast = function(msg, isError) {
        isError = isError !== false;
        var toast = createElement("div");
        toast.textContent = msg;
        toast.style.cssText = "position:fixed;bottom:20px;right:20px;background:" + (isError ? '#ef4444' : '#10b981') + ";color:white;padding:12px 20px;border-radius:6px;box-shadow:0 10px 15px -3px rgba(0, 0, 0, 0.1);z-index:100000;font-size:14px;font-weight:500;opacity:0;transition:opacity 0.3s ease-in-out;pointer-events:none;";
        document.body.appendChild(toast);
        requestAnimationFrame(function(){ toast.style.opacity = "1"; });
        setTimeout(function(){
            toast.style.opacity = "0";
            setTimeout(function(){ toast.remove(); }, 300);
        }, 3000);
    };

    var findGroupContainer = function(name) {
        var h2s = Array.from(document.querySelectorAll('h2'));
        var h2 = h2s.find(function(el){ return el.textContent.trim().includes(name); });
        return h2 ? h2.closest('.padding-xlarge') : null;
    };

    // Create UI
    var overlay = createElement("div", sOverlay);
    overlay.id = "qa-modal-overlay";
    var modal = createElement("div", sModal);

    var loader = createElement("div", sLoading);
    loader.innerHTML = "<div>Loading Form...</div>";
    loader.style.display = "none";
    modal.appendChild(loader);

    var showLoading = function(msg) {
        if(msg) loader.innerHTML = "<div>" + msg + "</div>";
        loader.style.display = "flex";
    };
    var hideLoading = function() {
        loader.style.display = "none";
    };

    var isDragging = false, startX = 0, startY = 0, initialX = 0, initialY = 0;
    var header = createElement("div", sHeader);
    var headerTitle = createElement("span");
    headerTitle.textContent = "QA Form Tool";
    header.appendChild(headerTitle);

    // Tools Icon & Menu
    var toolsContainer = createElement("div");
    toolsContainer.style.cssText = "position:relative; display:flex; align-items:center; gap: 8px";
    
    var createMenuItem = function(text, onClick, parentMenu) {
        var item = createElement("div");
        item.textContent = text;
        item.style.cssText = "padding:10px 15px; cursor:pointer; font-size:13px; color:#333; border-bottom:1px solid #eee";
        addListener(item, "mouseenter", function(){ item.style.background = "#f5f5f5"; });
        addListener(item, "mouseleave", function(){ item.style.background = "transparent"; });
        addListener(item, "click", function(e){
            e.stopPropagation();
            if(parentMenu) parentMenu.style.display = "none";
            onClick();
        });
        return item;
    };

    // --- AI Tools Button ---
    var btnAiTools = createElement("span");
    btnAiTools.textContent = "🛠️";
    btnAiTools.title = "Tools";
    btnAiTools.style.cssText = "cursor:pointer; font-size:16px; padding:4px; border-radius:4px; transition:background 0.2s";
    addListener(btnAiTools, "mouseenter", function(){ btnAiTools.style.background = "rgba(0,0,0,0.05)"; });
    addListener(btnAiTools, "mouseleave", function(){ btnAiTools.style.background = "transparent"; });

    var aiToolsMenu = createElement("div");
    aiToolsMenu.style.cssText = "position:absolute; top:100%; right:30px; background:white; border:1px solid #ccc; border-radius:4px; box-shadow:0 4px 12px rgba(0,0,0,0.15); display:none; flex-direction:column; min-width:180px; z-index:100001; margin-top:5px";

    // --- Settings Button ---
    var btnTools = createElement("span");
    btnTools.textContent = "⚙️";
    btnTools.title = "Settings";
    btnTools.style.cssText = "cursor:pointer; font-size:16px; padding:4px; border-radius:4px; transition:background 0.2s";
    addListener(btnTools, "mouseenter", function(){ btnTools.style.background = "rgba(0,0,0,0.05)"; });
    addListener(btnTools, "mouseleave", function(){ btnTools.style.background = "transparent"; });

    var toolsMenu = createElement("div");
    toolsMenu.style.cssText = "position:absolute; top:100%; right:0; background:white; border:1px solid #ccc; border-radius:4px; box-shadow:0 4px 12px rgba(0,0,0,0.15); display:none; flex-direction:column; min-width:180px; z-index:100001; margin-top:5px";

    var showSettingsModal = function(title, featureKey, promptPlaceholder) {
        var pOverlay = createElement("div", sOverlay + "; z-index:100002; background:transparent");
        pOverlay.style.pointerEvents = "none";
        pOverlay.style.alignItems = "center"; 
        
        var pModal = createElement("div", sModal + "; height:auto; max-height:85vh; width:500px; cursor:default; user-select:auto; display:flex; flex-direction:column; overflow:visible");
        
        var pHeader = createElement("div", sHeader + "; cursor:move"); 
        pHeader.innerHTML = "<span>" + title + "</span>";
        var pClose = createElement("span", "cursor:pointer; font-size:18px; color:#999");
        pClose.textContent = "×";
        addListener(pClose, "click", function(){ pOverlay.remove(); });
        pHeader.appendChild(pClose);
        
        var pBody = createElement("div", "padding:20px; flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:15px");
        
        // Model Input
        var grpModel = createElement("div");
        var lblModel = createElement("label", sLabel);
        lblModel.textContent = "Gemini Model (e.g. gemini-2.5-flash)";
        var inpModel = createElement("input", sInput);
        grpModel.appendChild(lblModel);
        grpModel.appendChild(inpModel);
        pBody.appendChild(grpModel);

        // Prompt Textarea
        var grpPrompt = createElement("div");
        var lblPrompt = createElement("label", sLabel);
        lblPrompt.textContent = "Prompt Template";
        var txtPrompt = createElement("textarea", sTextarea + "; height:200px");
        txtPrompt.placeholder = promptPlaceholder;
        grpPrompt.appendChild(lblPrompt);
        grpPrompt.appendChild(txtPrompt);
        pBody.appendChild(grpPrompt);

        // Fetch existing config
        inpModel.disabled = true;
        txtPrompt.disabled = true;
        fetch(API_BASE_URL + '/api/ai-config?feature_key=' + featureKey)
            .then(function(res){ return res.json(); })
            .then(function(data){
                if(data.success && data.data) {
                    inpModel.value = data.data.model_name || 'gemini-2.5-flash';
                    txtPrompt.value = data.data.prompt_template || '';
                } else {
                     inpModel.value = 'gemini-2.5-flash';
                }
            })
            .catch(function(e){ console.error(e); showToast("Failed to load settings", true); })
            .finally(function(){
                inpModel.disabled = false;
                txtPrompt.disabled = false;
            });

        var pFooter = createElement("div", sFooter);
        var pBtnSave = createElement("button", sBtnGenerate);
        pBtnSave.textContent = "Save Configuration";
        addListener(pBtnSave, "click", function(){
            pBtnSave.disabled = true;
            pBtnSave.textContent = "Saving...";
            
            fetch(API_BASE_URL + '/api/ai-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    feature_key: featureKey,
                    model_name: inpModel.value,
                    prompt_template: txtPrompt.value
                })
            })
            .then(function(res){ return res.json(); })
            .then(function(data){
                if(data.success) {
                    showToast("Settings saved!", false);
                    setTimeout(function(){ pOverlay.remove(); }, 1000);
                } else {
                    throw new Error(data.error || "Save failed");
                }
            })
            .catch(function(e){
                showToast(e.message, true);
                pBtnSave.disabled = false;
                pBtnSave.textContent = "Save Configuration";
            });
        });
        
        pFooter.appendChild(pBtnSave);

        pModal.appendChild(pHeader);
        pModal.appendChild(pBody);
        pModal.appendChild(pFooter);
        pOverlay.appendChild(pModal);
        document.body.appendChild(pOverlay);

        // Drag Logic for this modal
        var isPDragging = false, pStartX = 0, pStartY = 0, pInitialX = 0, pInitialY = 0;
        
        addListener(pHeader, "mousedown", function(e){
            if(e.target === pHeader || e.target.parentNode === pHeader || e.target.tagName === 'SPAN') {
                if(e.target === pClose) return; 
                isPDragging = true;
                pStartX = e.clientX - pInitialX;
                pStartY = e.clientY - pInitialY;
                pHeader.style.cursor = "grabbing";
            }
        });

        addListener(document, "mousemove", function(e){
            if(isPDragging) {
                e.preventDefault();
                pInitialX = e.clientX - pStartX;
                pInitialY = e.clientY - pStartY;
                pModal.style.transform = "translate(" + pInitialX + "px, " + pInitialY + "px)";
            }
        });

        addListener(document, "mouseup", function(){
            isPDragging = false;
            pHeader.style.cursor = "move";
        });
    };

    var showDictionaryModal = function() {
        var pOverlay = createElement("div", sOverlay + "; z-index:100002; background:transparent");
        pOverlay.style.pointerEvents = "none";
        pOverlay.style.alignItems = "center"; 
        
        var pModal = createElement("div", sModal + "; height:70vh; max-height:600px; width:600px; cursor:default; user-select:auto; display:flex; flex-direction:column; overflow:visible");
        
        var pHeader = createElement("div", sHeader + "; cursor:move"); 
        pHeader.innerHTML = "<span>Dictionary / Glossary</span>";
        var pClose = createElement("span", "cursor:pointer; font-size:18px; color:#999");
        pClose.textContent = "×";
        addListener(pClose, "click", function(){ pOverlay.remove(); });
        pHeader.appendChild(pClose);
        
        var pBody = createElement("div", "padding:20px; flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:10px");
        
        // Add New Term Section
        var addContainer = createElement("div", "display:grid; grid-template-columns: 1fr 2fr auto; gap:10px; padding-bottom:15px; border-bottom:1px solid #eee; margin-bottom:10px");
        var inpTerm = createElement("input", sInput);
        inpTerm.placeholder = "Term (e.g. 'CSR')";
        var inpDef = createElement("input", sInput);
        inpDef.placeholder = "Definition (optional)";
        var btnAdd = createElement("button", sBtnGenerate);
        btnAdd.textContent = "Add";
        btnAdd.style.padding = "8px 12px";
        
        addContainer.appendChild(inpTerm);
        addContainer.appendChild(inpDef);
        addContainer.appendChild(btnAdd);
        pBody.appendChild(addContainer);

        var listContainer = createElement("div", "display:flex; flex-direction:column; gap:8px");
        pBody.appendChild(listContainer);

        var loadTerms = function() {
            listContainer.innerHTML = "Loading...";
            fetch(API_BASE_URL + '/api/dictionary')
                .then(function(res){ return res.json(); })
                .then(function(data){
                    listContainer.innerHTML = "";
                    if(data.success && data.data) {
                        if(data.data.length === 0) {
                            listContainer.innerHTML = "<div style='color:#999;font-style:italic;text-align:center'>No terms defined yet.</div>";
                        }
                        data.data.forEach(function(item){
                            var row = createElement("div", "display:grid; grid-template-columns: 1fr 2fr auto; gap:10px; align-items:center; padding:8px; background:#f9fafb; border-radius:4px; border:1px solid #eee");
                            
                            var termSpan = createElement("span", "font-weight:600; color:#333");
                            termSpan.textContent = item.term;
                            
                            var defSpan = createElement("span", "color:#555; font-size:13px");
                            defSpan.textContent = item.definition || "-";
                            
                            var delBtn = createElement("span", "cursor:pointer; color:#ef4444; font-size:16px; opacity:0.6");
                            delBtn.textContent = "🗑️";
                            delBtn.title = "Delete Term";
                            addListener(delBtn, "mouseenter", function(){ delBtn.style.opacity = "1"; });
                            addListener(delBtn, "mouseleave", function(){ delBtn.style.opacity = "0.6"; });
                            
                            addListener(delBtn, "click", function(){
                                if(confirm("Delete '" + item.term + "'?")) {
                                    fetch(API_BASE_URL + '/api/dictionary?id=' + item.id, { method: 'DELETE' })
                                        .then(function(){ loadTerms(); })
                                        .catch(function(e){ showToast("Delete failed", true); });
                                }
                            });

                            row.appendChild(termSpan);
                            row.appendChild(defSpan);
                            row.appendChild(delBtn);
                            listContainer.appendChild(row);
                        });
                    }
                })
                .catch(function(e){ listContainer.innerHTML = "Error loading terms."; });
        };

        addListener(btnAdd, "click", function(){
            var term = inpTerm.value.trim();
            var def = inpDef.value.trim();
            if(!term) return;
            
            btnAdd.disabled = true;
            btnAdd.textContent = "...";
            
            fetch(API_BASE_URL + '/api/dictionary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ term: term, definition: def })
            })
            .then(function(res){ return res.json(); })
            .then(function(data){
                if(data.success) {
                    inpTerm.value = "";
                    inpDef.value = "";
                    loadTerms();
                } else {
                    showToast("Add failed: " + (data.error || "Unknown error"), true);
                }
            })
            .catch(function(e){ showToast("Add failed", true); })
            .finally(function(){ 
                btnAdd.disabled = false; 
                btnAdd.textContent = "Add";
            });
        });

        loadTerms();

        pModal.appendChild(pHeader);
        pModal.appendChild(pBody);
        pOverlay.appendChild(pModal);
        document.body.appendChild(pOverlay);

        // Drag Logic
        var isDDragging = false, dStartX = 0, dStartY = 0, dInitialX = 0, dInitialY = 0;
        addListener(pHeader, "mousedown", function(e){
            if(e.target === pHeader || e.target.parentNode === pHeader || e.target.tagName === 'SPAN') {
                if(e.target === pClose) return; 
                isDDragging = true;
                dStartX = e.clientX - dInitialX;
                dStartY = e.clientY - dInitialY;
                pHeader.style.cursor = "grabbing";
            }
        });
        addListener(document, "mousemove", function(e){
            if(isDDragging) {
                e.preventDefault();
                dInitialX = e.clientX - dStartX;
                dInitialY = e.clientY - dStartY;
                pModal.style.transform = "translate(" + dInitialX + "px, " + dInitialY + "px)";
            }
        });
        addListener(document, "mouseup", function(){
            isDDragging = false;
            pHeader.style.cursor = "move";
        });
    };

    var showCaseNotesCheckerModal = function() {
        var pOverlay = createElement("div", sOverlay + "; z-index:100002; background:transparent");
        pOverlay.style.pointerEvents = "none";
        pOverlay.style.alignItems = "center"; 
        
        var pModal = createElement("div", sModal + "; height:auto; max-height:85vh; width:600px; cursor:default; user-select:auto; display:flex; flex-direction:column; overflow:visible");
        
        var pHeader = createElement("div", sHeader + "; cursor:move"); 
        pHeader.innerHTML = "<span>Case Notes Checker</span>";
        var pClose = createElement("span", "cursor:pointer; font-size:18px; color:#999");
        pClose.textContent = "×";
        addListener(pClose, "click", function(){ pOverlay.remove(); });
        pHeader.appendChild(pClose);
        
        var pBody = createElement("div", "padding:20px; flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:15px");
        
        var createAccordion = function(title, contentNodes, isOpen) {
            var container = createElement("div");
            container.style.cssText = "border:1px solid #e0e0e0; border-radius:4px; margin-bottom:10px; overflow:hidden";
            
            var header = createElement("div");
            header.style.cssText = "padding:10px 15px; background:#f5f5f5; cursor:pointer; font-weight:600; display:flex; justify-content:space-between; align-items:center; user-select:none";
            header.innerHTML = "<span>" + title + "</span><span style='font-size:12px'>" + (isOpen ? "▲" : "▼") + "</span>";
            
            var body = createElement("div");
            body.style.cssText = "padding:15px; border-top:1px solid #e0e0e0; display:" + (isOpen ? "block" : "none");
            
            if(Array.isArray(contentNodes)) {
                contentNodes.forEach(function(n) { body.appendChild(n); });
            } else {
                body.appendChild(contentNodes);
            }
            
            addListener(header, "click", function() {
                var isHidden = body.style.display === "none";
                body.style.display = isHidden ? "block" : "none";
                header.lastChild.textContent = isHidden ? "▲" : "▼";
            });
            
            container.appendChild(header);
            container.appendChild(body);
            return { container: container, body: body };
        };

        // --- Input Section ---
        var divInputs = createElement("div", "display:flex; flex-direction:column; gap:15px; max-height:300px; overflow-y:auto; padding-right:5px");
        
        var grpSubject = createElement("div");
        var lblSubject = createElement("label", sLabel);
        lblSubject.textContent = "Subject Line";
        var inpSubject = createElement("input", sInput);
        inpSubject.placeholder = "Enter Subject Line...";
        grpSubject.appendChild(lblSubject);
        grpSubject.appendChild(inpSubject);
        divInputs.appendChild(grpSubject);

        var grpNotes = createElement("div");
        var lblNotes = createElement("label", sLabel);
        lblNotes.textContent = "Case Notes";
        var txtNotes = createElement("textarea", sTextarea + "; height:200px");
        txtNotes.placeholder = "Paste Case Notes here...";
        grpNotes.appendChild(lblNotes);
        grpNotes.appendChild(txtNotes);
        divInputs.appendChild(grpNotes);
        
        var inputAccordion = createAccordion("Input Data", divInputs, true);
        pBody.appendChild(inputAccordion.container);

        // --- Output Section ---
        var divOutput = createElement("div");
        divOutput.style.cssText = "max-height:400px; overflow-y:auto; font-family:inherit; font-size:13px; line-height:1.5; color:#333; padding-right:5px";
        
        var resPlaceholder = createElement("div");
        resPlaceholder.innerHTML = "<div style='color:#999; font-style:italic; padding:20px; text-align:center; background:#f9fafb; border-radius:4px; border:1px dashed #ccc'>Generated analysis will appear here...</div>";
        divOutput.appendChild(resPlaceholder);
        
        var outputAccordion = createAccordion("Analysis Results", divOutput, true);
        pBody.appendChild(outputAccordion.container);

        var pFooter = createElement("div", sFooter);
        var pBtnGen = createElement("button", sBtnGenerate);
        pBtnGen.textContent = "Generate";
        
        addListener(pBtnGen, "click", function(){
            var transcript = extractTranscript();
            var subject = inpSubject.value.trim();
            var notes = txtNotes.value.trim();

            if(!transcript) return showToast("No transcript found on page", true);
            if(!subject) return showToast("Subject Line is required", true);
            if(!notes) return showToast("Case Notes are required", true);

            pBtnGen.disabled = true;
            pBtnGen.textContent = "Generating... ⏳";
            resPlaceholder.innerHTML = "<div style='padding:20px; text-align:center; color:#666'>🚀 AI is analyzing your notes...</div>";

            // Collapse input accordion to show more output
            inputAccordion.body.style.display = "none";
            inputAccordion.container.firstChild.lastChild.textContent = "▼";

            fetch(API_BASE_URL + '/api/case-notes-checker', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript: transcript, subject: subject, notes: notes })
            })
            .then(function(res){ return res.json(); })
            .then(function(data){
                if(data.result) {
                    // Use pre-wrap to preserve formatting from AI
                    resPlaceholder.innerHTML = "<div style='white-space:pre-wrap; padding:10px'>" + data.result + "</div>";
                    showToast("Analysis complete!", false);
                } else {
                    throw new Error(data.error || "Analysis failed");
                }
            })
            .catch(function(e){
                showToast(e.message, true);
                resPlaceholder.innerHTML = "<div style='color:#ef4444; padding:20px; text-align:center'>❌ Error: " + e.message + "</div>";
            })
            .finally(function(){
                pBtnGen.disabled = false;
                pBtnGen.textContent = "Generate";
            });
        });
        
        pFooter.appendChild(pBtnGen);

        pModal.appendChild(pHeader);
        pModal.appendChild(pBody);
        pModal.appendChild(pFooter);
        pOverlay.appendChild(pModal);
        document.body.appendChild(pOverlay);

        // Drag Logic
        var isCDragging = false, cStartX = 0, cStartY = 0, cInitialX = 0, cInitialY = 0;
        addListener(pHeader, "mousedown", function(e){
            if(e.target === pHeader || e.target.parentNode === pHeader || e.target.tagName === 'SPAN') {
                if(e.target === pClose) return; 
                isCDragging = true;
                cStartX = e.clientX - cInitialX;
                cStartY = e.clientY - cInitialY;
                pHeader.style.cursor = "grabbing";
            }
        });
        addListener(document, "mousemove", function(e){
            if(isCDragging) {
                e.preventDefault();
                cInitialX = e.clientX - cStartX;
                cInitialY = e.clientY - cStartY;
                pModal.style.transform = "translate(" + cInitialX + "px, " + cInitialY + "px)";
            }
        });
        addListener(document, "mouseup", function(){
            isCDragging = false;
            pHeader.style.cursor = "move";
        });
    };

    aiToolsMenu.appendChild(createMenuItem("Case Notes Checker", showCaseNotesCheckerModal, aiToolsMenu));

    toolsMenu.appendChild(createMenuItem("Issue/Concern Prompt", function() {
        showSettingsModal("Issue/Concern Prompt Settings", "summary", "Enter prompt template. Use {{transcript}} for the transcript placeholder.");
    }, toolsMenu));
    toolsMenu.appendChild(createMenuItem("Case Notes Prompt", function() {
        showSettingsModal("Case Notes Prompt Settings", "case_notes", "Enter prompt template. Use {{subject}} and {{notes}} for placeholders.");
    }, toolsMenu));
    toolsMenu.appendChild(createMenuItem("Dictionary", showDictionaryModal, toolsMenu));
    
    addListener(btnAiTools, "click", function(e){
        e.stopPropagation();
        var isVisible = aiToolsMenu.style.display === "flex";
        aiToolsMenu.style.display = isVisible ? "none" : "flex";
        toolsMenu.style.display = "none";
    });

    addListener(btnTools, "click", function(e){
        e.stopPropagation();
        var isVisible = toolsMenu.style.display === "flex";
        toolsMenu.style.display = isVisible ? "none" : "flex";
        aiToolsMenu.style.display = "none";
    });

    addListener(document, "click", function(){
        toolsMenu.style.display = "none";
        aiToolsMenu.style.display = "none";
    });

    toolsContainer.appendChild(btnAiTools);
    toolsContainer.appendChild(aiToolsMenu);
    toolsContainer.appendChild(btnTools);
    toolsContainer.appendChild(toolsMenu);
    header.appendChild(toolsContainer);

    addListener(header, "mousedown", function(e){
        if(e.target === header || e.target.parentNode === header || e.target === headerTitle) {
            isDragging = true;
            startX = e.clientX - initialX;
            startY = e.clientY - initialY;
            header.style.cursor = "grabbing";
        }
    });
    addListener(document, "mousemove", function(e){
        if(isDragging) {
            initialX = e.clientX - startX;
            initialY = e.clientY - startY;
            modal.style.transform = "translate(" + initialX + "px, " + initialY + "px)";
        }
    });
    addListener(document, "mouseup", function(){
        isDragging = false;
        header.style.cursor = "grab";
    });

    var contentContainer = createElement("div", sContent);

    // Header Fields
    var headerFieldsContainer = createElement("div");
    headerFieldsContainer.style.cssText = "display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:15px;padding-bottom:15px;border-bottom:1px solid #eee";

    var fInteractionId = createCompactField("Interaction ID", "🆔", "text", false, false, getInteractionId());
    var fAdvocateName = createCompactField("Advocate Name", "👤", "text", false, false, getAdvocateName());
    
    // Default ANI/DNIS logic: prefer second option (ANI) if available
    var aniOpts = getAniDnisOptions();
    var defaultAni = (aniOpts.length > 1) ? aniOpts[1] : (aniOpts[0] || "");
    var fCallAni = createCompactField("Call ANI/DNIS", "📞", "text", false, false, defaultAni, aniOpts);
    // If we have options but no initial value set (e.g. empty defaultAni), try setting value
    if(!defaultAni && aniOpts.length > 0) {
        if(fCallAni.input.tagName === 'SELECT') fCallAni.input.value = aniOpts[0];
        else fCallAni.input.value = aniOpts[0];
    }
    // Explicitly set the value if it's a select dropdown to ensure it picks the right one
    if (fCallAni.input.tagName === 'SELECT' && defaultAni) {
        fCallAni.input.value = defaultAni;
    }

    headerFieldsContainer.appendChild(fInteractionId.div);
    headerFieldsContainer.appendChild(fAdvocateName.div);
    headerFieldsContainer.appendChild(fCallAni.div);

    var caseDurationRow = createElement("div");
    caseDurationRow.style.cssText = "grid-column: 1 / -1; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;";
    var fCaseNumber = createCompactField("Case #", "🔢");
    var fCallDuration = createCompactField("Call Duration", "⏱️", "text", false, false, getCallDuration());
    caseDurationRow.appendChild(fCaseNumber.div);
    caseDurationRow.appendChild(fCallDuration.div);
    headerFieldsContainer.appendChild(caseDurationRow);

    var dateRow = createElement("div");
    dateRow.style.cssText = "grid-column: 1 / -1; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;";
    var fDateInteraction = createCompactField("Date of Interaction", "", "date", false, true);
    var fDateEvaluation = createCompactField("Date of Evaluation", "", "date", false, true);
    fDateEvaluation.input.valueAsDate = new Date();
    dateRow.appendChild(fDateInteraction.div);
    dateRow.appendChild(fDateEvaluation.div);
    headerFieldsContainer.appendChild(dateRow);

    var fCaseCategory = createCompactField("Case Category", "🗂️", "text", true);
    addListener(fCaseCategory.input, "keydown", function(e){
        if(e.key === "Enter" && fCaseCategory.input.value.trim() === "") {
            e.preventDefault();
            fCaseCategory.input.value = "Payroll > ";
        }
    });
    headerFieldsContainer.appendChild(fCaseCategory.div);

    var fIssueConcern = createCompactField("Issue/Concern", "✍️", "textarea", true);
    
    // Summary Button
    var btnSummary = createElement("span");
    btnSummary.textContent = "✨";
    btnSummary.title = "Generate Summary from Transcript";
    btnSummary.style.cssText = "position:absolute; right:8px; top:8px; cursor:pointer; font-size:16px; opacity:0.6; user-select:none; z-index:5";
    
    var issueContainer = fIssueConcern.div.firstChild;
    if(issueContainer) {
        issueContainer.style.position = "relative";
        issueContainer.appendChild(btnSummary);
        addListener(btnSummary, "mouseenter", function(){ btnSummary.style.opacity = "1"; });
        addListener(btnSummary, "mouseleave", function(){ btnSummary.style.opacity = "0.6"; });
        addListener(btnSummary, "click", function(e){
            e.stopPropagation();
            var originalIcon = btnSummary.textContent;
            btnSummary.textContent = "⏳";
            btnSummary.style.cursor = "wait";
            generateSummary().then(function(summary){
                if(summary) {
                    fIssueConcern.input.value = summary;
                    fIssueConcern.input.dispatchEvent(new Event('input'));
                    showToast("Summary generated!", false);
                }
                btnSummary.textContent = originalIcon;
                btnSummary.style.cursor = "pointer";
            });
        });
    }
    headerFieldsContainer.appendChild(fIssueConcern.div);

    contentContainer.appendChild(headerFieldsContainer);

    // Save Logic
    var saveRecord = function() {
        var items = Object.keys(state).map(function(key){
            var s = state[key];
            return {
                item_id: s.id, // Using the stored ID directly
                answer_id: s.sel,
                answer_text: (s.itemType === 'dropdown_custom' || s.itemType === 'dropdown') ? s.options[s.selIndex].label : (s.sel === s.options.filter(function(o){ return o.is_correct; })[0].id ? 'Yes' : 'No'),
                feedback_text: s.text,
                selected_tags: s.selectedTags.map(function(t){ return t.tag_label; })
            };
        });

        var payload = {
            form_id: FORM_ID,
            existing_record_id: existingRecordId,
            header_data: {
                interaction_id: fInteractionId.input.value,
                advocate_name: fAdvocateName.input.value,
                call_ani_dnis: fCallAni.input.value,
                case_number: fCaseNumber.input.value,
                call_duration: fCallDuration.input.value,
                interaction_date: fDateInteraction.input.value,
                evaluation_date: fDateEvaluation.input.value,
                case_category: fCaseCategory.input.value,
                issue_concern: fIssueConcern.input.value,
                page_url: window.location.href
            },
            items: items
        };

        return fetch(API_BASE_URL + '/api/embed/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).then(function(res){ return res.json(); })
        .then(function(data){
            if(data.success) {
                existingRecordId = data.submission_id;
                return true;
            }
            throw new Error(data.error || "Save failed");
        });
    };

    var checkExistingRecord = function() {
        var iId = fInteractionId.input.value.trim();
        if(!iId) return;

        fetch(API_BASE_URL + '/api/embed/check?interaction_id=' + iId + '&form_id=' + FORM_ID)
            .then(function(res){ return res.json(); })
            .then(function(result){
                if(result.data) {
                    var record = result.data;
                    existingRecordId = record.id;
                    
                    if(record.advocate_name) fAdvocateName.input.value = record.advocate_name;
                    if(record.call_ani_dnis) fCallAni.input.value = record.call_ani_dnis;
                    if(record.case_number) fCaseNumber.input.value = record.case_number;
                    if(record.call_duration) fCallDuration.input.value = record.call_duration;
                    if(record.interaction_date) fDateInteraction.input.value = record.interaction_date.split('T')[0];
                    if(record.evaluation_date) fDateEvaluation.input.value = record.evaluation_date.split('T')[0];
                    if(record.case_category) fCaseCategory.input.value = record.case_category;
                    if(record.issue_concern) fIssueConcern.input.value = record.issue_concern;

                    if(record.items) {
                        record.items.forEach(function(rItem){
                            // Find corresponding state key by matching item_id
                            var key = Object.keys(state).find(function(k){ return state[k].id === rItem.item_id; });
                            if(key && state[key]) {
                                state[key].sel = rItem.answer_id;
                                state[key].text = rItem.feedback_text || "";
                                // Find selIndex
                                state[key].selIndex = state[key].options.findIndex(function(o){ return o.id === rItem.answer_id; });
                                if(state[key].selIndex === -1) state[key].selIndex = 0;
                                
                                if(rItem.selected_tags) {
                                    state[key].selectedTags = globalFeedbackTags.filter(function(gt){
                                        return rItem.selected_tags.includes(gt.tag_label) && gt.option_id === rItem.answer_id;
                                    });
                                }
                            }
                        });
                    }
                    refreshAllUI();
                    showToast("Previous evaluation loaded!", false);
                }
            });
    };

    addListener(fInteractionId.input, 'blur', checkExistingRecord);

    // Footer
    var footer = createElement("div", sFooter);
    var btnCancel = createElement("button", sBtnCancel);
    btnCancel.textContent = "Cancel";
    addListener(btnCancel, "click", function(){ overlay.remove(); });

    var btnSaveOnly = createElement("button", sBtnGenerate);
    btnSaveOnly.textContent = "Save";
    btnSaveOnly.style.backgroundColor = "#059669";
    addListener(btnSaveOnly, "click", function(){
        btnSaveOnly.disabled = true;
        btnSaveOnly.textContent = "Saving...";
        saveRecord().then(function(){
            showToast("Saved Successfully!", false);
        }).catch(function(e){
            showToast(e.message, true);
        }).finally(function(){
            btnSaveOnly.disabled = false;
            btnSaveOnly.textContent = "Save";
        });
    });

    var btnGenerateOnly = createElement("button", sBtnGenerate);
    btnGenerateOnly.textContent = "Generate";
    btnGenerateOnly.style.backgroundColor = "#4f46e5";

    var btnGenerate = createElement("button", sBtnGenerate);
    btnGenerate.textContent = "Generate & Save";

    var handleGeneration = function(saveToDb) {
        var activeBtn = saveToDb ? btnGenerate : btnGenerateOnly;
        var originalText = activeBtn.textContent;
        activeBtn.textContent = "Generating... ⏳";

        [btnGenerate, btnGenerateOnly, btnSaveOnly, btnCancel].forEach(function(b){
            b.disabled = true;
            b.style.opacity = "0.7";
            b.style.cursor = "not-allowed";
        });

        var allKeys = Object.keys(state);
        var checkedKeys = allKeys.filter(function(k){ return state[k].checked; });
        var targetKeys = checkedKeys.length > 0 ? checkedKeys : allKeys;

        var index = 0;
        var processNext = function() {
            if(index >= targetKeys.length) {
                if(saveToDb) {
                                            saveRecord().then(function(){
                                                activeBtn.textContent = originalText;
                                                [btnGenerate, btnGenerateOnly, btnSaveOnly, btnCancel].forEach(function(b){
                                                    b.disabled = false;
                                                    b.style.opacity = "1";
                                                    b.style.cursor = "pointer";
                                                });
                                                showToast("Generated and Saved!", false);
                                                // Close the modal after a short delay if it was a Generate & Save action
                                                setTimeout(function() {
                                                    overlay.remove();
                                                }, 1500);
                                            }).catch(function(e){                        showToast("Generated, but save failed: " + e.message, true);
                        activeBtn.textContent = originalText;
                        [btnGenerate, btnGenerateOnly, btnSaveOnly, btnCancel].forEach(function(b){
                            b.disabled = false;
                            b.style.opacity = "1";
                        });
                    });
                } else {
                    activeBtn.textContent = originalText;
                    [btnGenerate, btnGenerateOnly, btnSaveOnly, btnCancel].forEach(function(b){
                        b.disabled = false;
                        b.style.opacity = "1";
                        b.style.cursor = "pointer";
                    });
                    showToast("Generated successfully!", false);
                }
                return;
            }

            var key = targetKeys[index];
            var s = state[key];
            var container = findGroupContainer(s.groupName);

            if(container) {
                var question = container.querySelector('[data-idx="' + s.itemId + '"]');
                
                if(question) {
                    var control = question.querySelector('[data-testid="SegmentedControl"]');
                    if(control) {
                        var buttons = Array.from(control.querySelectorAll('button'));
                        if(s.itemType === 'dropdown_custom' || s.itemType === 'dropdown') {
                            if(buttons[s.selIndex]) buttons[s.selIndex].click();
                        } else {
                            var btnIdx = s.options.findIndex(function(o){ return o.id === s.sel; });
                            if(btnIdx !== -1 && buttons[btnIdx]) {
                                buttons[btnIdx].click();
                            }
                        }
                    }

                    setTimeout(function(){
                        container = findGroupContainer(s.groupName);
                        var freshQuestion = container ? container.querySelector('[data-idx="' + s.itemId + '"]') : null;

                        if(freshQuestion) {
                            var finalText = s.text.trim();
                            if(finalText) {
                                var txtArea = freshQuestion.querySelector('textarea');
                                if(txtArea) {
                                    var proto = Object.getPrototypeOf(txtArea);
                                    var setter = Object.getOwnPropertyDescriptor(proto, "value").set;
                                    if(setter) setter.call(txtArea, finalText); 
                                    else txtArea.value = finalText;
                                    txtArea.dispatchEvent(new Event("input", { bubbles: true }));
                                    txtArea.dispatchEvent(new Event("change", { bubbles: true }));
                                }
                            }
                        }

                        setTimeout(function(){
                            index++;
                            processNext();
                        }, 500);
                    }, 1500);
                    return;
                }
            }

            index++;
            processNext();
        };
        processNext();
    };

    addListener(btnGenerate, "click", function(){ handleGeneration(true); });
    addListener(btnGenerateOnly, "click", function(){ handleGeneration(false); });

    footer.appendChild(btnCancel);
    footer.appendChild(btnSaveOnly);
    footer.appendChild(btnGenerateOnly);
    footer.appendChild(btnGenerate);

    modal.appendChild(header);
    modal.appendChild(contentContainer);
    modal.appendChild(footer);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    showLoading("Loading Form...");
    // Fetch and render form
    fetch(API_BASE_URL + '/api/embed/form/' + FORM_ID)
        .then(function(response) {
            if (!response.ok) throw new Error('Failed to load form: ' + response.status);
            return response.json();
        })
        .then(function(data) {
            if (data.error) throw new Error(data.error);
            
            globalStructure = data.structure;
            globalFeedbackGeneral = [];
            globalFeedbackTags = [];

            // Flatten feedback templates for easier lookup
            globalStructure.forEach(function(group){
                group.items.forEach(function(item){
                    item.options.forEach(function(opt){
                        if(opt.feedback_general) {
                            globalFeedbackGeneral = globalFeedbackGeneral.concat(opt.feedback_general);
                        }
                        if(opt.feedback_tags) {
                            globalFeedbackTags = globalFeedbackTags.concat(opt.feedback_tags);
                        }
                    });
                });
            });

            // Initialize state
            if (globalStructure && Array.isArray(globalStructure)) {
                globalStructure.forEach(function(group){
                    if (!group.items) return;
                    group.items.forEach(function(item){
                        var key = group.id + ":" + item.id;
                        var options = item.options || [];
                        var defaultOpt = options.filter(function(o){ return o.is_default; })[0] || options[0];
                        
                        state[key] = {
                            id: item.id,
                            sel: defaultOpt ? defaultOpt.id : null,
                            selIndex: defaultOpt ? options.indexOf(defaultOpt) : 0,
                            text: "",
                            checked: false,
                            groupName: group.title,
                            itemId: (item.order_index || 0) + 1,
                            itemType: item.item_type,
                            options: options,
                            selectedTags: [],
                            domTextarea: null,
                            refreshUI: null
                        };
                        updateText(key);
                    });
                });
            }

            // Render groups
            if (globalStructure && Array.isArray(globalStructure)) {
                globalStructure.forEach(function(group){
                    var groupTitle = createElement("div", sGroupHeader);
                    groupTitle.textContent = group.title;
                    contentContainer.appendChild(groupTitle);

                    if (!group.items) return;
                    group.items.forEach(function(item){
                        var key = group.id + ":" + item.id;
                        var itemContainer = createElement("div", sItemContainer);
                        var itemHeader = createElement("div", sItemHeader);
                        var leftGroup = createElement("div");
                        leftGroup.style.cssText = "display:flex;align-items:center;gap:10px";

                        var checkbox = createElement("input");
                        checkbox.type = "checkbox";
                        checkbox.style.cursor = "pointer";
                        addListener(checkbox, "click", function(e){ 
                            e.stopPropagation(); 
                            state[key].checked = e.target.checked; 
                        });

                        var label = createElement("span");
                        var cleanText = (item.short_name || item.question_text).replace(/^\d+\.\s*/, "");
                        label.textContent = (item.order_index + 1) + ". " + cleanText;
                        leftGroup.appendChild(checkbox);
                        leftGroup.appendChild(label);

                        var arrow = createElement("span");
                        arrow.style.fontSize = "10px";
                        arrow.textContent = "▼";
                        itemHeader.appendChild(leftGroup);
                        itemHeader.appendChild(arrow);

                        var expanded = false;
                        var itemBody = createElement("div", sItemBody);
                        var tagContainer = createElement("div", sTagContainer);

                        var updateHeaderBg = function() {
                            var theme = getTheme(item, state[key].sel);
                            var cols = getColors(theme);
                            itemHeader.style.background = cols.header;
                        };

                        var renderTags = function() {
                            tagContainer.innerHTML = "";
                            var currentSel = state[key].sel;
                            var relevantTags = globalFeedbackTags.filter(function(t){ 
                                return t.option_id === currentSel; 
                            });

                            relevantTags.forEach(function(tagData){
                                var tagBtn = createElement("div");
                                var theme = getTheme(item, currentSel);
                                var cols = getColors(theme);
                                var isActive = state[key].selectedTags.some(function(t){ return t.id === tagData.id; });
                                
                                if(isActive) {
                                    tagBtn.style.cssText = "padding:4px 8px;border:1px solid " + cols.border + ";border-radius:12px;font-size:11px;cursor:pointer;background:" + cols.bg + ";color:" + cols.txt + ";font-weight:500;transition:all 0.2s";
                                } else {
                                    tagBtn.style.cssText = "padding:4px 8px;border:1px solid #ccc;border-radius:12px;font-size:11px;cursor:pointer;background:#f9fafb;color:#333;transition:all 0.2s";
                                }
                                tagBtn.textContent = tagData.tag_label;

                                addListener(tagBtn, "click", function(){
                                    if(isActive) {
                                        state[key].selectedTags = state[key].selectedTags.filter(function(t){ return t.id !== tagData.id; });
                                    } else {
                                        state[key].selectedTags.push(tagData);
                                    }
                                    renderTags();
                                    updateHeaderBg();
                                    updateText(key);
                                });
                                tagContainer.appendChild(tagBtn);
                            });
                        };

                        if(item.item_type === 'dropdown_custom' || item.item_type === 'dropdown') {
                            var select = createElement("select", sSelect);
                            item.options.forEach(function(opt, idx){
                                var o = createElement("option");
                                o.value = idx;
                                o.textContent = opt.label;
                                if(idx === state[key].selIndex) o.selected = true;
                                select.appendChild(o);
                            });

                            state[key].refreshUI = function() {
                                select.value = state[key].selIndex;
                                checkbox.checked = state[key].checked;
                                renderTags();
                                updateHeaderBg();
                            };

                            addListener(select, "change", function(e){
                                state[key].selIndex = parseInt(e.target.value);
                                state[key].sel = item.options[state[key].selIndex].id;
                                state[key].selectedTags = [];
                                renderTags();
                                updateHeaderBg();
                                updateText(key);
                            });
                            itemBody.appendChild(select);
                        } else {
                            var btnGroup = createElement("div", sBtnGroup);
                            var optionButtons = [];

                            item.options.forEach(function(opt){
                                var btn = createElement("button");
                                btn.textContent = opt.label;
                                // Initial base style
                                btn.style.cssText = sBtnBase;
                                
                                addListener(btn, "click", function(){
                                    state[key].sel = opt.id; 
                                    state[key].selectedTags = []; 
                                    updateBtnStyles(); 
                                    renderTags(); 
                                    updateHeaderBg(); 
                                    updateText(key); 
                                });
                                
                                btnGroup.appendChild(btn);
                                optionButtons.push({ dom: btn, id: opt.id });
                            });

                            var updateBtnStyles = function() {
                                var val = state[key].sel;
                                var theme = getTheme(item, val);
                                var cols = getColors(theme);
                                var activeStyle = sBtnBase + ";background:" + cols.bg + ";color:" + cols.txt + ";border-color:" + cols.border;
                                var inactiveStyle = sBtnBase + ";background:white;color:#333;border-color:#ccc";

                                optionButtons.forEach(function(b){
                                    if(b.id === val) {
                                        b.dom.style.cssText = activeStyle;
                                    } else {
                                        b.dom.style.cssText = inactiveStyle;
                                    }
                                });
                            };

                            state[key].refreshUI = function() {
                                updateBtnStyles();
                                checkbox.checked = state[key].checked;
                                renderTags();
                                updateHeaderBg();
                            };

                            updateBtnStyles();
                            itemBody.appendChild(btnGroup);
                        }

                        itemBody.appendChild(tagContainer);

                        var textarea = createElement("textarea", sTextarea);
                        state[key].domTextarea = textarea;
                        textarea.placeholder = "Comments...";
                        addListener(textarea, "input", function(e){
                            state[key].text = e.target.value;
                            updateHeaderBg();
                        });
                        itemBody.appendChild(textarea);
                        
                        // Populate initial feedback immediately
                        updateText(key);

                        addListener(itemHeader, "click", function(){
                            expanded = !expanded;
                            itemBody.style.display = expanded ? "block" : "none";
                            updateHeaderBg();
                            arrow.textContent = expanded ? "▲" : "▼";
                            if(expanded) renderTags();
                        });

                        itemContainer.appendChild(itemHeader);
                        itemContainer.appendChild(itemBody);
                        contentContainer.appendChild(itemContainer);
                        
                        // Initial update for header background
                        updateHeaderBg();
                    });
                  });
                }

                // After everything is loaded, try to check for existing record if ID is present
                if(fInteractionId.input.value) checkExistingRecord();

        }).catch(function(err){
            console.error(err);
            showToast("Error loading form structure", true);
        }).finally(function() {
            hideLoading();
        });
})();