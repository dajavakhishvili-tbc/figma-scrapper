import {Injectable} from '@angular/core';

@Injectable({providedIn: 'root'})
export class BookmarkletService {

  generateBookmarkletCode(): string {
    const code = `
(function(){
  if(document.getElementById('__ftd_picker'))return;
  var S='h1,h2,h3,h4,h5,h6,p,span,a,button,label,li,td,th,caption,figcaption,blockquote,dt,dd,legend,summary,option';
  var H=new Set(['SCRIPT','STYLE','NOSCRIPT','TEMPLATE','SVG']);

  function vis(el){
    if(H.has(el.tagName))return false;
    var s=getComputedStyle(el);
    return s.display!=='none'&&s.visibility!=='hidden'&&s.opacity!=='0';
  }
  function sel(el){
    var p=[];
    while(el&&el!==document.body){
      var s=el.tagName.toLowerCase();
      if(el.id){s+='#'+el.id;p.unshift(s);break;}
      p.unshift(s);el=el.parentElement;
    }
    return p.join(' > ');
  }
  function notify(msg,bg){
    var d=document.createElement('div');
    d.id='__ftd_notify';
    d.style.cssText='position:fixed;top:20px;right:20px;background:'+bg+';color:#1e1e2e;padding:12px 20px;border-radius:8px;font:bold 14px/1.4 system-ui;z-index:2147483647;box-shadow:0 4px 12px rgba(0,0,0,.4)';
    d.textContent=msg;
    document.body.appendChild(d);
    setTimeout(function(){d.remove();},4000);
  }
  function fallbackCopy(text){
    var ta=document.createElement('textarea');
    ta.value=text;
    ta.style.cssText='position:fixed;left:-9999px;top:-9999px;opacity:0';
    document.body.appendChild(ta);
    ta.focus();ta.select();
    var ok=false;
    try{ok=document.execCommand('copy');}catch(e){}
    ta.remove();
    return ok;
  }
  function extract(root){
    var nodes=[];
    root.querySelectorAll(S).forEach(function(el){
      if(!vis(el))return;
      var t=Array.from(el.childNodes).filter(function(n){return n.nodeType===3;}).map(function(n){return n.textContent.trim();}).filter(Boolean).join(' ');
      if(!t)return;
      var r=el.getBoundingClientRect();
      nodes.push({text:t,tagName:el.tagName,selector:sel(el),rect:{x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height)}});
    });
    return nodes;
  }
  function copy(nodes){
    var payload=JSON.stringify({source:'figma-text-diff-bookmarklet',version:1,url:location.href,timestamp:Date.now(),nodes:nodes});
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(payload).then(function(){
        notify('Extracted '+nodes.length+' text nodes! Switch back to Figma Text Diff.','#a6e3a1');
      },function(){
        if(fallbackCopy(payload)){notify('Extracted '+nodes.length+' nodes! Switch back.','#a6e3a1');}
        else{notify('Clipboard blocked — see console.','#f38ba8');console.log('FIGMA_TEXT_DIFF_DATA:',payload);}
      });
    }else{
      if(fallbackCopy(payload)){notify('Extracted '+nodes.length+' nodes! Switch back.','#a6e3a1');}
      else{notify('Clipboard blocked — see console.','#f38ba8');console.log('FIGMA_TEXT_DIFF_DATA:',payload);}
    }
  }

  /* ── Picker UI ── */
  var overlay=document.createElement('div');
  overlay.id='__ftd_picker';
  overlay.style.cssText='position:fixed;inset:0;z-index:2147483646;cursor:crosshair;pointer-events:none';
  document.body.appendChild(overlay);

  var highlight=document.createElement('div');
  highlight.style.cssText='position:fixed;pointer-events:none;border:2px solid #89b4fa;background:rgba(137,180,250,0.12);border-radius:4px;transition:all 0.08s;box-sizing:border-box;display:none;z-index:2147483645';
  document.body.appendChild(highlight);

  var badge=document.createElement('div');
  badge.style.cssText='position:fixed;top:16px;left:50%;transform:translateX(-50%);background:#1e1e2e;color:#cdd6f4;padding:10px 18px;border-radius:8px;font:13px/1.4 system-ui;z-index:2147483647;box-shadow:0 4px 16px rgba(0,0,0,.5);border:1px solid #45475a;pointer-events:none';
  badge.innerHTML='<b style="color:#89b4fa">Figma Text Diff</b> — Click a section to extract its text &nbsp;<span style="color:#6c7086;font-size:11px">(Esc to extract full page)</span>';
  document.body.appendChild(badge);

  var current=null;
  function onMove(e){
    var el=document.elementFromPoint(e.clientX,e.clientY);
    while(el&&el===overlay||el===highlight||el===badge){el=el.parentElement;}
    if(!el||el===current)return;
    current=el;
    var r=el.getBoundingClientRect();
    highlight.style.cssText=highlight.style.cssText
      .replace(/display:[^;]+/,'display:block');
    highlight.style.display='block';
    highlight.style.top=r.top+'px';
    highlight.style.left=r.left+'px';
    highlight.style.width=r.width+'px';
    highlight.style.height=r.height+'px';
  }
  function cleanup(){
    overlay.remove();highlight.remove();badge.remove();
    document.removeEventListener('mousemove',onMove,true);
    document.removeEventListener('click',onClick,true);
    document.removeEventListener('keydown',onKey,true);
  }
  function onClick(e){
    e.preventDefault();e.stopPropagation();
    cleanup();
    var nodes=extract(current||document.body);
    copy(nodes);
  }
  function onKey(e){
    if(e.key==='Escape'){
      cleanup();
      copy(extract(document.body));
    }
  }
  overlay.style.pointerEvents='all';
  document.addEventListener('mousemove',onMove,true);
  document.addEventListener('click',onClick,true);
  document.addEventListener('keydown',onKey,true);
})();`.trim();

    return 'javascript:' + encodeURIComponent(code);
  }
}
