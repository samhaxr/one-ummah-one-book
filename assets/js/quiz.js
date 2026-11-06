/* Quiz engine: shuffle, instant feedback with reference, score, best score, retry */
(function(){
  'use strict';
  var EN=App.lang==='en';var KEYS=EN?['A','B','C','D','E']:['الف','ب','ج','د','ہ'];var PER_TOPIC=4;
  var S=EN?{final:'Final quiz',see:'See in lesson',retrywrong:' (reviewing wrong answers)',q:'Question ',of:' of ',correct:' · Correct: ',ca:'Correct answer',ok:'✓ Correct!',no:'✗ Correct answer: ',ref:'Reference: ',next:'Next question →',result:'See result',
     m1:'Excellent, masha\'Allah!',m2:'Very good',m3:'Good effort, review the lesson',m4:'Re-read the lesson and try again',newbest:'🎉 New best score saved!',yourbest:'Your best score: ',retry:'Try again (new order)',onlywrong:'Wrong ones only (',back:'Back to the lesson',wrongh:'Questions you got wrong',cab:'Correct answer:'}
   :{final:'جامع کوئز',see:'سبق میں دیکھیں',retrywrong:' (غلط سوالات کی دہرائی)',q:'سوال ',of:' از ',correct:' · درست: ',ca:'درست جواب',ok:'✓ درست!',no:'✗ درست جواب: ',ref:'حوالہ: ',next:'اگلا سوال ←',result:'نتیجہ دیکھیں',
     m1:'ماشاء اللہ! بہترین',m2:'بہت اچھا',m3:'اچھی کوشش، سبق دوبارہ دیکھ لیں',m4:'سبق دوبارہ پڑھ کر پھر کوشش کریں',newbest:'🎉 نیا بہترین نتیجہ محفوظ ہو گیا!',yourbest:'آپ کا بہترین نتیجہ: ',retry:'دوبارہ کوشش (نئی ترتیب)',onlywrong:'صرف غلط سوالات (',back:'سبق پر واپس',wrongh:'جن سوالات میں غلطی ہوئی',cab:'درست جواب:'};
  function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}
  function esc(s){return App.esc(s);}
  var ARRUN=/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDF9\uFDFB-\uFDFF\uFE70-\uFEFF]+(?:[ \u00A0]+[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDF9\uFDFB-\uFDFF\uFE70-\uFEFF]+)*/g;
  function fmt(s){s=esc(s);if(EN)return s.replace(ARRUN,function(m){return '<span lang="ar" dir="rtl" class="arq">'+m+'</span>';});return s.replace(/«([^»]+)»/g,function(m,x){return /[\u064B-\u0652]/.test(x)?'<span lang="ar" class="arq">«'+x+'»</span>':m;});}
  var host,tabs,state;
  function topicTitle(id){if(id==='all')return S.final;var t=(window.TOPICS||[]).filter(function(x){return x.id===id;})[0];return t?t.title:'';}
  function build(id,only){
    var pool;
    if(only)pool=only;
    else if(id==='all'){pool=[];Object.keys(window.QUIZ).forEach(function(k){shuffle(window.QUIZ[k]).slice(0,PER_TOPIC).forEach(function(q){pool.push(q);});});pool=shuffle(pool);}
    else pool=shuffle(window.QUIZ[id]);
    var qs=pool.map(function(q){var idx=shuffle(q.o.map(function(_,i){return i;}));return {src:q,q:q.q,opts:idx.map(function(i){return q.o[i];}),ans:idx.indexOf(0),e:q.e,r:q.r};});
    state={id:id,qs:qs,i:0,score:0,wrong:[],partial:!!only};
    render();
  }
  function refLink(r){var R=window.REF[r];if(!R)return '';return '<a href="'+R.u+'" target="_blank" rel="noopener">'+esc(R.l)+'</a>'+(R.a?' · <a href="'+R.a+'">'+S.see+'</a>':'');}
  function render(){
    var s=state,q=s.qs[s.i],n=s.qs.length;
    host.innerHTML='<div class="qmeta"><span><b>'+esc(topicTitle(s.id))+'</b>'+(s.partial?S.retrywrong:'')+'</span><span>'+S.q+App.ud(s.i+1)+S.of+App.ud(n)+S.correct+App.ud(s.score)+'</span></div>'+
      '<div class="progress" style="margin:8px 0"><span style="width:'+Math.round(s.i/n*100)+'%"></span></div>'+
      '<p class="qtext" id="qtext" tabindex="-1">'+fmt(q.q)+'</p>'+
      '<div class="opts" role="group" aria-labelledby="qtext">'+q.opts.map(function(o,i){return '<button type="button" class="opt" data-i="'+i+'"><span class="k">'+KEYS[i]+'</span><span>'+fmt(o)+'</span></button>';}).join('')+'</div>'+
      '<div class="feedback" role="status"></div>';
    host.querySelectorAll('.opt').forEach(function(b){b.addEventListener('click',function(){answer(+b.dataset.i);});});
    var qt=document.getElementById('qtext');if(qt&&s.i>0)qt.focus();
  }
  function answer(i){
    var s=state,q=s.qs[s.i],ok=i===q.ans;
    if(ok)s.score++;else s.wrong.push(q);
    host.querySelectorAll('.opt').forEach(function(b){var k=+b.dataset.i;b.disabled=true;if(k===q.ans)b.classList.add('correct');if(k===i&&!ok)b.classList.add('wrong');if(k===q.ans)b.setAttribute('aria-label',S.ca);});
    var fb=host.querySelector('.feedback');
    fb.className='feedback show '+(ok?'ok':'no');
    fb.innerHTML='<b>'+(ok?S.ok:S.no+fmt(q.opts[q.ans]))+'</b><p class="ex" style="margin:.3em 0">'+fmt(q.e)+'</p><p style="margin:0">'+S.ref+refLink(q.r)+'</p>'+
      '<p style="margin:.5em 0 0"><button type="button" class="btn" id="next">'+(s.i<s.qs.length-1?S.next:S.result)+'</button></p>';
    var nx=document.getElementById('next');nx.focus();
    nx.addEventListener('click',function(){if(s.i<s.qs.length-1){s.i++;render();}else finish();});
  }
  function finish(){
    var s=state,n=s.qs.length,pct=Math.round(s.score/n*100),best=false;
    if(!s.partial)best=App.setBest(s.id,pct);
    var msg=pct>=90?S.m1:pct>=70?S.m2:pct>=50?S.m3:S.m4;
    var bestNow=App.load().best[s.id];
    var t=(window.TOPICS||[]).filter(function(x){return x.id===s.id;})[0];
    host.innerHTML='<div class="result"><p class="qmeta" style="justify-content:center"><b>'+esc(topicTitle(s.id))+'</b></p><div class="score">'+App.ud(s.score)+' / '+App.ud(n)+'</div><p style="font-size:1.3rem;margin:0">'+App.pct(pct)+' · '+msg+'</p>'+
      (s.partial?'':'<p>'+(best?S.newbest:S.yourbest+(bestNow==null?'-':App.pct(bestNow)))+'</p>')+
      '<div class="actions" style="justify-content:center"><button class="btn" type="button" id="retry">'+S.retry+'</button>'+(s.wrong.length?'<button class="btn ghost" type="button" id="retryw">'+S.onlywrong+App.ud(s.wrong.length)+')</button>':'')+(t?'<a class="btn gold" href="'+t.slug+'.html">'+S.back+'</a>':'')+'</div>'+
      (s.wrong.length?'<div class="review"><h3 style="color:var(--wine)">'+S.wrongh+'</h3><ol>'+s.wrong.map(function(q){return '<li>'+fmt(q.q)+'<br><b>'+S.cab+'</b> '+fmt(q.opts[q.ans])+' · '+refLink(q.r)+'</li>';}).join('')+'</ol></div>':'')+'</div>';
    document.getElementById('retry').addEventListener('click',function(){build(s.id);});
    var rw=document.getElementById('retryw');if(rw)rw.addEventListener('click',function(){build(s.id,s.wrong.map(function(q){return q.src;}));});
    host.querySelector('.score').setAttribute('tabindex','-1');host.querySelector('.score').focus();
  }
  function select(id){
    tabs.forEach(function(b){b.setAttribute('aria-selected',b.dataset.t===id);});
    try{history.replaceState(null,'','?t='+id);}catch(e){}
    build(id);
  }
  document.addEventListener('DOMContentLoaded',function(){
    host=document.getElementById('quiz');if(!host||!window.QUIZ)return;
    tabs=[].slice.call(document.querySelectorAll('.qtabs button'));
    tabs.forEach(function(b){b.addEventListener('click',function(){select(b.dataset.t);});});
    var m=/[?&]t=(t[1-9]|all)/.exec(location.search);select(m?m[1]:'t1');
  });
})();
