/* Core: language, navigation, progress (localStorage, shared by both languages), text toggles */
(function(){
  'use strict';
  var KEY='ummah-kitab-v1', LKEY='ummah-kitab-lang';
  var LANG=document.documentElement.lang==='en'?'en':'ur';
  var S={
    ur:{saved:'سبق مکمل کے طور پر محفوظ ہو گیا ✓',read:'✓ پڑھ لیا',notread:'ابھی نہیں پڑھا',isdone:'✓ یہ سبق مکمل ہے',done:'✓ سبق مکمل ہو گیا',pct:'٪',
        morear:'مکمل عربی متن (مع سند) دکھائیں',hidear:'عربی متن چھپائیں',moretr:'مکمل ترجمہ پڑھیں',lesstr:'ترجمہ مختصر کریں',
        confirm:'کیا آپ واقعی اپنی تمام پیش رفت صاف کرنا چاہتے ہیں؟',cleared:'پیش رفت صاف کر دی گئی'},
    en:{saved:'Lesson saved as complete ✓',read:'✓ Read',notread:'Not read yet',isdone:'✓ This lesson is complete',done:'✓ Lesson complete',pct:'%',
        morear:'Show full Arabic text (with isnad)',hidear:'Hide Arabic text',moretr:'Read full translation',lesstr:'Show less',
        confirm:'Do you really want to clear all your progress?',cleared:'Progress cleared'}
  };
  function t(k){return (S[LANG]&&S[LANG][k])||S.ur[k]||k;}
  var UD='۰۱۲۳۴۵۶۷۸۹';
  function ud(n){return LANG==='en'?String(n):String(n).replace(/[0-9]/g,function(d){return UD[d];});}
  function pct(n){return ud(n)+t('pct');}
  function load(){try{var s=JSON.parse(localStorage.getItem(KEY)||'{}');s.read=s.read||{};s.best=s.best||{};return s;}catch(e){return {read:{},best:{}};}}
  function save(s){try{localStorage.setItem(KEY,JSON.stringify(s));}catch(e){}}
  function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  var toastT;
  function toast(msg){var el=document.querySelector('.toast');if(!el)return;el.textContent=msg;el.classList.add('show');clearTimeout(toastT);toastT=setTimeout(function(){el.classList.remove('show');},2600);}
  function markRead(id,silent){var s=load();if(!s.read[id]){s.read[id]=Date.now();save(s);if(!silent)toast(t('saved'));}refresh();}
  function setBest(id,p){var s=load();var prev=s.best[id];if(prev==null||p>prev){s.best[id]=p;save(s);refresh();return true;}return false;}
  function refresh(){
    var s=load(), topics=window.TOPICS||[];
    document.querySelectorAll('[data-readstate]').forEach(function(el){var r=s.read[el.dataset.readstate];el.textContent=r?t('read'):t('notread');});
    document.querySelectorAll('[data-readchip]').forEach(function(el){var r=s.read[el.dataset.readchip];el.textContent=r?t('read'):t('notread');el.classList.toggle('ok',!!r);});
    document.querySelectorAll('[data-best]').forEach(function(el){var b=s.best[el.dataset.best];el.textContent=b==null?'-':pct(b);});
    document.querySelectorAll('button[data-markread]').forEach(function(el){var r=s.read[el.dataset.markread];el.textContent=r?t('isdone'):t('done');});
    var nr=topics.filter(function(x){return s.read[x.id];}).length;
    var nq=topics.filter(function(x){return s.best[x.id]!=null;}).length;
    var a=document.getElementById('st-read'); if(a)a.textContent=ud(nr)+'/'+ud(topics.length);
    var b=document.getElementById('st-quiz'); if(b)b.textContent=ud(nq)+'/'+ud(topics.length);
    var c=document.getElementById('st-all'); if(c)c.textContent=s.best.all==null?'-':pct(s.best.all);
    var bar=document.getElementById('overall-bar'); if(bar&&topics.length)bar.style.width=Math.round((nr+nq+(s.best.all!=null?1:0))/(2*topics.length+1)*100)+'%';
  }
  /* section currently in view, so switching language keeps the reader's place */
  function currentSection(){
    if(location.hash)return location.hash;
    var best=null,els=document.querySelectorAll('main section[id], main article[id], main h3[id]');
    for(var i=0;i<els.length;i++){var r=els[i].getBoundingClientRect();if(r.top<=120)best=els[i];else break;}
    return best&&window.scrollY>200?'#'+best.id:'';
  }
  function switchTo(lang,href){
    try{localStorage.setItem(LKEY,lang);}catch(e){}
    var q=location.search.replace(/([?&])lang=(en|ur)(&|$)/,'$1').replace(/[?&]$/,'');
    location.href=href.split('#')[0].split('?')[0]+q+currentSection();
  }
  window.App={load:load,save:save,markRead:markRead,setBest:setBest,refresh:refresh,toast:toast,ud:ud,pct:pct,esc:esc,t:t,lang:LANG};
  document.addEventListener('DOMContentLoaded',function(){
    document.querySelectorAll('.lang-switch a[data-lang]').forEach(function(a){
      a.addEventListener('click',function(e){e.preventDefault();if(a.dataset.lang===LANG)return;switchTo(a.dataset.lang,a.getAttribute('href'));});
    });
    var mb=document.querySelector('.menu-btn'),nav=document.getElementById('nav');
    if(mb&&nav)mb.addEventListener('click',function(){var o=nav.classList.toggle('open');mb.setAttribute('aria-expanded',o);});
    document.querySelectorAll('[data-more]').forEach(function(btn){
      var card=btn.closest('.card');var full=card&&card.querySelector('.ar-full');
      btn.addEventListener('click',function(){var open=btn.getAttribute('aria-expanded')==='true';if(full)full.hidden=open;btn.setAttribute('aria-expanded',!open);btn.textContent=open?t('morear'):t('hidear');});
    });
    document.querySelectorAll('.card.hadith > p.ur').forEach(function(p){
      if(p.textContent.length<650)return;
      p.classList.add('clamp');
      var b=document.createElement('button');b.type='button';b.className='more';b.setAttribute('aria-expanded','false');b.textContent=t('moretr');
      b.addEventListener('click',function(){var o=p.classList.toggle('clamp');b.setAttribute('aria-expanded',!o);b.textContent=o?t('moretr'):t('lesstr');});
      p.insertAdjacentElement('afterend',b);
    });
    document.querySelectorAll('button[data-markread]').forEach(function(b){b.addEventListener('click',function(){markRead(b.dataset.markread);});});
    var sum=document.getElementById('summary'),ct=document.querySelector('[data-topic]');
    if(sum&&ct&&'IntersectionObserver' in window){var tm;var io=new IntersectionObserver(function(en){en.forEach(function(e){if(e.isIntersecting){tm=setTimeout(function(){markRead(ct.dataset.topic);io.disconnect();},1500);}else clearTimeout(tm);});},{threshold:.6});io.observe(sum);}
    document.querySelectorAll('[data-reset]').forEach(function(b){b.addEventListener('click',function(){if(confirm(t('confirm'))){try{localStorage.removeItem(KEY);}catch(e){}refresh();toast(t('cleared'));}});});
    refresh();
  });
})();
