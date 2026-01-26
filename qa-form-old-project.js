(function(){
  if(document.getElementById('qa-modal-overlay')) return;

  var SUPABASE_URL = 'https://gmawsnjwdeefwzradbzn.supabase.co';
    var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtYXdzbmp3ZGVlZnd6cmFkYnpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4MjY2MzEsImV4cCI6MjA4MzQwMjYzMX0.TurtWcLSXyx25IiPFXlly7FPWOn3nCcbzmZGJzI_1nI';
    
  // 

  const groups = [
    {
      name: "AQM",
      items: [
        {id:1,label:"Greeting",reverse:!1},
        {id:2,label:"Cx's Name",reverse:!1},
        {id:3,label:"Business Name",reverse:!1},
        {id:4,label:"Callback",reverse:!1},
        {id:5,label:"Closing",reverse:!1},
        {id:6,label:"Poor Listening",reverse:!0},
        {id:7,label:"Appropriate Tone",reverse:!1},
        {id:8,label:"Poor Call Control",reverse:!0},
        {id:9,label:"Empathy",reverse:!1},
        {id:10,label:"Confirm Solution",reverse:!1}
      ]
    },
    {
      name: "Case Management",
      items: [
        {id:1,label:"Resolution",reverse:!1},
        {id:2,label:"Escalation",reverse:!1},
        {id:3,label:"Failed Follow-up",reverse:!0},
        {id:4,label:"Out of Context Article",reverse:!0},
        {id:5,label:"Reach-out (8h)",reverse:!1},
        {id:6,label:"Expectations",reverse:!1},
        {id:7,label:"Wrong Contact Method",reverse:!0},
        {id:8,label:"Written Comm",reverse:!1},
        {id:9,label:"Internal Comm",reverse:!1},
        {id:10,label:"1case1issue",reverse:!1},
        {id:11,label:"Case Notes",reverse:!1},
        {id:12,label:"Account Info",reverse:!1},
        {id:13,label:"Expert Needed",options:['Yes', 'No', 'N/A']},
        {id:14,label:"Incorrect Case Staging",options:['No - staged correctly', 'Yes - pending cx instead of pending care', 'Yes - pending care instead of pending cx', 'Yes - res proposed (instead of pending cx)', 'Yes - res proposed (instead of pending Care)', "Yes - merged case when shouldn't have"]},
        {id:15,label:"Mistreat/Avoid",options:['No', 'Yes - Rude to Cx', 'Yes - False phone interactions', 'Yes - hung up on cx', 'Yes - excessive holds (caused cx to hang up)', 'Yes - Denied Transfer', 'Yes - Survey Avoidance', 'Yes - Case Avoidance (assigned case, then sent back to same queue with no notes or adjustment to subject line)', 'Yes - Case Avoidance (Case set to Resolution Proposed, without solving the issue)', 'Yes-Changes made without asking for POS code', 'Yes -Changes made without asking for SSN (payroll only)', 'Yes - Verification Process not followed (fraud) ']},
        {id:16,label:"Temp Start",options:['Churn', 'Upset', 'Neutral', 'Happy']},
        {id:17,label:"Temp End",options:['Churn', 'Upset', 'Neutral', 'Happy']},
        {id:18,label:"Temp Worsen",reverse:!1},
        {id:19,label:"Complexity",options:['Training Opportunities (basic)', 'HW/SW troubleshooting (basic)', 'Non-intuitive/not understanding how something works', 'Something is broken/RF', 'Really complicated issue', 'Follow up on another case', 'Simple Task for Care or Team outside of Care', 'Complex Process', 'Feature Request']},
        {id:20,label:"Related Cases",options:['1', '2', '3', '4', '5', '6', '7', '8', '9', '10+']},
        {id:21,label:"Case Owners",options:['1', '2', '3', '4', '5', '6', '7', '8', '9', '10+']},
        {id:22,label:"Root Cause",options:['In Progress - Waiting on Other team', 'Improperly Escalated', 'Work Avoidance', 'Unclear Policy/Process', 'Simple Knowledge Gap', 'Complex Knowledge Gap', 'N/A']}
      ]
    }
  ];

  const state = {};
  // Initialize state
  groups.forEach(g => {
    g.items.forEach(item => {
      const key = `${g.name}-${item.id}`;
      let defaultSel = item.options ? 0 : "yes"; 
      if (item.label === "Expert Needed") defaultSel = 2;
      if (item.label === "Temp Start" || item.label === "Temp End") defaultSel = 2;
      if (item.label === "Temp Worsen") defaultSel = "no";
      if (item.label === "Complexity") defaultSel = 6;
      if (item.label === "Root Cause") defaultSel = 6;

      state[key] = { 
        sel: defaultSel, 
        text: "", 
        checked: false,
        groupName: g.name,
        itemId: item.id,
        itemType: item.options ? 'select' : 'toggle',
        selectedTags: [],
        domTextarea: null,
        // Helper to refresh UI when state changes programmatically
        refreshUI: null 
      };
    });
  });

  let globalTags = [];
  let globalDefaults = {};
  let existingRecordId = null; // Track if we are editing an existing record

  const updateText = (key) => {
    const s = state[key];
    if(!s.domTextarea) return;
    
    let txt = "";
    if(s.selectedTags.length > 0) {
        txt = s.selectedTags.map(t => t.tag_feedback).join(" ");
    } else {
        const lookupKey = `${s.groupName}-${s.itemId}-${s.sel}`;
        txt = globalDefaults[lookupKey] || "";
    }
    
    s.text = txt;
    s.domTextarea.value = txt;
    s.domTextarea.dispatchEvent(new Event('input'));
  };
  
  // This function forces the UI to match the current 'state' object
  const refreshAllUI = () => {
      Object.keys(state).forEach(key => {
          if(state[key].refreshUI) state[key].refreshUI();
          if(state[key].domTextarea) {
              state[key].domTextarea.value = state[key].text;
          }
      });
  };

  const initData = async () => {
    try {
        const respDefs = await fetch(`${SUPABASE_URL}/rest/v1/qa_defaults?select=*`, {
            headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
        });
        const dataDefs = await respDefs.json();
        dataDefs.forEach(row => {
            const key = `${row.group_name}-${row.item_id}-${row.response_value}`;
            globalDefaults[key] = row.feedback_text;
        });

        const respTags = await fetch(`${SUPABASE_URL}/rest/v1/qa_tags?select=*`, {
            headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
        });
        globalTags = await respTags.json();
        
        // Initial defaults population (only if not loaded from DB yet)
        if(!existingRecordId) {
            Object.keys(state).forEach(key => updateText(key));
        }

        document.dispatchEvent(new Event('qa-data-loaded'));
        
        // Now check for existing record
        checkExistingRecord();
        
    } catch (e) {
        console.error("Supabase fetch failed:", e);
    }
  };

  const createElement = (tag, css) => {
    const el = document.createElement(tag);
    if(css) el.style.cssText = css;
    return el;
  };

  const addListener = (el, event, handler) => {
    el.addEventListener(event, handler);
  };

  // Colors
  const C_GREEN_BG = "#dcfce7"; const C_GREEN_TXT = "#14532d"; const C_GREEN_BORDER = "#15803d";
  const C_RED_BG = "#fee2e2"; const C_RED_TXT = "#7f1d1d"; const C_RED_BORDER = "#b91c1c";
  const C_GRAY_BG = "#f3f4f6"; const C_GRAY_TXT = "#374151"; const C_GRAY_BORDER = "#9ca3af";
  const C_HEADER_GREEN = "#f0fdf4";
  const C_HEADER_RED = "#fef2f2";
  const C_HEADER_GRAY = "#e0e7ff"; 

  const sOverlay = "position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.2);display:flex;align-items:flex-start;justify-content:center;z-index:99999;font-family:system-ui,sans-serif;padding-top:20px;overflow-y:auto;pointer-events:none";
  const sModal = "background:white;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.15);width:90%;max-width:550px;height:80vh;max-height:800px;overflow:hidden;display:flex;flex-direction:column;cursor:grab;user-select:none;margin-bottom:20px;pointer-events:auto";
  const sHeader = "padding:15px 20px;border-bottom:1px solid #e0e0e0;font-size:18px;font-weight:600;color:#333;cursor:grab;display:flex;justify-content:space-between;align-items:center";
  const sContent = "padding:20px;flex:1;color:#666;font-size:14px;line-height:1.6;overflow-y:auto";
  const sGroupHeader = "margin:20px 0 10px;font-size:16px;font-weight:bold;color:#1d4ed8;border-bottom:2px solid #1d4ed8;padding-bottom:4px";
  const sItemContainer = "margin-bottom:8px;border:1px solid #e0e0e0;border-radius:4px;overflow:hidden";
  const sItemHeader = "width:100%;padding:10px 16px;background:#f5f5f5;border:none;text-align:left;cursor:pointer;font-weight:500;color:#333;display:flex;justify-content:space-between;align-items:center";
  const sItemBody = "display:none;padding:12px 16px;border-top:1px solid #e0e0e0;background:#fafafa";
  const sBtnGroup = "margin-bottom:8px;display:flex;gap:6px";
  
  const sBtnBase = "flex:1;padding:8px;border:1px solid;border-radius:4px;cursor:pointer;font-weight:500;font-size:12px;transition:all 0.2s";
  const sSelect = "width:100%;padding:8px;border:1px solid #ccc;border-radius:4px;margin-bottom:8px;font-size:13px";
  const sTextarea = "width:100%;border:1px solid #ccc;border-radius:4px;padding:8px;font-family:inherit;resize:vertical;height:50px;font-size:13px";
  const sInput = "width:100%;padding:8px;border:1px solid #ccc;border-radius:4px;font-size:13px;box-sizing:border-box";
  const sLabel = "display:block;margin-bottom:4px;font-weight:600;font-size:12px;color:#333";
  const sFieldGroup = "margin-bottom:12px";
  const sFooter = "padding:16px;border-top:1px solid #e0e0e0;display:flex;gap:12px;justify-content:flex-end";
  const sBtnCancel = "padding:8px 16px;border:1px solid #ccc;background:white;border-radius:4px;cursor:pointer;font-size:14px;color:#333";
  const sBtnGenerate = "padding:8px 16px;border:none;background:#2563eb;color:white;border-radius:4px;cursor:pointer;font-size:14px;font-weight:500";
  const sTagContainer = "display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px";
  
  const getTheme = (item, sel) => {
     if(item.options) return 'gray';
     if (item.label === "Temp Worsen") {
         if(sel === 'no') return 'green';
         if(sel === 'yes') return 'red';
     }
     if(sel === 'yes') return 'green';
     if(sel === 'no') return 'red';
     return 'gray';
  };

  const getColors = (theme) => {
      if(theme === 'green') return { bg: C_GREEN_BG, txt: C_GREEN_TXT, border: C_GREEN_BORDER, header: C_HEADER_GREEN };
      if(theme === 'red') return { bg: C_RED_BG, txt: C_RED_TXT, border: C_RED_BORDER, header: C_HEADER_RED };
      return { bg: C_GRAY_BG, txt: C_GRAY_TXT, border: C_GRAY_BORDER, header: C_HEADER_GRAY };
  };

  const overlay = createElement("div", sOverlay);
  overlay.id = "qa-modal-overlay";
  const modal = createElement("div", sModal);
  
  let isDragging = false, startX = 0, startY = 0, initialX = 0, initialY = 0;
  const header = createElement("div", sHeader);
  header.innerHTML = `<span>QA Form Tool</span><span style="font-size:12px;color:#999">v3.0</span>`;
  
  addListener(header, "mousedown", (e) => {
    if(e.target === header || e.target.parentNode === header) {
        isDragging = true;
        startX = e.clientX - initialX;
        startY = e.clientY - initialY;
        header.style.cursor = "grabbing";
    }
  });
  addListener(document, "mousemove", (e) => {
    if(isDragging) {
      initialX = e.clientX - startX;
      initialY = e.clientY - startY;
      modal.style.transform = `translate(${initialX}px, ${initialY}px)`;
    }
  });
  addListener(document, "mouseup", () => {
    isDragging = false;
    header.style.cursor = "grab";
  });

  const contentContainer = createElement("div", sContent);

  // --- Extraction Helpers ---
  const extractText = (selector) => { const el = document.querySelector(selector); return el ? el.textContent.trim() : ""; };
  
  const extractTranscript = () => {
      const els = document.querySelectorAll('.spec-transcript-content');
      return Array.from(els).map(el => el.innerText.trim()).join("\n");
  };

  const generateSummary = async () => {
      const transcript = extractTranscript();
      if(!transcript) {
          showToast("No transcript found on page.", true);
          return null;
      }
      
      const prompt = `Summarize the following transcript in one concise paragraph.
      Identify the customer's concern and how the specialist resolved it.
      Do not use names, use 'customer' and 'Specialist' instead.
      Do not use em-dashes. Specify the dates, amounts, and other relevant details as mentioned.
      Do not include the phone numbers, or company codes as well.
      The summary should start not from the confirmation of the details of the customers, but from the actual issue raised by the customer.

Transcript:
${transcript}`;

      try {
            const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

          
          if(!resp.ok) {
              const errData = await resp.json().catch(() => ({}));
              console.error("Gemini API Error:", resp.status, errData);
              throw new Error(`API Error: ${resp.status} ${errData.error?.message || ''}`);
          }
          
          const data = await resp.json();
          if(data.candidates && data.candidates[0] && data.candidates[0].content) {
              return data.candidates[0].content.parts[0].text;
          }
          return null;
      } catch(e) {
          console.error("Summary Generation Failed:", e);
          showToast(`Failed: ${e.message}`, true);
          return null;
      }
  };

  const getInteractionId = () => {
      const h4s = Array.from(document.querySelectorAll('h4'));
      const h4 = h4s.find(el => el.textContent.trim() === 'Interaction ID');
      return h4 && h4.nextElementSibling ? h4.nextElementSibling.textContent.trim() : "";
  };
  
  const getAdvocateName = () => extractText('.review-info h2');
  
  const getAniDnisOptions = () => {
      const h4s = Array.from(document.querySelectorAll('h4'));
      const opts = [];
      const dnisH4 = h4s.find(el => el.textContent.trim() === 'DNIS');
      if(dnisH4 && dnisH4.nextElementSibling) opts.push(dnisH4.nextElementSibling.textContent.trim());
      const aniH4 = h4s.find(el => el.textContent.trim() === 'ANI');
      if(aniH4 && aniH4.nextElementSibling) opts.push(aniH4.nextElementSibling.textContent.trim());
      return opts;
  };
  
  const getCallDuration = () => {
      const h4s = Array.from(document.querySelectorAll('h4'));
      const h4 = h4s.find(el => el.textContent.includes('Call Duration'));
      if(h4 && h4.nextElementSibling) {
          const val = parseFloat(h4.nextElementSibling.textContent.trim());
          return isNaN(val) ? "" : Math.round(val);
      }
      return "";
  };
  // ---------------------------

  const createCompactField = (placeholder, icon, type = "text", fullWidth = false, useLabel = false, initialValue = "", options = []) => {
      const wrapper = createElement("div");
      if(fullWidth) wrapper.style.gridColumn = "1 / -1"; 

      if (useLabel) {
          const lbl = createElement("label");
          lbl.textContent = placeholder;
          lbl.style.cssText = sLabel; 
          const input = createElement("input");
          input.type = type;
          input.style.cssText = sInput;
          if(initialValue) input.value = initialValue;
          wrapper.appendChild(lbl);
          wrapper.appendChild(input);
          return { div: wrapper, input };
      } else {
          const container = createElement("div");
          container.style.cssText = "display:flex;align-items:center;border:1px solid #ccc;border-radius:4px;padding:6px 10px;background:white;transition:border-color 0.2s";
          
          const ico = createElement("span");
          ico.textContent = icon;
          ico.style.cssText = "margin-right:8px;font-size:14px;opacity:0.7;user-select:none;min-width:18px;text-align:center";
          
          let input;
          if (options && options.length > 0) {
              input = createElement("select");
              input.style.cssText = "width:100%;border:none;outline:none;font-family:inherit;font-size:13px;background:transparent;cursor:pointer";
              options.forEach(opt => {
                  const o = createElement("option");
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

          addListener(input, "focus", () => container.style.borderColor = "#2563eb");
          addListener(input, "blur", () => container.style.borderColor = "#ccc");

          container.appendChild(ico);
          container.appendChild(input);
          wrapper.appendChild(container);
          return { div: wrapper, input };
      }
  };

  // --- New Header Fields ---
  const headerFieldsContainer = createElement("div");
  headerFieldsContainer.style.cssText = "display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:15px;padding-bottom:15px;border-bottom:1px solid #eee";

  // Row 1
  const fInteractionId = createCompactField("Interaction ID", "🆔", "text", false, false, getInteractionId());
  const fAdvocateName = createCompactField("Advocate Name", "👤", "text", false, false, getAdvocateName());
  
  const aniOpts = getAniDnisOptions();
  const fCallAni = createCompactField("Call ANI/DNIS", "📞", "text", false, false, "", aniOpts);
  
  headerFieldsContainer.appendChild(fInteractionId.div);
  headerFieldsContainer.appendChild(fAdvocateName.div);
  headerFieldsContainer.appendChild(fCallAni.div);

  // Row 1.5
  const caseDurationRow = createElement("div");
  caseDurationRow.style.cssText = "grid-column: 1 / -1; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;";
  const fCaseNumber = createCompactField("Case #", "🔢");
  const fCallDuration = createCompactField("Call Duration", "⏱️", "text", false, false, getCallDuration());
  caseDurationRow.appendChild(fCaseNumber.div);
  caseDurationRow.appendChild(fCallDuration.div);
  headerFieldsContainer.appendChild(caseDurationRow);

  // Row 2
  const dateRow = createElement("div");
  dateRow.style.cssText = "grid-column: 1 / -1; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;";
  
  const fDateInteraction = createCompactField("Date of Interaction", "", "date", false, true); 
  const fDateEvaluation = createCompactField("Date of Evaluation", "", "date", false, true);
  fDateEvaluation.input.valueAsDate = new Date();
  
  dateRow.appendChild(fDateInteraction.div);
  dateRow.appendChild(fDateEvaluation.div);
  headerFieldsContainer.appendChild(dateRow);

  // Row 3
  const fCaseCategory = createCompactField("Case Category", "🗂️", "text", true);
  headerFieldsContainer.appendChild(fCaseCategory.div);

  // Row 4
  const fIssueConcern = createCompactField("Issue/Concern", "✍️", "textarea", true);

  // --- Summary Generation Button ---
  const btnSummary = createElement("span");
  btnSummary.textContent = "✨";
  btnSummary.title = "Generate Summary from Transcript";
  btnSummary.style.cssText = "position:absolute; right:8px; top:8px; cursor:pointer; font-size:16px; opacity:0.6; user-select:none; z-index:5";
  
  const issueContainer = fIssueConcern.div.firstChild;
  if(issueContainer) {
      issueContainer.style.position = "relative";
      issueContainer.appendChild(btnSummary);
      
      addListener(btnSummary, "mouseenter", () => btnSummary.style.opacity = "1");
      addListener(btnSummary, "mouseleave", () => btnSummary.style.opacity = "0.6");
      addListener(btnSummary, "click", async (e) => {
          e.stopPropagation();
          const originalIcon = btnSummary.textContent;
          btnSummary.textContent = "⏳";
          btnSummary.style.cursor = "wait";
          
          const summary = await generateSummary();
          if(summary) {
              fIssueConcern.input.value = summary;
              fIssueConcern.input.dispatchEvent(new Event('input')); // Update state
              showToast("Summary generated!", false);
          }
          
          btnSummary.textContent = originalIcon;
          btnSummary.style.cursor = "pointer";
      });
  }

  headerFieldsContainer.appendChild(fIssueConcern.div);

  contentContainer.appendChild(headerFieldsContainer);

  groups.forEach(group => {
    const groupTitle = createElement("div", sGroupHeader);
    groupTitle.textContent = group.name;
    contentContainer.appendChild(groupTitle);

    group.items.forEach(item => {
      const key = `${group.name}-${item.id}`;
      const itemContainer = createElement("div", sItemContainer);
      const itemHeader = createElement("div", sItemHeader);
      const leftGroup = createElement("div");
      leftGroup.style.cssText = "display:flex;align-items:center;gap:10px";

      const checkbox = createElement("input");
      checkbox.type = "checkbox";
      checkbox.style.cursor = "pointer";
      addListener(checkbox, "click", (e) => { e.stopPropagation(); state[key].checked = e.target.checked; });

      const label = createElement("span");
      label.textContent = `${item.id}. ${item.label}`;
      leftGroup.appendChild(checkbox);
      leftGroup.appendChild(label);

      const arrow = createElement("span");
      arrow.style.fontSize = "10px";
      arrow.textContent = "▼";
      itemHeader.appendChild(leftGroup);
      itemHeader.appendChild(arrow);

      let expanded = false;
      const itemBody = createElement("div", sItemBody);
      const tagContainer = createElement("div", sTagContainer);

      const updateHeaderBg = () => {
        const hasContent = state[key].text.trim().length > 0 || state[key].selectedTags.length > 0;
        if (hasContent) {
            const theme = getTheme(item, state[key].sel);
            const cols = getColors(theme);
            itemHeader.style.background = cols.header;
        } else {
            itemHeader.style.background = expanded ? "#e8e8e8" : "#f5f5f5";
        }
      };

      const renderTags = () => {
        tagContainer.innerHTML = "";
        const currentSel = state[key].sel;
        const relevantTags = globalTags.filter(t => 
            t.group_name === group.name && 
            t.item_id === item.id && 
            String(t.response_value) === String(currentSel)
        );

        relevantTags.forEach(tagData => {
            const tagBtn = createElement("div");
            const theme = getTheme(item, currentSel);
            const cols = getColors(theme);
            const isActive = state[key].selectedTags.some(t => t.id === tagData.id);
            
            if(isActive) {
                tagBtn.style.cssText = `padding:4px 8px;border:1px solid ${cols.border};border-radius:12px;font-size:11px;cursor:pointer;background:${cols.bg};color:${cols.txt};font-weight:500;transition:all 0.2s`;
            } else {
                tagBtn.style.cssText = `padding:4px 8px;border:1px solid #ccc;border-radius:12px;font-size:11px;cursor:pointer;background:#f9fafb;color:#333;transition:all 0.2s`;
            }
            tagBtn.textContent = tagData.tag_label;

            addListener(tagBtn, "click", () => {
                if(isActive) {
                    state[key].selectedTags = state[key].selectedTags.filter(t => t.id !== tagData.id);
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

      if (item.options) {
        const select = createElement("select", sSelect);
        item.options.forEach((opt, idx) => {
          const o = createElement("option");
          o.value = idx;
          o.textContent = opt;
          if (idx === state[key].sel) o.selected = true;
          select.appendChild(o);
        });
        
        // Define UI refresh for Select
        state[key].refreshUI = () => {
            select.value = state[key].sel;
            checkbox.checked = state[key].checked;
            renderTags();
            updateHeaderBg();
        };

        addListener(select, "change", (e) => {
            state[key].sel = parseInt(e.target.value);
            state[key].selectedTags = []; 
            renderTags();
            updateHeaderBg();
            updateText(key);
        });
        itemBody.appendChild(select);
      } else {
        const btnYes = createElement("button");
        btnYes.textContent = item.reverse ? "No" : "Yes"; 
        const btnNo = createElement("button");
        btnNo.textContent = item.reverse ? "Yes" : "No";
        const btnGroup = createElement("div", sBtnGroup);
        btnGroup.appendChild(btnYes);
        btnGroup.appendChild(btnNo);

        const updateBtnStyle = (val) => {
          const theme = getTheme(item, val);
          const cols = getColors(theme);
          
          const activeStyle = `${sBtnBase};background:${cols.bg};color:${cols.txt};border-color:${cols.border}`;
          const inactiveStyle = `${sBtnBase};background:white;color:#333;border-color:#ccc`;

          if(val === 'yes') { 
             btnYes.style.cssText = activeStyle;
             btnNo.style.cssText = inactiveStyle;
          } else { 
             btnYes.style.cssText = inactiveStyle;
             btnNo.style.cssText = activeStyle;
          }
        };

        // Define UI refresh for Buttons
        state[key].refreshUI = () => {
            updateBtnStyle(state[key].sel);
            checkbox.checked = state[key].checked;
            renderTags();
            updateHeaderBg();
        };

        // Initial style
        updateBtnStyle(state[key].sel);

        addListener(btnYes, "click", () => { state[key].sel = "yes"; state[key].selectedTags = []; updateBtnStyle("yes"); renderTags(); updateHeaderBg(); updateText(key); });
        addListener(btnNo, "click", () => { state[key].sel = "no"; state[key].selectedTags = []; updateBtnStyle("no"); renderTags(); updateHeaderBg(); updateText(key); });
        itemBody.appendChild(btnGroup);
      }

      itemBody.appendChild(tagContainer);

      const textarea = createElement("textarea", sTextarea);
      state[key].domTextarea = textarea;
      textarea.placeholder = "Comments...";
      addListener(textarea, "input", (e) => {  
          state[key].text = e.target.value;
          updateHeaderBg();
      });
      itemBody.appendChild(textarea);

      addListener(itemHeader, "click", () => {
        expanded = !expanded;
        itemBody.style.display = expanded ? "block" : "none";
        updateHeaderBg();
        arrow.textContent = expanded ? "▲" : "▼";
        if(expanded && globalTags.length > 0) renderTags(); 
      });

      itemContainer.appendChild(itemHeader);
      itemContainer.appendChild(itemBody);
      contentContainer.appendChild(itemContainer);
    });
  });

  // --- Footer ---
  const footer = createElement("div", sFooter);
  const btnCancel = createElement("button", sBtnCancel);
  btnCancel.textContent = "Cancel";
  addListener(btnCancel, "click", () => overlay.remove());

  const btnGenerate = createElement("button", sBtnGenerate);
  btnGenerate.textContent = "Generate & Save";

  const btnGenerateOnly = createElement("button", sBtnGenerate);
  btnGenerateOnly.textContent = "Generate";
  btnGenerateOnly.style.backgroundColor = "#4f46e5";
  
  const btnSaveOnly = createElement("button", sBtnGenerate);
  btnSaveOnly.textContent = "Save";
  btnSaveOnly.style.backgroundColor = "#059669"; // Greenish for save

  const findGroupContainer = (name) => {
    const h2s = Array.from(document.querySelectorAll('h2'));
    const h2 = h2s.find(el => el.textContent.trim().includes(name));
    return h2 ? h2.closest('.padding-xlarge') : null;
  };

  const showToast = (msg, isError = true) => {
      const toast = createElement("div");
      toast.textContent = msg;
      toast.style.cssText = `position:fixed;bottom:20px;right:20px;background:${isError ? '#ef4444' : '#10b981'};color:white;padding:12px 20px;border-radius:6px;box-shadow:0 10px 15px -3px rgba(0, 0, 0, 0.1);z-index:100000;font-size:14px;font-weight:500;opacity:0;transition:opacity 0.3s ease-in-out;pointer-events:none;`;
      document.body.appendChild(toast);
      requestAnimationFrame(() => toast.style.opacity = "1");
      setTimeout(() => {
          toast.style.opacity = "0";
          setTimeout(() => toast.remove(), 300);
      }, 3000);
  };

  // --- Logic for Load/Save/Generate ---

  const populateForm = (record) => {
      existingRecordId = record.id;
      
      // Header Fields
      if(record.advocate_name) fAdvocateName.input.value = record.advocate_name;
      if(record.call_ani) fCallAni.input.value = record.call_ani;
      if(record.case_number) fCaseNumber.input.value = record.case_number;
      if(record.call_duration) fCallDuration.input.value = record.call_duration;
      if(record.date_interaction) fDateInteraction.input.value = record.date_interaction;
      if(record.date_evaluation) fDateEvaluation.input.value = record.date_evaluation;
      if(record.case_category) fCaseCategory.input.value = record.case_category;
      if(record.issue_concern) fIssueConcern.input.value = record.issue_concern;

      // State / Form Data
      if(record.form_data) {
          Object.entries(record.form_data).forEach(([k, v]) => {
             if(state[k]) {
                 state[k].sel = v.sel;
                 state[k].text = v.text;
                 state[k].checked = v.checked;
                 
                 // Restore tags objects from labels
                 if(v.tags && Array.isArray(v.tags)) {
                     // We need to match tag labels back to full objects in globalTags
                     // This relies on globalTags being loaded.
                     // Since checkExistingRecord runs after initData, we should be fine.
                     state[k].selectedTags = globalTags.filter(gt => 
                         v.tags.includes(gt.tag_label) && 
                         gt.group_name === state[k].groupName && 
                         gt.item_id === state[k].itemId
                     );
                 } else {
                     state[k].selectedTags = [];
                 }
             } 
          });
      }

      refreshAllUI();
      showToast("Evaluation loaded!", false);
  };

  const checkExistingRecord = async () => {
      const iId = fInteractionId.input.value.trim();
      if(!iId) return;

      try {
          const resp = await fetch(`${SUPABASE_URL}/rest/v1/qa_evaluations?interaction_id=eq.${iId}&limit=1`, {
              headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
          });
          if(resp.ok) {
              const data = await resp.json();
              if(data && data.length > 0) {
                  populateForm(data[0]);
              }
          }
      } catch(e) {
          console.error("Check existing failed", e);
      }
  };

  const saveRecord = async () => {
    // Collect Payload
    const payload = {
        interaction_id: fInteractionId.input.value,
        advocate_name: fAdvocateName.input.value,
        call_ani: fCallAni.input.value,
        case_number: fCaseNumber.input.value,
        call_duration: fCallDuration.input.value,
        date_interaction: fDateInteraction.input.value,
        date_evaluation: fDateEvaluation.input.value,
        case_category: fCaseCategory.input.value,
        issue_concern: fIssueConcern.input.value,
        source_url: window.location.href,
        form_data: Object.fromEntries(Object.entries(state).map(([k, v]) => [k, { 
            sel: v.sel, 
            text: v.text, 
            checked: v.checked,
            tags: v.selectedTags.map(t => t.tag_label) 
        }]))
    };

    let url = `${SUPABASE_URL}/rest/v1/qa_evaluations`;
    let method = 'POST';
    
    // If update
    if(existingRecordId) {
        url += `?id=eq.${existingRecordId}`;
        method = 'PATCH';
    }

    const resp = await fetch(url, {
        method: method,
        headers: { 
            "apikey": SUPABASE_KEY, 
            "Authorization": `Bearer ${SUPABASE_KEY}`,
            "Content-Type": "application/json",
            "Prefer": "return=representation" 
        },
        body: JSON.stringify(payload)
    });
    
    if(!resp.ok) {
        const err = await resp.json();
        throw new Error(err.message || "Save failed");
    }
    
    // Update existingRecordId with the returned ID to ensure subsequent saves are updates
    const savedData = await resp.json();
    if(savedData && savedData.length > 0) {
        existingRecordId = savedData[0].id;
    }
  };

  const handleSaveOnly = async () => {
      if (!fInteractionId.input.value.trim()) {
          showToast("Interaction ID is required to save.");
          return;
      }
      btnSaveOnly.textContent = "Saving...";
      btnSaveOnly.disabled = true;
      try {
          await saveRecord();
          showToast("Saved Successfully!", false);
      } catch(e) {
          showToast("Error saving: " + e.message, true);
      } finally {
          btnSaveOnly.textContent = "Save";
          btnSaveOnly.disabled = false;
      }
  };

  const handleGeneration = async (saveToDb) => {
    // Validation
    if (!fCaseNumber.input.value.trim() || 
        !fCaseCategory.input.value.trim() || 
        !fIssueConcern.input.value.trim() || 
        !fDateInteraction.input.value) {
        showToast("Please fill out required fields and generate again.");
        return;
    }

    const activeBtn = saveToDb ? btnGenerate : btnGenerateOnly;
    const originalText = activeBtn.textContent;
    activeBtn.textContent = "Generating... ⏳";
    
    [btnGenerate, btnGenerateOnly, btnSaveOnly, btnCancel].forEach(b => {
        b.disabled = true;
        b.style.opacity = "0.7";
        b.style.cursor = "not-allowed";
    });

    const allKeys = Object.keys(state);
    const checkedKeys = allKeys.filter(k => state[k].checked);
    const targetKeys = checkedKeys.length > 0 ? checkedKeys : allKeys;

    let index = 0;
    const processNext = async () => {
      if(index >= targetKeys.length) {
        // --- Generation Complete ---
        if(saveToDb) {
            activeBtn.textContent = "Saving... ⏳";
            try {
                await saveRecord();
                alert("✓ Generated and Saved to Database! 💾");
            } catch(e) {
                console.error(e);
                alert("Generated, but error saving: " + (e.message || "Unknown error"));
            }
        } else {
             alert("✓ Generated! (Not saved)");
        }
        
        // Restore State
        activeBtn.textContent = originalText;
        [btnGenerate, btnGenerateOnly, btnSaveOnly, btnCancel].forEach(b => {
            b.disabled = false;
            b.style.opacity = "1";
            b.style.cursor = "pointer";
        });
        
        overlay.remove();
        return;
      }
      const key = targetKeys[index];
      const s = state[key];
      let container = findGroupContainer(s.groupName);
      
      if(container) {
        const question = container.querySelector(`[data-idx="${s.itemId}"]`);
        
        if(question) {
          const control = question.querySelector('[data-testid="SegmentedControl"]');
          if(control) {
            const buttons = Array.from(control.querySelectorAll('button'));
            if(s.itemType === 'select') {
                if(buttons[s.sel]) buttons[s.sel].click();
            } else {
                if(s.sel === "yes" && buttons[0]) buttons[0].click();
                else if(s.sel === "no" && buttons[1]) buttons[1].click();
            }
          }
          
          await new Promise(r => setTimeout(r, 2500));
          
          container = findGroupContainer(s.groupName); 
          const freshQuestion = container ? container.querySelector(`[data-idx="${s.itemId}"]`) : null;
          
          if(freshQuestion) {
             let finalText = s.text.trim();
             
             if(!finalText) {
                 if(s.selectedTags.length > 0) {
                     finalText = s.selectedTags.map(t => t.tag_feedback).join(" ");
                 } else {
                     const lookupKey = `${s.groupName}-${s.itemId}-${s.sel}`;
                     finalText = globalDefaults[lookupKey] || "";
                 }
             }

             if(finalText) {
                const txtArea = freshQuestion.querySelector('textarea');
                if(txtArea) {
                    const proto = Object.getPrototypeOf(txtArea);
                    const setter = Object.getOwnPropertyDescriptor(proto, "value").set;
                    if(setter) setter.call(txtArea, finalText); else txtArea.value = finalText;
                    txtArea.dispatchEvent(new Event("input", { bubbles: true }));
                    txtArea.dispatchEvent(new Event("change", { bubbles: true }));
                }
             }
          }
        }
      }
      
      await new Promise(r => setTimeout(r, 500));
      index++;
      processNext();
    };
    processNext();
  };

  addListener(btnGenerate, "click", () => handleGeneration(true));
  addListener(btnGenerateOnly, "click", () => handleGeneration(false));
  addListener(btnSaveOnly, "click", () => handleSaveOnly());

  footer.appendChild(btnCancel);
  footer.appendChild(btnSaveOnly);
  footer.appendChild(btnGenerateOnly);
  footer.appendChild(btnGenerate);
  
  modal.appendChild(header);
  modal.appendChild(contentContainer);
  modal.appendChild(footer);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Init Data (Async)
  initData();
})();