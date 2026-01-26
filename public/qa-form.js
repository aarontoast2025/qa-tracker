(function(){
  if(window.__qaBridgeActive) return;

  var APP_URL = 'https://qa-tracker-toast.vercel.app';
  var FORM_ID = '41e96e83-dad5-4752-be7f-ae0a5dd31406';

  var setupBridge = function(popup) {
    window.__qaBridgeActive = true;
    if(window.__qaBridge) window.removeEventListener('message', window.__qaBridge);

    window.__qaBridge = function(e){
      if(e.origin !== APP_URL) return;

      if(e.data.type === 'REQUEST_HOST_DATA'){
        var getVal = function(s){ var el=document.querySelector(s); return el?el.textContent.trim():'' };
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

      if(e.data.type === 'AUTOMATE_PAGE'){
        var items = e.data.data;
        var processItem = function(index) {
          if (index >= items.length) {
            popup.postMessage({ type: 'AUTOMATION_COMPLETE' }, '*');
            return;
          }
          var item = items[index];
          var h2s = Array.from(document.querySelectorAll('h2'));
          var h2 = h2s.find(function(el){return el.textContent.trim().toLowerCase().includes(item.groupName.toLowerCase())});
          var container = h2 ? h2.closest('.padding-xlarge') || h2.parentElement : document;
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
      }
    };
    window.addEventListener('message', window.__qaBridge);
  };

  var launch = function() {
    var w=650,h=850,l=(screen.width-w)/2,t=(screen.height-h)/2;
    var u = APP_URL + '/embed/audit/' + FORM_ID + '?url=' + encodeURIComponent(window.location.href);
    var popup = window.open(u, 'QAForm', 'width='+w+',height='+h+',top='+t+',left='+l+',scrollbars=yes');
    
    if(popup && !popup.closed && typeof popup.closed !== 'undefined') {
      setupBridge(popup);
      return true;
    }
    return false;
  };

  var success = launch();

  if(!success) {
    if(document.getElementById('qa-blocked-btn')) return;
    
    var btn = document.createElement('div');
    btn.id = 'qa-blocked-btn';
    btn.textContent = '🚀 Launch QA Form';
    btn.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#2563eb;color:white;padding:12px 20px;border-radius:50px;cursor:pointer;z-index:10001;font-family:sans-serif;font-weight:600;box-shadow:0 4px 12px rgba(37,99,235,0.3);transition:transform 0.2s;';
    btn.onmouseover = function(){ btn.style.transform = 'scale(1.05)'; };
    btn.onmouseout = function(){ btn.style.transform = 'scale(1)'; };
    btn.onclick = function() {
      launch();
      btn.remove();
    };
    document.body.appendChild(btn);
  }
})();
