const BASE={total:253,audits:22,specialists:13,tmo:5,compliance:90.66};
const specialistNames=['E-01','E-02','E-03','E-04','E-05','E-06','E-07','E-08','E-09','E-10'];
const reasons=['Cliente no desea el servicio','Cliente no ubicado','Edificio sin acceso','Dirección no localizada','Inconveniente operativo','Limitación en el domicilio'];
const attributeLabels={
 'SST':['Antes de seguridad','ATS y PETAR','Protección','Registro móvil','Uso de EPP'],
 'Herramientas':['Equipo y ferretería','Herramientas','Kit de fibra'],
 'Lineamiento Externo':['Acometida','Orden en altura','Técnica correcta','Uso correcto','Cono','Escalera','Arnés'],
 'Trato y Presentación Cliente':['Atención','Presentación','Uniforme','Kit limpieza','Puntualidad'],
 'Vehicular':['Accesorios','Condiciones','Documentación','Estado estético','Funcionamiento','Logotipo','Seguridad'],
 'Lineamiento Interno':['Tiempo apoyo','Coordinación','Infraestructura','Etiquetado','Roseta','Orden repliegue','Trabajo','Potencia NAP','Power Meter','Ruta segura','Tendido FO','Validación']
};
const baseScores={'SST':93.07,'Herramientas':81.36,'Lineamiento Externo':88.42,'Trato y Presentación Cliente':80.41,'Vehicular':93.28,'Lineamiento Interno':96.89};
const state={period:'last7',partner:'HOME',installation:'Horizontal'};
function clamp(n,min,max){return Math.max(min,Math.min(max,n))}
function factor(){const p={all:1,september:.78,last7:.42}[state.period];const partner=state.partner==='HOME'?1:.88;const inst=state.installation==='Horizontal'?1:.72;return p*partner*inst}
function offset(){return (state.partner==='HOME'?2:-3)+(state.installation==='Horizontal'?1:-2)+({all:1,september:0,last7:-1}[state.period])}
function dataset(){
 const f=factor(),o=offset();
 const audits=Math.max(3,Math.round(BASE.audits*f));
 const total=Math.max(audits,Math.round(BASE.total*({all:1,september:.66,last7:.28}[state.period])));
 const specialists=Math.max(3,Math.min(13,Math.round(BASE.specialists*Math.sqrt(f))));
 const tmo=clamp(BASE.tmo+(state.partner==='BMP'?.45:-.15)+(state.installation==='Vertical'?.35:0)+(state.period==='last7'?.1:0),3.4,7);
 const people=specialistNames.slice(0,Math.max(6,specialists)).map((name,i)=>({name,compliance:clamp(100-i*2.35+o-(i%3),62,100),tmo:clamp(tmo+1.45-i*.31+(i%2)*.16,.8,7),audits:Math.max(1,Math.round((audits/(specialists||1))*1.7-i*.13))}));
 const final=Math.max(1,Math.round(audits*.73)),failed=Math.max(1,Math.round(audits*.18)),rescheduled=Math.max(0,audits-final-failed);
 const general=clamp(BASE.compliance+o*.45,72,98.9);
 return {audits,total,specialists,tmo,people,general,statuses:[['Finalizada',final,''],['Fallida',failed,'red'],['Reprogramada',rescheduled,'yellow']],weeks:state.period==='all'?[Math.round(audits*.36),Math.round(audits*.29),Math.round(audits*.2),Math.max(1,audits-Math.round(audits*.85))]:[Math.max(1,Math.round(audits*.7)),Math.max(1,audits-Math.round(audits*.7))]};
}
function renderBars(id,items,key,max,suffix='',color=''){document.getElementById(id).innerHTML=items.map(x=>`<div><b>${x.name}</b><span ${color?`style="width:${x[key]/max*100}%;background:${color}"`:`style="width:${x[key]/max*100}%"`}>${key==='compliance'?x[key].toFixed(0):x[key].toFixed(key==='tmo'?1:0)}${suffix}</span></div>`).join('')}
function renderAttributes(d){let n=0;document.getElementById('attributeGrid').innerHTML=Object.entries(attributeLabels).map(([title,labels])=>{const score=clamp(baseScores[title]+offset()*.4,68,99);const body=labels.map((label,i)=>{const cumple=clamp(Math.round(score-12+((i*9+n*5)%20)),40,100);const noCumple=clamp(100-cumple-(i%3)*7,0,28);const na=100-cumple-noCumple;return `<div title="${label}: ${cumple}% cumple, ${na}% no aplica, ${noCumple}% no cumple"><span style="height:${cumple}%"></span><i style="height:${na}%"></i><b style="height:${noCumple}%"></b><small>${label}</small></div>`}).join('');n++;return `<div class="card"><h3>${title}<em>${score.toFixed(2)} %</em></h3><div class="stacked">${body}</div></div>`}).join('')}
function render(){
 const d=dataset(),pct=d.audits/d.total*100;
 document.getElementById('kpiAudits').textContent=`${d.audits} / ${d.total}`;document.getElementById('kpiProgress').textContent=`${pct.toFixed(2)} % completado`;document.getElementById('kpiSpecialists').textContent=d.specialists;document.getElementById('kpiTmo').textContent=`${String(Math.floor(d.tmo)).padStart(2,'0')}:${String(Math.round((d.tmo%1)*60)).padStart(2,'0')}`;
 document.getElementById('attrAudits').textContent=`${d.audits} / ${d.total}`;document.getElementById('attrProgress').textContent=`${pct.toFixed(2)} % completado`;document.getElementById('attrCompliance').textContent=`${d.general.toFixed(2)} %`;document.getElementById('summaryTotal').innerHTML=`${d.total}<small>Total instalaciones</small>`;document.getElementById('summaryAudited').innerHTML=`${d.audits}<small>Auditadas</small>`;document.getElementById('summaryAdvance').innerHTML=`${pct.toFixed(0)} %<small>Avance</small>`;
 renderBars('compliance',d.people,'compliance',100,'%');renderBars('tmo',d.people,'tmo',7,'','#0cad7f');renderBars('audits',d.people,'audits',Math.max(...d.people.map(x=>x.audits)),'','#0cad7f');
 document.getElementById('weekly').innerHTML=d.weeks.map((v,i)=>`<div style="height:${Math.max(22,v/Math.max(...d.weeks)*82)}%"><b>${v}</b><span>Semana ${i+1}</span></div>`).join('');
 const maxStatus=Math.max(...d.statuses.map(x=>x[1]));document.getElementById('statuses').innerHTML=d.statuses.map(x=>`<div><b>${x[0]}</b><span class="${x[2]}" style="width:${Math.max(12,x[1]/maxStatus*88)}%">${x[1]}</span></div>`).join('');
 document.getElementById('reasons').innerHTML=reasons.map((x,i)=>{const v=Math.max(0,Math.round((d.statuses[1][1]+d.statuses[2][1])/(i+3)));return `<div><b>${x}</b><span class="${i<3?'red':'yellow'}" style="width:${Math.max(8,90-i*8)}%">${v}</span></div>`}).join('');
 renderAttributes(d);document.getElementById('filterStatus').textContent=`Filtro aplicado: ${document.querySelector('#period option:checked').textContent} · ${state.partner} · ${state.installation}`;
}
function setSegment(id,value){document.querySelectorAll(`#${id} button`).forEach(b=>b.classList.toggle('on',b.dataset.value===value))}
document.getElementById('period').onchange=e=>state.period=e.target.value;
document.querySelectorAll('#partner button').forEach(b=>b.onclick=()=>{state.partner=b.dataset.value;setSegment('partner',state.partner)});
document.querySelectorAll('#installation button').forEach(b=>b.onclick=()=>{state.installation=b.dataset.value;setSegment('installation',state.installation)});
document.getElementById('updateData').onclick=()=>{render();document.getElementById('updateData').textContent='Datos actualizados ✓';setTimeout(()=>document.getElementById('updateData').textContent='Actualizar datos',1200)};
document.getElementById('resetFilters').onclick=()=>{state.period='all';state.partner='HOME';state.installation='Horizontal';document.getElementById('period').value='all';setSegment('partner','HOME');setSegment('installation','Horizontal');render()};
document.getElementById('exportCsv').onclick=()=>{const d=dataset();const rows=[['Especialista','Cumplimiento','TMO','Auditorias'],...d.people.map(x=>[x.name,x.compliance.toFixed(1),x.tmo.toFixed(1),x.audits])];const blob=new Blob([rows.map(r=>r.join(';')).join('\n')],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='dashboard_qa_filtrado.csv';a.click();URL.revokeObjectURL(a.href)};
function show(id){document.querySelectorAll('.view').forEach(x=>x.classList.toggle('active',x.id===id));document.querySelectorAll('nav button').forEach(x=>x.classList.toggle('active',x.dataset.view===id));window.scrollTo({top:0,behavior:'smooth'})}document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>show(b.dataset.view));document.getElementById('back').onclick=()=>show('performance');render();
