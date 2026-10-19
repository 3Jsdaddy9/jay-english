import { emptyHistory, WORDS, LESSON_WORDS } from './history-engine.mjs';
export function validateHistory(raw){
 const fail=()=>{throw Error('역사탐험 기록 형식을 확인해 주세요. 기존 기록은 바뀌지 않았어요.');};
 if(raw===undefined)return emptyHistory();
 const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
 const num=x=>Number.isSafeInteger(x)&&x>=0&&x<=1000000;
 const day=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x+'T00:00:00Z'))&&new Date(x+'T00:00:00Z').toISOString().slice(0,10)===x;
 const grade=g=>['again','hard','good'].includes(g);
 const h=raw;
 if(!obj(h)||h.version!==1||!obj(h.lessons)||!obj(h.words))fail();
 for(const [key,l] of Object.entries(h.lessons)){
  if(!/^[1-5]$/.test(key)||!obj(l)||!['read','video','paper','checked'].every(k=>l[k]===null||day(l[k])))fail();
  if(l.video&&(!l.read||l.video<l.read)||l.paper&&(!l.video||l.paper<l.video)||l.checked&&(!l.paper||l.checked<l.paper))fail();
  if(Number(key)>1&&l.read&&(!h.lessons[Number(key)-1]?.paper||h.lessons[Number(key)-1].paper>=l.read))fail();
 }
 for(const [word,r] of Object.entries(h.words)){
  if(!WORDS.includes(word)||!obj(r)||!num(r.stage)||r.stage>5||!day(r.due)||!day(r.introduced)||!(r.last===null||day(r.last))||!num(r.reviews)||!num(r.lapses)||r.lapses>r.reviews||!(r.grade===null||grade(r.grade))||!(r.parentReset===null||day(r.parentReset)))fail();
  if(!h.lessons[LESSON_WORDS.findIndex(ws=>ws.includes(word))+1]?.video)fail();
  if(r.reviews===0&&(r.last!==null||r.grade!==null)||r.reviews>0&&(r.last===null||r.grade===null)||r.last&&r.last<r.introduced)fail();
 }
 for(const [id,l] of Object.entries(h.lessons))if(l.video&&!LESSON_WORDS[Number(id)-1].every(w=>Object.hasOwn(h.words,w)))fail();
 const a=h.practice;
 if(a!==null){
  if(!obj(a)||!day(a.day)||!Array.isArray(a.queue)||a.queue.length<1||a.queue.length>8||!a.queue.every(w=>WORDS.includes(w)&&Object.hasOwn(h.words,w))||new Set(a.queue).size>4||a.queue.some(w=>a.queue.filter(x=>x===w).length>2)||!num(a.index)||a.index>=a.queue.length||!['question','revealed','rated'].includes(a.phase)||typeof a.hint!=='boolean'||typeof a.done!=='boolean'||!Array.isArray(a.results))fail();
  if(a.results.length!==a.index+(a.phase==='rated'?1:0)||a.done&&(a.phase!=='rated'||a.index!==a.queue.length-1))fail();
  if(!a.results.every((r,i)=>obj(r)&&r.word===a.queue[i]&&grade(r.grade)&&typeof r.retry==='boolean'&&r.retry===a.queue.slice(0,i).includes(r.word)&&num(r.earned)&&r.earned<=10&&(!r.retry||r.earned===0)))fail();
 }
 return structuredClone(h);
}
