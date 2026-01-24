javascript:(function(){
    var w=500,h=800,l=(screen.width-w)/2,t=(screen.height-h)/2;
    var p=window.location.pathname;
    var parts=p.split('/');
    var bIdx=parts.indexOf('form-builder');
    var f=(bIdx!==-1&&parts[bIdx+1])?parts[bIdx+1]:'77777777-7777-7777-7777-777777777777';
    var u='https://qa-tracker-toast.vercel.app/embed/audit/'+f;
    var popup=window.open(u,'QAForm','width='+w+',height='+h+',top='+t+',left='+l+',scrollbars=yes');
    
    if(!popup || popup.closed || typeof popup.closed=='undefined'){
        alert('Popup Blocked! Please allow popups for this site to use the QA Tool.');
        return;
    }

    window.removeEventListener('message', window.__qaBridge);
    window.__qaBridge = function(e){
        if(e.origin!=='https://qa-tracker-toast.vercel.app' && !e.origin.includes('localhost')) return;
        
        if(e.data.type==='AUTOMATE_PAGE'){
            var items=e.data.data;
            
            /* StellaConnect specific sequence */
            var processItem = function(index) {
                if (index >= items.length) return;
                var item = items[index];
                
                /* 1. Find the question element */
                /* We try finding by data-idx first (fastest), then by full text label */
                var h2s=Array.from(document.querySelectorAll('h2'));
                var h2=h2s.find(function(el){return el.textContent.trim().toLowerCase()===item.groupName.toLowerCase()});
                var container=h2?h2.closest('.padding-xlarge')||h2.parentElement:document;
                
                var itemEl = container.querySelector('[data-idx="'+item.index+'"]');
                if (!itemEl) {
                   /* Fallback: Find by matching question text */
                   var labels = Array.from(container.querySelectorAll('label'));
                   var label = labels.find(function(l){ return l.textContent.includes(item.fullQuestion) });
                   itemEl = label ? label.closest('div') : null;
                }

                if(itemEl){
                    /* 2. Click the Button */
                    var buttons=Array.from(itemEl.querySelectorAll('button'));
                    var targetBtn=buttons.find(function(b){
                        return b.textContent.trim().toLowerCase()===item.answer.toLowerCase()
                    });
                    
                    if(targetBtn) {
                        targetBtn.click();
                        
                        /* 3. Wait for StellaConnect animation (Internal comments appearance) */
                        setTimeout(function(){
                            var textarea = itemEl.querySelector('textarea');
                            if(textarea){
                                textarea.value = "Automated: " + item.answer;
                                textarea.dispatchEvent(new Event('input',{bubbles:true}));
                            }
                            /* Process next item after delay */
                            processItem(index + 1);
                        }, 1000); 
                    } else {
                        processItem(index + 1);
                    }
                } else {
                    processItem(index + 1);
                }
            };
            
            processItem(0);
        }
    };
    window.addEventListener('message', window.__qaBridge);
})();
