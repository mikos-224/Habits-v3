const K="nawyki_v2";
let d=JSON.parse(localStorage.getItem(K)||"null")||{habits:[],checks:{}};
let edit=null,emoji="🌱";
let selectedDate=localDate();

const $=s=>document.querySelector(s);
const $$=s=>document.querySelectorAll(s);

function localDate(dt=new Date()){
  const d=new Date(dt);
  d.setMinutes(d.getMinutes()-d.getTimezoneOffset());
  return d.toISOString().slice(0,10);
}
function dateFromKey(s){
  const [y,m,d]=s.split("-").map(Number);
  return new Date(y,m-1,d);
}
function shiftDate(s,n){
  const d=dateFromKey(s);
  d.setDate(d.getDate()+n);
  return localDate(d);
}
function dateLabel(s){
  if(s===localDate()) return "Dzisiaj";
  return dateFromKey(s).toLocaleDateString("pl-PL",{weekday:"long",day:"numeric",month:"long"});
}
function key(id,dt=selectedDate){
  return id+"|"+(typeof dt==="string"?dt:localDate(dt));
}
function done(id,dt=selectedDate){return d.checks[key(id,dt)]===true}
function save(){localStorage.setItem(K,JSON.stringify(d))}
function esc(s){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}

function count(id){
  return Object.keys(d.checks).filter(k=>k.startsWith(id+"|")&&d.checks[k]).length
}
function streak(id,start=selectedDate){
  let n=0,x=dateFromKey(start);
  while(done(id,localDate(x))){
    n++;
    x.setDate(x.getDate()-1);
  }
  return n;
}
function tracked(){
  const a=Object.keys(d.checks).map(x=>x.split("|")[1]).sort();
  return a.length?Math.max(1,Math.floor((dateFromKey(localDate())-dateFromKey(a[0]))/864e5)+1):1
}

function dateNavHTML(){
  const today=localDate();
  return `<div class="date-nav">
    <button class="date-nav-btn" id="prevDay" aria-label="Poprzedni dzień">‹</button>
    <div class="selected-date">
      <strong>${dateLabel(selectedDate)}</strong>
      <span>${selectedDate.split("-").reverse().join(".")}</span>
    </div>
    <button class="date-nav-btn" id="nextDay" aria-label="Następny dzień" ${selectedDate>=today?"disabled":""}>›</button>
  </div>`;
}
function bindDateNav(){
  const prev=$("#prevDay"),next=$("#nextDay");
  if(prev) prev.onclick=()=>{selectedDate=shiftDate(selectedDate,-1);render()};
  if(next) next.onclick=()=>{
    if(selectedDate<localDate()){
      selectedDate=shiftDate(selectedDate,1);
      render();
    }
  };
}

function render(){
  const total=d.habits.length;
  const today=d.habits.filter(h=>done(h,selectedDate)).length;
  const p=total?Math.round(today/total*100):0;

  $("#todayLabel").textContent=dateLabel(selectedDate);
  $("header h1").textContent=selectedDate===localDate()?"Dzisiaj":"Wybrany dzień";
  $("#count").textContent=total+" "+(total==1?"nawyk":"nawyków");
  $("#pct").textContent=p+"%";
  $("#ring").style.setProperty("--p",p+"%");
  $("#sumTitle").textContent=total&&today==total?"Wszystko zrobione!":today?"Zrobione "+today+" z "+total:"Zaczynamy!";
  $("#sumText").textContent=total?(today==total?"Rutyna z tego dnia zamknięta.":"Małe kroki robią różnicę."):"Dodaj pierwszy nawyk.";

  const nav=dateNavHTML();
  $("#list").innerHTML=nav+d.habits.map(h=>`
    <div class="habit card ${done(h,selectedDate)?"done":""}">
      <button class="check" data-check="${h.id}">${done(h,selectedDate)?"✓":h.emoji}</button>
      <div class="info">
        <div class="hname">${esc(h.name)}</div>
        <div class="meta">🔥 ${streak(h.id,selectedDate)} dni serii · ${count(h.id)} wykonań</div>
      </div>
      <button class="mini" data-edit="${h.id}">✎</button>
      <button class="mini" data-del="${h.id}">⋯</button>
    </div>`).join("");

  $("#empty").style.display=total?"none":"block";
  stats();
  bindDateNav();
  save();
}

