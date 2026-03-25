import {Injectable} from '@angular/core';

@Injectable({providedIn: 'root'})
export class BookmarkletService {

  generateBookmarkletCode(): string {
    const code = `
(function(){
  if(document.getElementById('__ftd_hl'))return;
  var S='h1,h2,h3,h4,h5,h6,p,span,a,button,label,li,td,th,caption,figcaption,blockquote,dt,dd,legend,summary,option';
  var H=new Set(['SCRIPT','STYLE','NOSCRIPT','TEMPLATE','SVG']);
  var UI_IDS=new Set(['__ftd_hl','__ftd_badge','__ftd_notify']);

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
    var old=document.getElementById('__ftd_notify');
    if(old)old.remove();
    var d=document.createElement('div');
    d.id='__ftd_notify';
    d.style.cssText='position:fixed;top:20px;right:20px;background:'+bg+';color:#1e1e2e;padding:12px 20px;border-radius:8px;font:bold 14px/1.4 system-ui;z-index:2147483647;box-shadow:0 4px 12px rgba(0,0,0,.4);pointer-events:none';
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
    (root===document.body?document:root).querySelectorAll(S).forEach(function(el){
      if(!vis(el))return;
      var t=Array.from(el.childNodes).filter(function(n){return n.nodeType===3;}).map(function(n){return n.textContent.trim();}).filter(Boolean).join(' ');
      if(!t)return;
      var r=el.getBoundingClientRect();
      nodes.push({text:t,tagName:el.tagName,selector:sel(el),rect:{x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height)}});
    });
    return nodes;
  }
  function copyData(nodes){
    var payload=JSON.stringify({source:'figma-text-diff-bookmarklet',version:1,url:location.href,timestamp:Date.now(),nodes:nodes});
    function done(){notify('Extracted '+nodes.length+' nodes! Switch back to Figma Text Diff.','#a6e3a1');}
    function fail(){notify('Clipboard blocked — see console (F12).','#f38ba8');console.log('FIGMA_TEXT_DIFF_DATA:',payload);}
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(payload).then(done,function(){fallbackCopy(payload)?done():fail();});
    }else{fallbackCopy(payload)?done():fail();}
  }

  /* ── Highlight box (pointer-events:none so it never intercepts mouse) ── */
  var hl=document.createElement('div');
  hl.id='__ftd_hl';
  hl.style.cssText='position:fixed;pointer-events:none;border:2px solid #89b4fa;background:rgba(137,180,250,0.1);border-radius:3px;box-sizing:border-box;display:none;z-index:2147483645;transition:top .06s,left .06s,width .06s,height .06s';
  document.body.appendChild(hl);

  var badge=document.createElement('div');
  badge.id='__ftd_badge';
  badge.style.cssText='position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#1e1e2e;color:#cdd6f4;padding:10px 20px;border-radius:10px;font:13px/1.5 system-ui;z-index:2147483647;box-shadow:0 4px 20px rgba(0,0,0,.6);border:1px solid #45475a;pointer-events:none;white-space:nowrap';
  badge.innerHTML='<b style="color:#89b4fa">Click</b> a section to extract &nbsp;·&nbsp; <b style="color:#89b4fa">Esc</b> for full page';
  document.body.appendChild(badge);

  /* Force crosshair on everything */
  var style=document.createElement('style');
  style.id='__ftd_style';
  style.textContent='*{cursor:crosshair!important}';
  document.head.appendChild(style);

  var current=null;

  function isUI(el){
    return el&&(UI_IDS.has(el.id)||el.id==='__ftd_style');
  }

  function onMove(e){
    /* Temporarily hide highlight so elementFromPoint sees through it */
    hl.style.display='none';
    var el=document.elementFromPoint(e.clientX,e.clientY);
    hl.style.display='block';
    while(el&&isUI(el)){el=el.parentElement;}
    if(!el||el===document.body||el===document.documentElement)return;
    current=el;
    var r=el.getBoundingClientRect();
    hl.style.display='block';
    hl.style.top=r.top+'px';
    hl.style.left=r.left+'px';
    hl.style.width=r.width+'px';
    hl.style.height=r.height+'px';
  }

  function cleanup(){
    hl.remove();badge.remove();style.remove();
    document.removeEventListener('mousemove',onMove,true);
    document.removeEventListener('click',onClick,true);
    document.removeEventListener('keydown',onKey,true);
  }

  function onClick(e){
    if(isUI(e.target))return;
    e.preventDefault();e.stopImmediatePropagation();
    /* Flash green to confirm selection */
    if(current){
      hl.style.border='2px solid #a6e3a1';
      hl.style.background='rgba(166,227,161,0.15)';
    }
    setTimeout(function(){
      cleanup();
      copyData(extract(current||document.body));
    },150);
  }

  function onKey(e){
    if(e.key==='Escape'){cleanup();copyData(extract(document.body));}
  }

  document.addEventListener('mousemove',onMove,true);
  document.addEventListener('click',onClick,true);
  document.addEventListener('keydown',onKey,true);
})();`.trim();

    return 'javascript:' + encodeURIComponent(code);
  }
}
