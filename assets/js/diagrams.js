/* Interactive diagrams (inline SVG + vanilla JS, no libraries) */
(function(){
  'use strict';
  var NS='http://www.w3.org/2000/svg';
  var EN=window.App&&App.lang==='en';
  var C={wine:'#9a3412',wine2:'#b4441a',wine3:'#c2410c',dk:'#292524',brass:'#d97706',brass2:'#fbbf24',lt:'#fef3c7',cream:'#faf6f1',sub:'#fde8d4',ok:'#1d4ed8',bad:'#b91c1c',ink:'#292524',muted:'#57534e',paper:'#fffdfa',line:'#e6d6c4'};
  var S=EN?{see:'See in lesson',ayah:'Verse',hadith:'Hadith',err:'The diagram could not be loaded; all the evidence is given below.',sep:'. ',comma:', ',more:'More points',done:'ticked',of:' of ',reset:'Clear ticks',refs:' references'}
    :{see:'سبق میں دیکھیں',ayah:'آیت',hadith:'حدیث',err:'خاکہ لوڈ نہیں ہو سکا؛ تمام دلائل نیچے موجود ہیں۔',sep:'۔ ',comma:'، ',more:'مزید نکات',done:'نشان زد',of:' میں سے ',reset:'نشان صاف کریں',refs:' حوالے'};
  function el(tag,attrs,parent){var e=document.createElementNS(NS,tag);for(var k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e;}
  function txt(parent,x,y,s,size,fill,weight,maxW,anchor){if(anchor&&!EN)anchor=anchor==='start'?'end':'start';var t=el('text',{x:x,y:y,'text-anchor':anchor||'middle','dominant-baseline':'middle','font-size':size,fill:fill||'#fff','font-weight':weight||400},parent);t.textContent=s;if(maxW){try{var w=t.getComputedTextLength();if(w>maxW)t.setAttribute('font-size',Math.max(9,Math.floor(size*maxW/w)));}catch(e){}}return t;}
  function esc(s){return window.App?App.esc(s):s;}
  var ARRUN=/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDF9\uFDFB-\uFDFF\uFE70-\uFEFF]+(?:[ \u00A0]+[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDF9\uFDFB-\uFDFF\uFE70-\uFEFF]+)*/g;
  function escw(s){s=esc(s);return EN?s.replace(ARRUN,function(m){return '<span lang="ar" dir="rtl" class="arq">'+m+'</span>';}):s;}
  function refHTML(r){
    var tok=r[0],key=r[1],R=window.REF[tok];if(!R)return '';
    var here=R.a?' · <a href="'+R.a+'">'+S.see+'</a>':'';
    var link='<span class="refline"><a href="'+R.u+'" target="_blank" rel="noopener">'+esc(R.l)+'</a>'+here+'</span>';
    if(tok.charAt(0)==='Q') return '<div class="dref"><p class="ar qr" lang="ar">'+esc(R.ar)+'</p><p class="ur">'+esc(R.tr)+'</p>'+link+'</div>';
    return '<div class="dref"><b>'+escw(R.t)+'</b>'+((key||R.k)?'<p class="ar" lang="ar">«'+esc(key||R.k)+'»</p>':'')+link+'</div>';
  }
  function show(panel,node,extra){
    panel.innerHTML='<h3>'+escw(node.label)+'</h3>'+(node.desc?'<p style="margin:.2em 0">'+escw(node.desc)+'</p>':'')+(extra||'')+'<div class="refs">'+(node.refs||[]).map(refHTML).join('')+'</div>';
    panel.style.animation='none';void panel.offsetWidth;panel.style.animation='';
  }
  function makeNode(g,onAct,label){
    g.setAttribute('class','node');g.setAttribute('tabindex','0');g.setAttribute('role','button');g.setAttribute('aria-label',label);g.setAttribute('aria-pressed','false');
    g.addEventListener('click',onAct);
    g.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();onAct();}});
  }
  function setActive(host,g){host.querySelectorAll('.node').forEach(function(n){n.classList.remove('active');n.setAttribute('aria-pressed','false');});host.querySelectorAll('.chipbtn').forEach(function(x){x.setAttribute('aria-pressed','false');});if(g){g.classList.add('active');g.setAttribute('aria-pressed','true');}}
  function dots(g,refs,cx,cy){refs.forEach(function(r,k){el('circle',{cx:cx-((refs.length-1)*14)/2+k*14,cy:cy,r:5,fill:r[0][0]==='Q'?C.brass2:C.lt,stroke:C.dk,'stroke-width':1},g);});}
  function legend(svg,W,Hh){
    var lg=el('g',{'aria-hidden':'true'},svg),x1=EN?20:W-20,x2=EN?100:W-100,a=EN?'start':'end';
    el('circle',{cx:x1,cy:Hh-16,r:6,fill:C.brass2,stroke:C.dk},lg);txt(lg,EN?x1+12:x1-12,Hh-14,S.ayah,14,C.muted,400,0,a);
    el('circle',{cx:x2,cy:Hh-16,r:6,fill:C.lt,stroke:C.dk},lg);txt(lg,EN?x2+12:x2-12,Hh-14,S.hadith,14,C.muted,400,0,a);
  }
  function chipsRow(host,chips,panel,title){
    if(!chips||!chips.length)return;
    var wrap=document.createElement('div');
    wrap.innerHTML='<h3 style="margin:14px 0 0;color:var(--wine)">'+escw(title||S.more)+'</h3>';
    var row=document.createElement('div');row.className='chips';
    chips.forEach(function(c){var b=document.createElement('button');b.type='button';b.className='chipbtn';b.textContent=c.label;b.setAttribute('aria-pressed','false');
      b.addEventListener('click',function(){setActive(host,null);b.setAttribute('aria-pressed','true');show(panel,c);});
      row.appendChild(b);});
    wrap.appendChild(row);host.insertBefore(wrap,panel);
  }
  function scaffold(host){var holder=document.createElement('div');var panel=document.createElement('div');panel.className='dpanel';panel.setAttribute('aria-live','polite');host.appendChild(holder);host.appendChild(panel);return [holder,panel];}
  function onResize(f){var rt,w0=0;window.addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(f,150);});}
  var R={};
  /* flow / timeline: any number of stages (up to ~6) */
  R.flow=function(host,D){
    var hp=scaffold(host),holder=hp[0],panel=hp[1],cur=0;
    function draw(){
      holder.innerHTML='';var n=D.nodes.length,wide=host.clientWidth>=760;
      var gap=26,W=wide?1000:420,w=wide?Math.floor((W-28-(n-1)*gap)/n):360,h=wide?150:96,Hh=wide?250:n*124+40;
      var svg=el('svg',{viewBox:'0 0 '+W+' '+Hh,role:'group','aria-label':D.title},holder);
      var defs=el('defs',{},svg);var m=el('marker',{id:'arr-'+host.dataset.diagram,viewBox:'0 0 10 10',refX:'8',refY:'5',markerWidth:'7',markerHeight:'7',orient:'auto-start-reverse'},defs);el('path',{d:'M0 0L10 5L0 10z',fill:C.brass},m);
      D.nodes.forEach(function(nd,i){
        var x,y;
        if(wide){x=EN?14+i*(w+gap):W-14-i*(w+gap)-w;y=44;}else{x=30;y=12+i*124;}
        if(i<n-1){ if(wide) el('line',{x1:EN?x+w+2:x-2,y1:y+h/2,x2:EN?x+w+gap-4:x-gap+4,y2:y+h/2,stroke:C.brass,'stroke-width':4,'marker-end':'url(#arr-'+host.dataset.diagram+')'},svg); else el('line',{x1:W/2,y1:y+h+2,x2:W/2,y2:y+h+24,stroke:C.brass,'stroke-width':4,'marker-end':'url(#arr-'+host.dataset.diagram+')'},svg); }
        var g=el('g',{},svg);
        el('rect',{class:'shape',x:x,y:y,width:w,height:h,rx:20,fill:i%2?C.wine2:C.wine,stroke:C.brass2,'stroke-width':2},g);
        el('circle',{cx:EN?x+8:x+w-8,cy:y+8,r:18,fill:C.brass,stroke:C.dk,'stroke-width':1.5},g);
        txt(g,EN?x+8:x+w-8,y+10,App.ud(i+1),18,'#1c1917',700);
        txt(g,x+w/2,y+(wide?h*0.40:h*0.36),nd.label,wide?22:25,C.cream,700,w-22);
        txt(g,x+w/2,y+(wide?h*0.66:h*0.70),nd.sub||'',wide?15:17,C.sub,400,w-18);
        dots(g,nd.refs,x+w/2,y+h-(wide?16:12));
        makeNode(g,function(){cur=i;setActive(host,g);show(panel,nd);},App.ud(i+1)+S.sep+nd.label+S.comma+(nd.sub||''));
        if(i===cur)setActive(host,g);
      });
      legend(svg,W,Hh);
    }
    draw();show(panel,D.nodes[0]);onResize(draw);
  };
  /* tree: root + n branches */
  R.tree=function(host,D){
    var hp=scaffold(host),holder=hp[0],panel=hp[1],cur=-1;
    function draw(){
      holder.innerHTML='';var n=D.nodes.length,wide=host.clientWidth>=700;
      var W=wide?1000:500,rows=Math.ceil(n/2),Hh=wide?440:250+rows*200;
      var svg=el('svg',{viewBox:'0 0 '+W+' '+Hh,role:'group','aria-label':D.title},holder);
      var rx=W/2,ry=72,fork=wide?190:170,bw=wide?Math.min(210,Math.floor((W-40)/n)-14):210;
      var pos=D.nodes.map(function(nd,i){
        if(wide){var sp=(W-40)/n;return [EN?20+sp*(i+.5):W-20-sp*(i+.5),310];}
        var r=Math.floor(i/2),c=i%2,last=(i===n-1&&n%2===1);
        var x=last?W/2:((c===0)!==EN?370:130);return [x,300+r*200];
      });
      el('path',{d:'M'+rx+' '+(ry+50)+' L'+rx+' '+fork,stroke:C.brass,'stroke-width':10,'stroke-linecap':'round',fill:'none'},svg);
      pos.forEach(function(p){el('path',{d:'M'+rx+' '+fork+' C '+rx+' '+(fork+50)+', '+p[0]+' '+(p[1]-110)+', '+p[0]+' '+(p[1]-54),stroke:C.brass,'stroke-width':5,fill:'none','stroke-linecap':'round'},svg);});
      D.nodes.forEach(function(nd,i){
        var p=pos[i],g=el('g',{},svg);
        el('rect',{class:'shape',x:p[0]-bw/2,y:p[1]-54,width:bw,height:108,rx:26,fill:i%2?C.wine2:C.wine,stroke:C.brass2,'stroke-width':2},g);
        txt(g,p[0],p[1]-16,nd.label,24,C.cream,700,bw-22);txt(g,p[0],p[1]+18,nd.sub||'',15,C.sub,400,bw-18);
        dots(g,nd.refs,p[0],p[1]+40);
        makeNode(g,function(){cur=i;setActive(host,g);show(panel,nd);},nd.label+S.comma+(nd.sub||''));
        if(cur===i)setActive(host,g);
      });
      var g=el('g',{},svg);
      el('circle',{class:'shape',cx:rx,cy:ry,r:56,fill:C.brass,stroke:C.dk,'stroke-width':3},g);
      txt(g,rx,ry+2,D.root.label,26,'#1c1917',700,100);
      makeNode(g,function(){cur=-1;setActive(host,g);show(panel,D.root);},D.root.label);
      if(cur===-1)setActive(host,g);
      legend(svg,W,Hh);
    }
    draw();show(panel,D.root);onResize(draw);
  };
  /* wheel: centre + n segments */
  R.wheel=function(host,D){
    var hp=scaffold(host),holder=hp[0],panel=hp[1];holder.style.maxWidth='540px';holder.style.margin='0 auto';
    var svg=el('svg',{viewBox:'0 0 500 520',role:'group','aria-label':D.title},holder);
    var cx=250,cy=250,r1=95,r2=235,n=D.nodes.length,step=360/n,cols=[C.wine,C.wine2,C.wine3,C.dk,C.wine2,C.wine];
    function pt(r,a){return [cx+r*Math.sin(a),cy-r*Math.cos(a)];}
    D.nodes.forEach(function(nd,i){
      var a0=(i*step-step/2+1.5)*Math.PI/180,a1=((i+1)*step-step/2-1.5)*Math.PI/180;
      if(!EN){a0=-a0;a1=-a1;}
      var p1=pt(r2,a0),p2=pt(r2,a1),p3=pt(r1,a1),p4=pt(r1,a0),sw=EN?1:0;
      var g=el('g',{},svg);
      el('path',{class:'shape',d:'M'+p1+' A'+r2+' '+r2+' 0 0 '+sw+' '+p2+' L'+p3+' A'+r1+' '+r1+' 0 0 '+(1-sw)+' '+p4+' Z',fill:cols[i%cols.length],stroke:C.brass2,'stroke-width':2},g);
      var am=(EN?1:-1)*(i*step)*Math.PI/180,c=pt((r1+r2)/2,am);
      txt(g,c[0],c[1]-30,App.ud(i+1),20,C.brass2,700);
      txt(g,c[0],c[1]+2,nd.label,28,C.cream,700,130);
      txt(g,c[0],c[1]+32,nd.sub||'',15,C.sub,400,130);
      dots(g,nd.refs,c[0],c[1]+54);
      makeNode(g,function(){setActive(host,g);show(panel,nd);},App.ud(i+1)+S.sep+nd.label+S.comma+(nd.sub||''));
    });
    var g=el('g',{},svg);el('circle',{class:'shape',cx:cx,cy:cy,r:r1-8,fill:C.brass,stroke:C.dk,'stroke-width':3},g);
    txt(g,cx,cy-10,D.center.label,30,'#1c1917',700,150);txt(g,cx,cy+26,D.center.sub||'',15,'#292524',400,150);
    makeNode(g,function(){setActive(host,g);show(panel,D.center);},D.center.label);
    legend(svg,500,520);
    setActive(host,svg.querySelector('.node'));show(panel,D.nodes[0]);
  };
  /* split: two contrasting panels (✓ / ✗) + chips */
  R.split=function(host,D){
    var hp=scaffold(host),holder=hp[0],panel=hp[1],cur='left';
    function draw(){
      holder.innerHTML='';var wide=host.clientWidth>=700;
      var W=wide?1000:440,pw=wide?470:400,ph=wide?330:300,Hh=wide?370:2*ph+80;
      var svg=el('svg',{viewBox:'0 0 '+W+' '+Hh,role:'group','aria-label':D.title},holder);
      ['left','right'].forEach(function(side,k){
        var P=D[side],ok=P.tone==='ok',first=(k===0);
        var x=wide?((first===EN)?14:W-14-pw):20,y=wide?14:14+k*(ph+50);
        var g=el('g',{},svg);
        el('rect',{class:'shape',x:x,y:y,width:pw,height:ph,rx:24,fill:ok?C.wine:C.dk,stroke:ok?C.brass2:C.bad,'stroke-width':3,'stroke-dasharray':ok?'none':'10 6'},g);
        var ix=EN?x+40:x+pw-40;
        el('circle',{cx:ix,cy:y+40,r:24,fill:ok?C.ok:C.bad,stroke:C.lt,'stroke-width':2},g);
        txt(g,ix,y+42,ok?'\u2713':'\u2717',26,'#fff',700);
        txt(g,EN?x+76:x+pw-76,y+36,P.label,24,C.cream,700,pw-110,EN?'start':'end');
        txt(g,EN?x+76:x+pw-76,y+70,P.sub||'',16,C.sub,400,pw-110,EN?'start':'end');
        (P.items||[]).forEach(function(it,j){
          var yy=y+116+j*44,bx=EN?x+34:x+pw-34;
          el('rect',{x:x+18,y:yy-18,width:pw-36,height:36,rx:10,fill:'rgba(255,255,255,.08)',stroke:'rgba(241,226,191,.35)'},g);
          txt(g,bx,yy+1,ok?'\u2713':'\u2717',16,ok?C.lt:'#fecaca',700);
          txt(g,EN?bx+20:bx-20,yy+1,it,16,C.cream,400,pw-90,EN?'start':'end');
        });
        dots(g,P.refs,x+pw/2,y+ph-18);
        makeNode(g,function(){cur=side;setActive(host,g);show(panel,P);},(ok?'\u2713 ':'\u2717 ')+P.label+S.comma+(P.sub||''));
        if(cur===side)setActive(host,g);
      });
      if(wide){el('line',{x1:W/2,y1:30,x2:W/2,y2:ph-10,stroke:C.brass,'stroke-width':2,'stroke-dasharray':'4 6'},svg);}
      legend(svg,W,Hh);
    }
    draw();chipsRow(host,D.chips,panel,D.chipsTitle);show(panel,D.left);onResize(draw);
  };
  /* checklist: tick each protection, stored locally */
  R.checklist=function(host,D){
    var KEY='ummah-kitab-check-'+host.dataset.diagram,st={};
    try{st=JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch(e){st={};}
    function save(){try{localStorage.setItem(KEY,JSON.stringify(st));}catch(e){}}
    var hp=scaffold(host),holder=hp[0],panel=hp[1],cur=0;
    var bar=document.createElement('div');bar.className='cl-bar';host.insertBefore(bar,panel);
    function counter(){var n=D.items.length,k=D.items.filter(function(_,i){return st[i];}).length;
      bar.innerHTML='<span><b>'+App.ud(k)+'</b>'+S.of+App.ud(n)+' '+S.done+'</span> <button type="button" class="chipbtn" data-clr>'+S.reset+'</button>';
      bar.querySelector('[data-clr]').onclick=function(){st={};save();draw();counter();};}
    function draw(){
      holder.innerHTML='';var n=D.items.length,wide=host.clientWidth>=700,cols=wide?3:1,rows=Math.ceil(n/cols);
      var W=wide?1000:420,cw=wide?310:380,chh=wide?112:84,gx=wide?(W-cols*cw)/(cols+1):20,gy=16,Hh=rows*(chh+gy)+gy+30;
      var svg=el('svg',{viewBox:'0 0 '+W+' '+Hh,role:'group','aria-label':D.title},holder);
      D.items.forEach(function(it,i){
        var c=i%cols,r=Math.floor(i/cols);if(!EN)c=cols-1-c;
        var x=gx+c*(cw+gx),y=gy+r*(chh+gy),on=!!st[i],g=el('g',{},svg);
        el('rect',{class:'shape',x:x,y:y,width:cw,height:chh,rx:18,fill:on?C.wine:C.paper,stroke:on?C.brass:C.wine3,'stroke-width':2},g);
        var bx=EN?x+20:x+cw-48;
        el('rect',{x:bx,y:y+chh/2-14,width:28,height:28,rx:7,fill:on?C.ok:'#fff',stroke:on?C.lt:C.wine3,'stroke-width':2},g);
        if(on)txt(g,bx+14,y+chh/2+1,'\u2713',20,'#fff',700);
        txt(g,EN?x+62:x+cw-62,y+chh/2-(wide?14:10),App.ud(i+1)+S.sep+it.label,wide?20:19,on?C.cream:C.wine,700,cw-80,EN?'start':'end');
        txt(g,EN?x+62:x+cw-62,y+chh/2+(wide?18:16),App.ud(it.refs.length)+S.refs,13,on?C.sub:C.muted,400,cw-80,EN?'start':'end');
        makeNode(g,function(){cur=i;st[i]=true;save();draw();counter();show(panel,it);},App.ud(i+1)+S.sep+it.label+(on?' \u2713':''));
        if(i===cur)setActive(host,g);
      });
      var sel=holder.querySelectorAll('.node')[cur];if(sel){sel.classList.add('active');sel.setAttribute('aria-pressed','true');}
      legend(svg,W,Hh);
    }
    draw();counter();show(panel,D.items[0]);onResize(draw);
  };
  document.addEventListener('DOMContentLoaded',function(){
    document.querySelectorAll('[data-diagram]').forEach(function(host){
      var D=(window.DIAGRAMS||{})[host.dataset.diagram];if(!D||!R[D.type])return;
      try{R[D.type](host,D);}catch(e){console.error(e);host.insertAdjacentHTML('beforeend','<p>'+S.err+'</p>');}
    });
  });
})();
