/* === LOCAL DEVELOPMENT BOOKMARKLET === */
/* Use this when running 'npm run dev' locally */
javascript:(function(){
    var w=500,h=800,l=(screen.width-w)/2,t=(screen.height-h)/2;
    var p=window.location.pathname;
    var parts=p.split('/');
    var bIdx=parts.indexOf('form-builder');
    var f=(bIdx!==-1&&parts[bIdx+1])?parts[bIdx+1]:'77777777-7777-7777-7777-777777777777';
    var u='http://localhost:3000/embed/audit/'+f;
    var popup=window.open(u,'QAForm','width='+w+',height='+h+',top='+t+',left='+l+',scrollbars=yes');
    if(!popup || popup.closed || typeof popup.closed=='undefined'){ alert('Popup Blocked!'); return; }
    window.removeEventListener('message', window.__qaBridge);
    window.__qaBridge = function(e){
        if(e.origin!=='http://localhost:3000') return;
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
                            var textarea=itemEl.querySelector('textarea');
                            if(textarea){
                                textarea.value = item.feedback || ("Automated: " + item.answer);
                                textarea.dispatchEvent(new Event('input',{bubbles:true}));
                            }
                            processItem(index + 1);
                        }, 1000);
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
    var w=500,h=800,l=(screen.width-w)/2,t=(screen.height-h)/2;
    var p=window.location.pathname;
    var parts=p.split('/');
    var bIdx=parts.indexOf('form-builder');
    var f=(bIdx!==-1&&parts[bIdx+1])?parts[bIdx+1]:'77777777-7777-7777-7777-777777777777';
    var u='https://qa-tracker-toast.vercel.app/embed/audit/'+f;
    var popup=window.open(u,'QAForm','width='+w+',height='+h+',top='+t+',left='+l+',scrollbars=yes');
    if(!popup || popup.closed || typeof popup.closed=='undefined'){ alert('Popup Blocked!'); return; }
    window.removeEventListener('message', window.__qaBridge);
    window.__qaBridge = function(e){
        if(e.origin!=='https://qa-tracker-toast.vercel.app') return;
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
                            var textarea=itemEl.querySelector('textarea');
                            if(textarea){
                                textarea.value = item.feedback || ("Automated: " + item.answer);
                                textarea.dispatchEvent(new Event('input',{bubbles:true}));
                            }
                            processItem(index + 1);
                        }, 1000);
                    } else { processItem(index + 1); }
                } else { processItem(index + 1); }
            };
            processItem(0);
        }
    };
    window.addEventListener('message', window.__qaBridge);
})();
