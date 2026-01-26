(function(){
  if(document.getElementById('qa-modal-overlay')) return;

  // Modal creation and form logic here...
  const modal = document.createElement('div');
  modal.id = 'qa-modal-overlay';
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.8); z-index: 10000; display: flex;
    align-items: center; justify-content: center; font-family: Arial, sans-serif;
  `;

  const content = document.createElement('div');
  content.style.cssText = `
    background: white; padding: 20px; border-radius: 8px;
    max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;
  `;

  const header = document.createElement('div');
  header.innerHTML = '<h2 style="margin: 0 0 15px 0; color: #333;">QA Form Automation</h2>';

  const formContainer = document.createElement('div');
  formContainer.innerHTML = `
    <div style="margin-bottom: 15px;">
      <label style="display: block; margin-bottom: 5px; font-weight: bold;">Form ID:</label>
      <input type="text" id="form-id" placeholder="Enter form ID" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
    </div>
    <div style="margin-bottom: 15px;">
      <label style="display: block; margin-bottom: 5px; font-weight: bold;">Target URL:</label>
      <input type="text" id="target-url" value="${window.location.href}" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
    </div>
  `;

  const footer = document.createElement('div');
  footer.style.cssText = 'text-align: right; margin-top: 20px;';

  const btnGenerate = document.createElement('button');
  btnGenerate.textContent = 'Generate & Fill';
  btnGenerate.style.cssText = 'padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;';

  const btnCancel = document.createElement('button');
  btnCancel.textContent = 'Cancel';
  btnCancel.style.cssText = 'padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;';

  const addListener = function(el, event, handler) {
    el.addEventListener(event, handler);
  };

  // Open popup window for form
  const openFormPopup = function(formId, targetUrl) {
    var w=600,h=800,l=(screen.width-w)/2,t=(screen.height-h)/2;
    var u='https://qa-tracker-toast.vercel.app/embed/audit/'+formId+'?url='+encodeURIComponent(targetUrl);
    var popup=window.open(u,'QAForm','width='+w+',height='+h+',top='+t+',left='+l+',scrollbars=yes');
    if(!popup || popup.closed || typeof popup.closed=='undefined'){
      alert('Popup Blocked! Please allow popups for this site.');
      return null;
    }

    // Set up message listener for automation
    window.removeEventListener('message', window.__qaBridge);
    window.__qaBridge = function(e){
      if(e.origin!=='https://qa-tracker-toast.vercel.app') return;

      if(e.data.type==='REQUEST_HOST_DATA'){
        var getVal = function(s){ var el=document.querySelector(s); return el?el.textContent.trim():"" };
        var h4s = Array.from(document.querySelectorAll('h4'));
        var findH4Val = function(txt){
          var h4 = h4s.find(function(el){return el.textContent.trim().includes(txt)});
          return h4 && h4.nextElementSibling ? h4.nextElementSibling.textContent.trim() : "";
        };

        var extractTranscript = function() {
          var els = document.querySelectorAll('.spec-transcript-content');
          return Array.from(els).map(function(el){ return el.innerText.trim(); }).join("\n");
        };

        var data = {
          interaction_id: findH4Val('Interaction ID'),
          advocate_name: getVal('.review-info h2'),
          ani: findH4Val('ANI'),
          dnis: findH4Val('DNIS'),
          duration: findH4Val('Call Duration'),
          transcript: extractTranscript()
        };
        popup.postMessage({ type: 'HOST_PAGE_DATA', data: data }, '*');
      }

      if(e.data.type==='AUTOMATE_PAGE'){
        var items=e.data.data;
        var processItem = function(index) {
          if (index >= items.length) {
            popup.postMessage({ type: 'AUTOMATION_COMPLETE' }, '*');
            return;
          }
          var item = items[index];
          var h2s=Array.from(document.querySelectorAll('h2'));
          var h2=h2s.find(function(el){return el.textContent.trim().toLowerCase().includes(item.groupName.toLowerCase())});
          var container=h2?h2.closest('.padding-xlarge')||h2.parentElement:document;
          var itemEl=container.querySelector('[data-idx="'+item.index+'"]');

          if(!itemEl){
            var labels=Array.from(container.querySelectorAll('label'));
            var label=labels.find(function(l){return l.textContent.toLowerCase().includes(item.fullQuestion.toLowerCase())});
            itemEl=label?label.closest('div'):null;
          }

          if(itemEl){
            // First, expand the item to make textarea visible
            var header = itemEl.querySelector('div[style*="cursor: pointer"]') || itemEl.firstElementChild;
            if(header) {
              header.click();
              setTimeout(function(){
                var buttons=Array.from(itemEl.querySelectorAll('button'));
                var targetBtn=buttons.find(function(b){return b.textContent.trim().toLowerCase()===item.answer.toLowerCase()});
                if(targetBtn){
                  targetBtn.click();
                  setTimeout(function(){
                    if(item.tags && item.tags.length > 0){
                      var allBtns = Array.from(itemEl.querySelectorAll('button'));
                      item.tags.forEach(function(tagLabel){
                        var tBtn = allBtns.find(function(b){
                          return b.textContent.trim().toLowerCase().includes(tagLabel.toLowerCase());
                        });
                        if(tBtn) tBtn.click();
                      });
                    }
                    setTimeout(function(){
                      var textarea=itemEl.querySelector('textarea');
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
                        textarea.dispatchEvent(new Event('input',{bubbles:true}));
                        textarea.dispatchEvent(new Event('change',{bubbles:true}));
                      }
                      processItem(index + 1);
                    }, 500);
                  }, 2500);
                } else { processItem(index + 1); }
              }, 500); // Wait for expansion
            } else {
              processItem(index + 1);
            }
          } else { processItem(index + 1); }
        };
        processItem(0);
      }
    };
    window.addEventListener('message', window.__qaBridge);
  };

  addListener(btnGenerate, "click", function() {
    var formId = document.getElementById('form-id').value.trim();
    var targetUrl = document.getElementById('target-url').value.trim();

    if(!formId) {
      alert('Please enter a Form ID');
      return;
    }

    modal.remove();
    openFormPopup(formId, targetUrl);
  });

  addListener(btnCancel, "click", function() {
    modal.remove();
  });

  footer.appendChild(btnCancel);
  footer.appendChild(btnGenerate);

  content.appendChild(header);
  content.appendChild(formContainer);
  content.appendChild(footer);
  modal.appendChild(content);
  document.body.appendChild(modal);

  // Focus on form ID input
  setTimeout(function() {
    document.getElementById('form-id').focus();
  }, 100);
})();
