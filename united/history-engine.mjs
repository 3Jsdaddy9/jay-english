import { dateKey, award } from './engine.mjs';
export const WORDS=['unite','empire','transport','message','ally','protect','peace'];
export const LESSON_WORDS=[['unite','empire'],['transport','message'],['ally','protect'],['peace'],[]];
export const emptyHistory=()=>({version:1,lessons:{},words:{},practice:null});
export const historyOf=s=>s.history??emptyHistory();
export const ensureHistory=s=>s.history??=emptyHistory();
export const addDays=(day,n)=>new Date(Date.parse(`${day}T12:00:00Z`)+n*86400000).toISOString().slice(0,10);
export function lessonAvailable(s,id,day=dateKey()){
 const h=historyOf(s);if(!Number.isInteger(id)||id<1||id>5)return false;
 if(h.lessons[id]?.paper)return true;
 if(id>1&&!h.lessons[id-1]?.paper)return false;
 return !Object.entries(h.lessons).some(([key,l])=>Number(key)!==id&&(l.read===day||l.video===day||l.paper===day));
}
export function completeLessonStep(s,id,step,time=Date.now()){
 if(!s.tutorial)throw Error('먼저 아카데미에 입단해 주세요.');
 const day=dateKey(time);if(!lessonAvailable(s,id,day))throw Error('앞 차시를 마친 뒤 다음 날에 시작해요. 오늘은 배운 단어를 복습해요.');
 if(!['read','video','paper','checked'].includes(step))return;
 const h=ensureHistory(s),l=h.lessons[id]??={read:null,video:null,paper:null,checked:null};
 if(l[step])return;
 const previous={video:'read',paper:'video',checked:'paper'}[step];
 if(previous&&!l[previous])throw Error('앞 단계를 먼저 마쳐 주세요.');
 l[step]=day;
 if(step==='video')for(const word of LESSON_WORDS[id-1])h.words[word]??={stage:0,due:day,last:null,reviews:0,lapses:0,grade:null,introduced:day,parentReset:null};
 if(step==='paper')award(s,`history:lesson:${id}`,60,day);
}
export function resetWord(s,word,time=Date.now()){
 const r=ensureHistory(s).words[word];if(!WORDS.includes(word)||!r)return;
 const day=dateKey(time);r.due=addDays(day,1);r.stage=0;r.parentReset=day;
}
export const dueWords=(s,day=dateKey())=>Object.entries(historyOf(s).words).filter(([,r])=>r.due<=day&&r.last!==day).sort(([a,x],[b,y])=>x.due.localeCompare(y.due)||x.stage-y.stage||a.localeCompare(b)).map(([w])=>w);
export const reviewedToday=(s,day=dateKey())=>Object.values(historyOf(s).words).filter(r=>r.last===day).length;
