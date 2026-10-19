import { dateKey, award } from './engine.mjs';
import { ensureHistory, historyOf, dueWords, reviewedToday, addDays } from './history-engine.mjs';
export const INTERVALS=[1,3,7,14,30,60];
export const currentTurn=a=>a?`${a.day}:${a.index}:${a.queue[a.index]}`:'';
export function startVocabulary(s,time=Date.now()){
 if(!s.tutorial)throw Error('먼저 아카데미에 입단해 주세요.');
 const h=ensureHistory(s),day=dateKey(time);
 if(h.practice?.day===day&&!h.practice.done)return;
 const queue=dueWords(s,day).slice(0,Math.max(0,4-reviewedToday(s,day)));
 if(!queue.length)throw Error('오늘 예정된 단어 복습을 마쳤어요. 다음 복습일에 다시 만나요.');
 h.practice={day,queue,index:0,phase:'question',hint:false,done:false,results:[]};
}
function current(s,turn,time){const a=historyOf(s).practice;return a&&!a.done&&a.day===dateKey(time)&&currentTurn(a)===turn?a:null;}
export function vocabularyHint(s,turn,time=Date.now()){const a=current(s,turn,time);if(a?.phase==='question')a.hint=true;}
export function revealVocabulary(s,turn,time=Date.now()){const a=current(s,turn,time);if(a?.phase==='question')a.phase='revealed';}
export function gradeVocabulary(s,turn,grade,time=Date.now()){
 const a=current(s,turn,time);if(a?.phase!=='revealed'||!['again','hard','good'].includes(grade))return;
 const day=dateKey(time),word=a.queue[a.index],r=s.history.words[word],retry=r.last===day;
 if(a.hint&&grade==='good')grade='hard';
 let earned=0;
 if(!retry){
  if(grade==='good')r.stage=r.reviews?Math.min(r.stage+1,INTERVALS.length-1):0;
  else r.stage=grade==='again'?0:Math.max(0,r.stage-1);
  r.due=addDays(day,grade==='good'?INTERVALS[r.stage]:1);
  r.last=day;r.reviews++;r.grade=grade;
  if(grade==='again')r.lapses++;
  earned=award(s,`history:word:${day}:${word}`,10,day);
 }
 if(grade!=='good'&&!retry&&!a.queue.slice(a.index+1).includes(word))a.queue.push(word);
 a.results.push({word,grade,retry,earned});a.phase='rated';
}
export function nextVocabulary(s,turn,time=Date.now()){
 const a=current(s,turn,time);if(a?.phase!=='rated')return;
 if(a.index===a.queue.length-1){a.done=true;return;}
 a.index++;a.phase='question';a.hint=false;
}
