import {Injectable} from '@angular/core';

@Injectable({providedIn: 'root'})
export class BookmarkletService {

  generateBookmarkletCode(): string {
    const code = `
(function(){
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
    d.style.cssText='position:fixed;top:20px;right:20px;background:'+bg+';color:#1e1e2e;padding:12px 20px;border-radius:8px;font:14px/1.4 system-ui;z-index:999999;box-shadow:0 4px 12px rgba(0,0,0,.3)';
    d.textContent=msg;
    document.body.appendChild(d);
    setTimeout(function(){d.remove();},4000);
  }
  function fallbackCopy(text){
    var ta=document.createElement('textarea');
    ta.value=text;
    ta.style.cssText='position:fixed;left:-9999px;top:-9999px;opacity:0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    var ok=false;
    try{ok=document.execCommand('copy');}catch(e){}
    ta.remove();
    return ok;
  }
  var nodes=[];
  document.querySelectorAll(S).forEach(function(el){
    if(!vis(el))return;
    var t=Array.from(el.childNodes).filter(function(n){return n.nodeType===3;}).map(function(n){return n.textContent.trim();}).filter(Boolean).join(' ');
    if(!t)return;
    var r=el.getBoundingClientRect();
    nodes.push({text:t,tagName:el.tagName,selector:sel(el),rect:{x:r.x,y:r.y,width:r.width,height:r.height}});
  });
  var payload=JSON.stringify({source:'figma-text-diff-bookmarklet',version:1,url:location.href,timestamp:Date.now(),nodes:nodes});
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(payload).then(function(){
      notify('Extracted '+nodes.length+' text nodes! Switch back to Figma Text Diff.','#a6e3a1');
    },function(){
      if(fallbackCopy(payload)){
        notify('Extracted '+nodes.length+' text nodes! Switch back to Figma Text Diff.','#a6e3a1');
      }else{
        notify('Clipboard blocked. Copy manually from console (Ctrl+Shift+J).','#f38ba8');
        console.log('FIGMA_TEXT_DIFF_DATA:');
        console.log(payload);
      }
    });
  }else{
    if(fallbackCopy(payload)){
      notify('Extracted '+nodes.length+' text nodes! Switch back to Figma Text Diff.','#a6e3a1');
    }else{
      notify('Clipboard blocked. Copy manually from console (Ctrl+Shift+J).','#f38ba8');
      console.log('FIGMA_TEXT_DIFF_DATA:');
      console.log(payload);
    }
  }
})();`.trim();

    return 'javascript:' + encodeURIComponent(code);
  }
}
