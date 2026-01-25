/* === LOCAL DEVELOPMENT BOOKMARKLET === */
/* Use this when running 'npm run dev' locally */
javascript:(function(){
    var w=600,h=800,l=(screen.width-w)/2,t=(screen.height-h)/2;
    var p=window.location.pathname;
    var parts=p.split('/');
    var bIdx=parts.indexOf('form-builder');
    var f=(bIdx!==-1&&parts[bIdx+1])?parts[bIdx+1]:'41e96e83-dad5-4752-be7f-ae0a5dd31406';
    var u='http://localhost:3000/embed/audit/'+f+'?url='+encodeURIComponent(window.location.href);
    var popup=window.open(u,'QAForm','width='+w+',height='+h+',top='+t+',left='+l+',scrollbars=yes');
    if(!popup || popup.closed || typeof popup.closed=='undefined'){ alert('Popup Blocked!'); return; }
    
    window.removeEventListener('message', window.__qaBridge);
    window.__qaBridge = function(e){
        if(e.origin!=='http://localhost:3000') return;
        
        if(e.data.type==='REQUEST_HOST_DATA'){
            var getVal = function(s){ var el=document.querySelector(s); return el?el.textContent.trim():""; };
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
                if (index >= items.length) return;
                var item = items[index];
                var h2s=Array.from(document.querySelectorAll('h2'));
                var h2=h2s.find(function(el){return el.textContent.trim().toLowerCase()===item.groupName.toLowerCase()});
                var container=h2?h2.closest('.padding-xlarge')||h2.parentElement:document;
                var itemEl=container.querySelector('[data-idx="'+item.index+'"]');
                if(!itemEl){
                   var labels=Array.from(container.querySelectorAll('label'));
                   var label=labels.find(function(l){return l.textContent.includes(item.fullQuestion)});
                   itemEl=label?label.closest('div'):null;
                }
                if(itemEl){
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
                            var textarea=itemEl.querySelector('textarea');
                            if(textarea){
                                textarea.value = item.feedback || ("Automated: " + item.answer);
                                textarea.dispatchEvent(new Event('input',{bubbles:true}));
                            }
                            processItem(index + 1);
                        }, 2500);
                    } else { processItem(index + 1); }
                } else { processItem(index + 1); }
            };
            processItem(0);
        }
    };
    window.addEventListener('message', window.__qaBridge);
})();


/* === PRODUCTION BOOKMARKLET === */
/* Use this for the deployed vercel version */
javascript:(function(){
    var w=600,h=800,l=(screen.width-w)/2,t=(screen.height-h)/2;
    var p=window.location.pathname;
    var parts=p.split('/');
    var bIdx=parts.indexOf('form-builder');
    var f=(bIdx!==-1&&parts[bIdx+1])?parts[bIdx+1]:'41e96e83-dad5-4752-be7f-ae0a5dd31406';
    var u='https://qa-tracker-toast.vercel.app/embed/audit/'+f+'?url='+encodeURIComponent(window.location.href);
    var popup=window.open(u,'QAForm','width='+w+',height='+h+',top='+t+',left='+l+',scrollbars=yes');
    if(!popup || popup.closed || typeof popup.closed=='undefined'){ alert('Popup Blocked!'); return; }
    
    window.removeEventListener('message', window.__qaBridge);
    window.__qaBridge = function(e){
        if(e.origin!=='https://qa-tracker-toast.vercel.app') return;
        
        if(e.data.type==='REQUEST_HOST_DATA'){
            var getVal = function(s){ var el=document.querySelector(s); return el?el.textContent.trim():""; };
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
                if (index >= items.length) return;
                var item = items[index];
                var h2s=Array.from(document.querySelectorAll('h2'));
                var h2=h2s.find(function(el){return el.textContent.trim().toLowerCase()===item.groupName.toLowerCase()});
                var container=h2?h2.closest('.padding-xlarge')||h2.parentElement:document;
                var itemEl=container.querySelector('[data-idx="'+item.index+'"]');
                if(!itemEl){
                   var labels=Array.from(container.querySelectorAll('label'));
                   var label=labels.find(function(l){return l.textContent.includes(item.fullQuestion)});
                   itemEl=label?label.closest('div'):null;
                }
                if(itemEl){
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
                            var textarea=itemEl.querySelector('textarea');
                            if(textarea){
                                textarea.value = item.feedback || ("Automated: " + item.answer);
                                textarea.dispatchEvent(new Event('input',{bubbles:true}));
                            }
                            processItem(index + 1);
                        }, 2500);
                    } else { processItem(index + 1); }
                } else { processItem(index + 1); }
            };
            processItem(0);
        }
    };
    window.addEventListener('message', window.__qaBridge);
})();