function stats(){
  const days=tracked(),possible=d.habits.length*days;
  const doneN=Object.values(d.checks).filter(Boolean).length;
  $("#sHabits").textContent=d.habits.length;
  $("#sDone").textContent=doneN;
  $("#sMissed").textContent=Math.max(0,possible-doneN);
  $("#sRate").textContent=(possible?Math.round(doneN/possible*100):0)+"%";

  const ds=[];
  for(let i=6;i>=0;i--){
    const x=new Date();
    x.setDate(x.getDate()-i);
    ds.push(x);
  }
  $("#week").innerHTML=ds.map(x=>{
    const n=d.habits.length,a=d.habits.filter(h=>done(h,localDate(x))).length,b=n-a;
    return `<div class="day"><div class="stack">
      <div class="bar bad" style="height:${n?b/n*100:0}%"></div>
      <div class="bar good" style="height:${n?a/n*100:0}%"></div>
    </div><span>${x.toLocaleDateString("pl-PL",{weekday:"short"}).slice(0,2)}</span></div>`;
  }).join("");

  $("#hstats").innerHTML=d.habits.map(h=>{
    const p=Math.round(count(h.id)/days*100);
    return `<div class="hs"><span>${h.emoji}</span><div><b>${esc(h.name)}</b>
      <div class="track"><div class="fill" style="width:${Math.min(100,p)}%"></div></div>
      </div><span class="hp">${p}%</span></div>`;
  }).join("")||'<span class="muted">Brak danych.</span>';
}

function open(id=null){
  edit=id;
  const h=id&&d.habits.find(x=>x.id===id);
  $("#mtitle").textContent=id?"Edytuj nawyk":"Nowy nawyk";
  $("#name").value=h?h.name:"";
  emoji=h?h.emoji:"🌱";
  $("#emojis").innerHTML=["🌱","📚","💪","💧","🧘","🏃","🎵","🧹","📝","🧠","😴","🥗","🚶","🎨","💻","☀️"]
    .map(e=>`<button class="emoji ${e==emoji?"selected":""}" data-e="${e}">${e}</button>`).join("");
  $("#modal").classList.remove("hidden");
}
function close(){$("#modal").classList.add("hidden")}

$("#add").onclick=()=>open();
$("#add2").onclick=()=>open();
$("#close").onclick=close;
$("#cancel").onclick=close;

$("#save").onclick=()=>{
  const n=$("#name").value.trim();
  if(!n)return;
  if(edit){
    const h=d.habits.find(x=>x.id===edit);
    h.name=n;h.emoji=emoji;
  }else{
    d.habits.push({id:crypto.randomUUID(),name:n,emoji});
  }
  close();render();
};

$("#emojis").onclick=e=>{
  const b=e.target.closest("[data-e]");
  if(!b)return;
  emoji=b.dataset.e;
  $$(".emoji").forEach(x=>x.classList.toggle("selected",x.dataset.e==emoji));
};

$("#list").onclick=e=>{
  const c=e.target.closest("[data-check]");
  const ed=e.target.closest("[data-edit]");
  const del=e.target.closest("[data-del]");

  if(c){
    const k=key(c.dataset.check,selectedDate);
    d.checks[k]=!d.checks[k];
    if(!d.checks[k])delete d.checks[k];
    render();
  }else if(ed){
    open(ed.dataset.edit);
  }else if(del){
    const h=d.habits.find(x=>x.id===del.dataset.del);
    if(confirm("Usunąć nawyk „"+h.name+"” i jego historię?")){
      d.habits=d.habits.filter(x=>x.id!==h.id);
      Object.keys(d.checks).forEach(k=>{if(k.startsWith(h.id+"|"))delete d.checks[k]});
      render();
    }
  }
};

$$(".tab").forEach(b=>b.onclick=()=>{
  $$(".tab").forEach(x=>x.classList.remove("active"));
  $$(".page").forEach(x=>x.classList.remove("active"));
  b.classList.add("active");
  $("#"+b.dataset.tab).classList.add("active");
});

if("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js");
render();
