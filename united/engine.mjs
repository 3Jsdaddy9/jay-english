import { ACADEMY, PLAYERS, POSITIONS, playerById } from './catalog.mjs';
export const dateKey = (time=Date.now()) => new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(time);
export const freshState = () => ({version:1,revision:0,tutorial:false,balance:0,owned:[],lineup:ACADEMY.map(p=>p.id),completed:[],rewards:{},days:{},reviews:{},sessions:[],feedback:[],observations:[],badges:[],active:null,history:{version:1,lessons:{},words:{},practice:null}});
export const questionsOf = data => data.chapters.flatMap(c=>c.matches.flatMap(m=>m.questions));
export const dueQuestions = (state,bank,day) => {
 const seen=new Set();
 return bank.filter(q=>{const r=state.reviews[q.family];if(r&&r.due<=day&&!seen.has(q.family)){seen.add(q.family);return true;}return false;});
};
const nextDay=(day,days)=>new Date(Date.parse(`${day}T12:00:00+09:00`)+days*86400000).toISOString().slice(0,10);
const daily=(s,day)=>s.days[day]??={basic:null,review:null,earned:0};
export function award(s,key,amount,day){
 if(Object.hasOwn(s.rewards,key))return 0;
 const d=daily(s,day), value=Math.min(amount,140-d.earned);
 s.rewards[key]=value;s.balance+=value;d.earned+=value;return value;
}
export function welcome(s){if(s.tutorial)return;s.tutorial=true;s.balance+=80;s.rewards.tutorial=80;}
export function startSession(s,bank,mode='basic',chapter=null,time=Date.now()){
 if(!s.tutorial)throw Error('먼저 입단 안내를 마쳐 주세요.');
 if(s.active&&!s.active.done)return;
 const day=dateKey(time),d=daily(s,day),due=dueQuestions(s,bank,day);
 if(mode==='basic'&&d.basic)mode='practice';
 if(mode==='review'&&d.review)throw Error('오늘의 추가 복습을 마쳤어요. 자유 연습은 계속할 수 있어요.');
 let chosen=[];
 if(mode==='practice')chosen=bank.filter(q=>!chapter||q.chapter===chapter||q.match===chapter).slice(0,8);
 if(mode==='review')chosen=due.slice(0,4);
 if(mode==='basic'){
  const unseen=bank.filter(q=>!s.completed.includes(q.id));
  chosen=due.slice(0,unseen.length?2:8);
  chosen.push(...unseen.filter(q=>!chosen.some(c=>c.id===q.id)).slice(0,8-chosen.length));
 }
 if(!chosen.length)throw Error(mode==='review'?'아직 복습할 날짜가 아니에요.':'오늘 예정된 학습을 모두 마쳤어요. 자유 연습을 골라 주세요.');
 const id=mode==='practice'?`practice-${time}`:`${day}-${mode}`;
 s.active={id,day,mode,ids:chosen.map(q=>q.id),index:0,results:[],selected:[],hint:false,attempts:0,phase:'answer',message:'',started:time,itemStarted:time,done:false,earned:0};
 if(mode!=='practice')d[mode]=id;
}
export function selectAnswer(s,q,value){
 const a=s.active;if(!a||a.done||a.phase==='correct')return;
 const opts=a.phase==='repair'?q.repair.options:q.options;
 if(!opts.includes(value))return;
 if(q.kind==='order'&&a.phase!=='repair')a.selected=a.selected.includes(value)?a.selected.filter(v=>v!==value):[...a.selected,value];
 else a.selected=[value];
 a.message='';
}
export function showHint(s){const a=s.active;if(a&&!a.done&&a.phase==='answer'){a.hint=true;}}
function updateReview(s,q,day){
 const r=s.reviews[q.family];if(r?.last===day)return;
 const stage=r?Math.min(r.stage+1,3):0;
 s.reviews[q.family]={stage,last:day,due:nextDay(day,[1,2,4,7][stage])};
}
function updateBadges(s){
 const results=s.sessions.filter(a=>a.mode!=='practice').flatMap(a=>a.results);
 for(const skill of ['word','core','modifier','reference','meaning']){
  const rows=results.filter(r=>r.skill===skill),good=rows.filter(r=>r.independent);
  if(new Set(good.map(r=>r.family)).size>=3&&new Set(good.map(r=>r.day)).size>=2&&good.some(r=>r.source==='transfer')&&rows.slice(-2).length===2&&rows.slice(-2).every(r=>r.independent)&&!s.badges.includes(skill))s.badges.push(skill);
 }
}
export function submitAnswer(s,q,time=Date.now()){
 const a=s.active;if(!a||a.done||a.phase==='correct'||a.ids[a.index]!==q.id)return;
 const repair=a.phase==='repair';
 const target=repair?[q.repair.answer]:Array.isArray(q.answer)?q.answer:[q.answer];
 if(a.selected.length!==target.length)throw Error(q.kind==='order'&&!repair?'모든 조각을 순서대로 골라 주세요.':'답을 하나 골라 주세요.');
 if(!target.every((v,i)=>a.selected[i]===v)){
  a.attempts++;a.selected=[];
  if(a.attempts>=2){a.phase='repair';a.hint=true;a.message='코치와 함께 한 번 더 확인해 보자.';}
  else a.message='다시 문장을 살펴보자. 힌트를 써도 포인트는 같아.';
  return;
 }
 const independent=a.attempts===0&&!a.hint&&!repair;
 const actualDay=dateKey(time);if(a.mode!=='practice')daily(s,actualDay)[a.mode]=a.id;
 const earned=a.mode==='practice'?0:award(s,`${a.id}:${q.id}`,10,actualDay);
 a.results.push({qid:q.id,family:q.family,skill:q.skill,source:q.source,day:actualDay,independent,hint:a.hint,attempts:a.attempts,coached:repair,seconds:Math.max(0,Math.round((time-a.itemStarted)/1000)),earned});
 a.earned+=earned;a.phase='correct';a.message=repair?q.repair.explanation:q.explanation;
 if(a.mode!=='practice'){if(!s.completed.includes(q.id))s.completed.push(q.id);updateReview(s,q,actualDay);}
}
export function nextQuestion(s,time=Date.now()){
 const a=s.active;if(!a||a.done||a.phase!=='correct')return;
 if(a.index+1===a.ids.length){
  a.done=true;const actualDay=dateKey(time);if(a.mode!=='practice')daily(s,actualDay)[a.mode]=a.id;if(a.mode==='basic'&&a.ids.length===8)a.earned+=award(s,`${a.id}:finish`,20,actualDay);
  s.sessions.push(structuredClone(a));s.sessions=s.sessions.slice(-365);updateBadges(s);return;
 }
 a.index++;a.selected=[];a.hint=false;a.attempts=0;a.phase='answer';a.message='';a.itemStarted=time;
}
export function buyPlayer(s,id){
 const p=PLAYERS.find(v=>v.id===id);if(!p)throw Error('선수를 찾을 수 없어요.');
 if(s.owned.includes(id))return;
 if(s.balance<p.price)throw Error(`${p.price-s.balance}P를 더 모으면 영입할 수 있어요.`);
 s.balance-=p.price;s.owned.push(id);
}
export function setLineup(s,index,id){
 const p=playerById(id);if(!Number.isInteger(index)||index<0||index>=11||!p||p.position!==POSITIONS[index])throw Error('이 자리에 맞는 포지션의 선수를 골라 주세요.');
 if(!id.startsWith('academy-')&&!s.owned.includes(id))throw Error('먼저 영입해야 해요.');
 const previous=s.lineup.indexOf(id),old=s.lineup[index];s.lineup[index]=id;if(previous>=0&&previous!==index)s.lineup[previous]=old;
}
export function saveFeedback(s,rating,difficulty,note){
 if(!['great','okay','boring'].includes(rating)||!['easy','right','hard'].includes(difficulty))throw Error('재미와 난이도를 하나씩 골라 주세요.');
 const sessionId=s.active?.done?s.active.id:s.sessions.at(-1)?.id??'general';
 const row={sessionId,rating,difficulty,note:String(note).slice(0,500),at:new Date().toISOString()};
 s.feedback=s.feedback.filter(f=>f.sessionId!==sessionId);s.feedback.push(row);
}
