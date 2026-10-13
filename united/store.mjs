import { freshState } from './engine.mjs';
import { ALL_PLAYERS, POSITIONS, SKILLS } from './catalog.mjs';
let connection;
const channel=typeof window!=='undefined'&&typeof BroadcastChannel==='function'?new BroadcastChannel('jay-united-updates'):null;
export const onRemoteChange=fn=>{if(channel)channel.onmessage=fn;};
export function openStore(){
 return new Promise((resolve,reject)=>{
  const request=indexedDB.open('jay-united-v1',1);
  request.onupgradeneeded=()=>request.result.createObjectStore('state');
  request.onerror=()=>reject(Error('학습 기록 저장소를 열지 못했어요. 일반 브라우저 창에서 다시 열어 주세요.'));
  request.onblocked=()=>reject(Error('다른 Jay 게임 탭을 닫고 다시 열어 주세요.'));
  request.onsuccess=()=>{connection=request.result;connection.onversionchange=()=>connection.close();resolve();};
 });
}
export function readState(){
 return new Promise((resolve,reject)=>{
  const tx=connection.transaction('state','readonly'),request=tx.objectStore('state').get('jay');
  request.onsuccess=()=>resolve(request.result??freshState());request.onerror=()=>reject(request.error);
 });
}
export function mutate(change){
 return new Promise((resolve,reject)=>{
  const tx=connection.transaction('state','readwrite'),table=tx.objectStore('state');let result,problem;
  table.get('jay').onsuccess=event=>{
   try{result=event.target.result??freshState();change(result);result.revision++;table.put(result,'jay');}
   catch(error){problem=error;tx.abort();}
  };
  tx.oncomplete=()=>{channel?.postMessage(result.revision);resolve(result);};
  tx.onabort=()=>reject(problem??Error('저장하지 못했어요. 이 창을 유지하고 다시 시도해 주세요.'));
  tx.onerror=()=>{problem=Error('저장 공간을 확인해 주세요. 변경 사항은 아직 저장되지 않았어요.');};
 });
}
export function validateBackup(value,bank){
 const fail=()=>{throw Error('이 게임에서 내보낸 정상적인 기록 파일이 아니에요. 기존 기록은 바뀌지 않았어요.');};
 const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
 const strings=x=>Array.isArray(x)&&x.every(v=>typeof v==='string');
 const num=x=>Number.isSafeInteger(x)&&x>=0&&x<=1000000;
 const day=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x+'T00:00:00Z'))&&new Date(x+'T00:00:00Z').toISOString().slice(0,10)===x;
 if(!obj(value)||value.app!=='jay-united'||value.version!==1||!obj(value.state))fail();
 const s=value.state,ids=new Set(bank.map(q=>q.id)),families=new Set(bank.map(q=>q.family)),players=new Set(ALL_PLAYERS.map(p=>p.id));
 if(s.version!==1||typeof s.tutorial!=='boolean'||!num(s.revision)||!num(s.balance)||!strings(s.owned)||!s.owned.every(v=>players.has(v))||new Set(s.owned).size!==s.owned.length)fail();
 if(!strings(s.lineup)||s.lineup.length!==11||new Set(s.lineup).size!==11||!s.lineup.every((id,i)=>ALL_PLAYERS.some(p=>p.id===id&&p.position===POSITIONS[i])&&(id.startsWith('academy-')||s.owned.includes(id))))fail();
 if(!strings(s.completed)||!s.completed.every(id=>ids.has(id))||!strings(s.badges)||!s.badges.every(k=>Object.hasOwn(SKILLS,k)))fail();
 if(!obj(s.rewards)||Object.values(s.rewards).some(v=>!num(v))||!obj(s.days)||!obj(s.reviews))fail();
 for(const [key,d] of Object.entries(s.days))if(!day(key)||!obj(d)||!num(d.earned)||d.earned>140||!['basic','review'].every(k=>d[k]===null||typeof d[k]==='string'))fail();
 for(const [family,r] of Object.entries(s.reviews))if(!families.has(family)||!obj(r)||!num(r.stage)||r.stage>3||!day(r.due)||!day(r.last))fail();
 const result=r=>obj(r)&&ids.has(r.qid)&&families.has(r.family)&&Object.hasOwn(SKILLS,r.skill)&&['original','lesson-example','transfer'].includes(r.source)&&day(r.day)&&typeof r.independent==='boolean'&&typeof r.hint==='boolean'&&typeof r.coached==='boolean'&&num(r.attempts)&&num(r.seconds)&&num(r.earned);
 const session=a=>obj(a)&&typeof a.id==='string'&&day(a.day)&&['basic','review','practice'].includes(a.mode)&&strings(a.ids)&&a.ids.length>0&&a.ids.length<=8&&a.ids.every(id=>ids.has(id))&&num(a.index)&&a.index<a.ids.length&&Array.isArray(a.results)&&a.results.every(result)&&strings(a.selected)&&typeof a.hint==='boolean'&&num(a.attempts)&&['answer','repair','correct'].includes(a.phase)&&typeof a.message==='string'&&Number.isFinite(a.started)&&Number.isFinite(a.itemStarted)&&typeof a.done==='boolean'&&num(a.earned);
 if(s.active!==null&&!session(s.active))fail();
 if(!Array.isArray(s.sessions)||s.sessions.length>365||!s.sessions.every(session))fail();
 const coherent=a=>{
  if(new Set(a.ids).size!==a.ids.length)return false;
  const expected=a.phase==='correct'?a.index+1:a.index;
  if(a.results.length!==expected||a.done&&(a.phase!=='correct'||a.index!==a.ids.length-1))return false;
  if(a.phase==='repair'&&(a.attempts<2||!a.hint))return false;
  if(!a.results.every((r,i)=>{const q=bank.find(q=>q.id===a.ids[i]);return r.qid===q.id&&r.family===q.family&&r.skill===q.skill&&r.source===q.source&&r.independent===(!r.hint&&!r.coached&&r.attempts===0);}))return false;
  const q=bank.find(q=>q.id===a.ids[a.index]);
  const opts=a.phase==='repair'||a.results[a.index]?.coached?q.repair.options:q.options;
  if(new Set(a.selected).size!==a.selected.length||!a.selected.every(v=>opts.includes(v)))return false;
  const earned=a.results.reduce((n,r)=>n+r.earned,0);
  return a.earned>=earned&&a.earned<=earned+(a.done&&a.mode==='basic'&&a.ids.length===8?20:0);
 };
 if(s.active&&!coherent(s.active)||s.sessions.some(a=>!a.done||!coherent(a)))fail();
 if(new Set(s.completed).size!==s.completed.length)fail();
 if(!Array.isArray(s.feedback)||!s.feedback.every(f=>obj(f)&&typeof f.sessionId==='string'&&['great','okay','boring'].includes(f.rating)&&['easy','right','hard'].includes(f.difficulty)&&typeof f.note==='string'&&f.note.length<=500&&typeof f.at==='string'))fail();
 if(!Array.isArray(s.observations)||!s.observations.every(o=>obj(o)&&typeof o.note==='string'&&o.note.length<=1000&&typeof o.at==='string'))fail();
 return s;
}
export function downloadFile(name,data){
 const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
