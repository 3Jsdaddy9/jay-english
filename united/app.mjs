import { PLAYERS, playerById } from './catalog.mjs';
import { questionsOf, dateKey, welcome, startSession, selectAnswer, showHint, submitAnswer, nextQuestion, buyPlayer, setLineup, saveFeedback } from './engine.mjs';
import { openStore, readState, mutate, onRemoteChange, validateBackup, downloadFile } from './store.mjs';
import { shell, button, toast, openDialog, playerCard, escape as e } from './ui.mjs';
import { home, market, squad, slotDialog } from './views.mjs';
import { questionView, resultView } from './learning.mjs';
import { parentView, feedbackExport } from './parent.mjs';
import { historyHome, lessonView } from './history-views.mjs';
import { vocabularyView } from './vocabulary-view.mjs';
import { completeLessonStep, resetWord } from './history-engine.mjs';
import { startVocabulary, vocabularyHint, revealVocabulary, gradeVocabulary, nextVocabulary } from './vocabulary-engine.mjs';
let state,data,bank,course,busy=false,restoreCandidate=null;
const main=document.querySelector('#main'),dialog=document.querySelector('#dialog');
const route=()=>new RegExp('^#lesson/[1-5]$').test(location.hash)?'lesson':['home','archive','vocabulary','match','market','squad','parent'].includes(location.hash.slice(1))?location.hash.slice(1):'home';
function render(){
 const page=route();shell(state,page);
 switch(page){
  case 'home':main.innerHTML=historyHome(state,course);break;
  case 'archive':main.innerHTML=home(state,data,bank);break;
  case 'lesson':main.innerHTML=lessonView(state,course,Number(location.hash.split('/')[1]));break;
  case 'vocabulary':main.innerHTML=vocabularyView(state,course);break;
  case 'match':main.innerHTML=state.active?(state.active.done?resultView(state):questionView(state,bank)):`<section class="panel stack"><p class="eyebrow">READY TO PLAY</p><h1>오늘의 경기를 시작해 볼까?</h1><p>문장을 읽고, 뜻을 찾고, 선수 영입 포인트를 모아 봐.</p>${button(state.tutorial?'경기 시작':'아카데미 입단',state.tutorial?'start':'welcome')}</section>`;break;
  case 'market':main.innerHTML=market(state);break;
  case 'squad':main.innerHTML=squad(state);break;
  case 'parent':main.innerHTML=parentView(state,bank,course);break;
 }
 document.title=`${{home:'홈',lesson:'역사탐험 수업',vocabulary:'단어 훈련',archive:'이전 리그',match:'오늘의 경기',market:'선수 영입',squad:'나의 팀',parent:'학습 기록'}[page]} · JAY UNITED`;
}
function navigate(page){if(route()===page)render();else location.hash=page;}
function introduction(){openDialog(`<h2 id="dialog-title">Jay, 아카데미에 온 걸 환영해!</h2><div class="stack"><p><strong>1. 종이 읽기 → 영상 → 종이 문제</strong><br>오늘 만든 역사 수업으로 하루 20~30분만 함께해.</p><p><strong>2. 단어는 먼저 떠올린 뒤 답을 확인해.</strong><br>기억 안 나도 솔직하게 표시해. 포인트는 같아.</p><p><strong>3. 포인트로 원하는 선수를 영입해.</strong><br>첫 입단 선물은 80P! 선수 영입 화면에서 바로 쓸 수 있어.</p></div><div class="dialog-actions">${button('나중에','close','','secondary')}${button('입단하고 80P 받기','claim')}</div>`);}
async function change(fn){state=await mutate(fn);render();}
function currentQuestion(id){return bank.find(q=>q.id===id);}
async function handleAction(el){
 const action=el.dataset.action,id=el.dataset.player,qid=el.dataset.qid;
 if(busy)return;
 busy=true;
 try{
  switch(action){
   case 'lesson-step':await change(s=>completeLessonStep(s,Number(el.dataset.lesson),el.dataset.step));toast(el.dataset.step==='checked'?'부모 확인을 저장했어요.':'학습 단계를 저장했어.');break;
   case 'word-reset':await change(s=>resetWord(s,el.dataset.word));toast('내일 다시 확인하도록 저장했어요.');break;
   case 'vocab-start':await change(s=>startVocabulary(s));break;
   case 'vocab-hint':await change(s=>vocabularyHint(s,el.dataset.turn));break;
   case 'vocab-reveal':await change(s=>revealVocabulary(s,el.dataset.turn));break;
   case 'vocab-grade':await change(s=>gradeVocabulary(s,el.dataset.turn,el.dataset.grade));break;
   case 'vocab-next':await change(s=>nextVocabulary(s,el.dataset.turn));window.scrollTo(0,0);main.focus();break;
   case 'welcome':introduction();break;
   case 'claim':await change(welcome);dialog.close();toast('입단 축하해! 80P를 받았어.');navigate('home');break;
   case 'practice-menu':{const c=data.chapters.find(c=>c.id===el.dataset.chapter);openDialog(`<h2 id="dialog-title">${e(c.title)} · 자유 연습</h2><div class="stack">${c.matches.map((m,i)=>button(`${i+1}. ${e(m.title??'연습 경기')} · ${m.questions.length}문제`,'practice',`data-chapter="${m.id}"`,'secondary')).join('')}</div><p class="small muted">자유 연습은 포인트를 추가하지 않아요. 진행 중인 경기가 있으면 먼저 이어서 풀어요.</p><div class="dialog-actions">${button('닫기','close','','quiet')}</div>`);break;}
   case 'start':case 'review':case 'practice':
    if(!state.tutorial){introduction();break;}
    await change(s=>startSession(s,bank,action==='review'?'review':action==='practice'?'practice':'basic',el.dataset.chapter));if(dialog.open)dialog.close();navigate('match');window.scrollTo(0,0);break;
   case 'select':case 'hint':case 'submit':case 'next':{
    const q=currentQuestion(qid);if(!q)break;
    await change(s=>{if(s.active?.ids[s.active.index]!==qid)return;switch(action){case 'select':selectAnswer(s,q,el.dataset.value);break;case 'hint':showHint(s);break;case 'submit':submitAnswer(s,q);break;case 'next':nextQuestion(s);break;}});
    if(action==='next'){window.scrollTo(0,0);main.focus();}
    else{const target=[...main.querySelectorAll('[data-action]')].find(b=>b.dataset.action===action&&b.dataset.value===el.dataset.value&&!b.disabled);target?.focus({preventScroll:true});}
    break;
   }
   case 'buy':{const p=PLAYERS.find(p=>p.id===id);openDialog(`<h2 id="dialog-title">${e(p.label)} 영입</h2>${playerCard(p)}<p class="player-price" style="margin-top:16px">${p.price}P · 영입 후 ${state.balance-p.price}P</p><p class="small muted">선수는 한 번만 영입할 수 있어.</p><div class="dialog-actions">${button('돌아가기','close','','secondary')}${button('영입 확정','confirm-buy',`data-player="${id}"`)}</div>`);break;}
   case 'confirm-buy':await change(s=>buyPlayer(s,id));dialog.close();toast(`${playerById(id).label} 영입 완료! 나의 팀에 배치해 봐.`);break;
   case 'squad':navigate('squad');break;
   case 'slot':openDialog(slotDialog(state,Number(el.dataset.slot)));break;
   case 'assign':await change(s=>setLineup(s,Number(el.dataset.slot),id));dialog.close();toast('선발 명단을 저장했어.');break;
   case 'close':dialog.close();break;
   case 'backup':downloadFile(`JAY_전체기록_${dateKey()}.json`,{app:'jay-united',version:1,state});toast('전체 기록 파일을 다운로드했어요.');break;
   case 'export-feedback':downloadFile(`JAY_피드백_${dateKey()}.json`,feedbackExport(state,bank));toast('수정할 때 전달할 피드백 파일을 다운로드했어요.');break;
   case 'import':document.querySelector('#import-file').click();break;
   case 'confirm-import':{
    if(!restoreCandidate)break;
    downloadFile(`JAY_복원전백업_${Date.now()}.json`,{app:'jay-united',version:1,state});
    const restored=restoreCandidate;await change(s=>{Object.assign(s,restored);});restoreCandidate=null;dialog.close();toast('기록을 복원했어요.');break;
   }
  }
 }catch(error){toast(error instanceof Error?error.message:'처리하지 못했어요. 다시 시도해 주세요.');}
 finally{busy=false;}
}
document.addEventListener('click',event=>{const el=event.target.closest('[data-action]');if(el&&!el.disabled)void handleAction(el);});
window.addEventListener('hashchange',()=>{if(state){document.querySelector('#notice').textContent='';render();window.scrollTo(0,0);main.focus();}});
document.addEventListener('submit',async event=>{
 if(!['feedback-form','observation-form'].includes(event.target.id))return;
 event.preventDefault();if(busy)return;busy=true;
 try{const form=new FormData(event.target);if(event.target.id==='feedback-form'){await change(s=>saveFeedback(s,form.get('rating'),form.get('difficulty'),form.get('note')));toast('의견을 저장했어. 다음 버전을 만들 때 참고할게!');}else{const note=String(form.get('note')).trim();if(!note)throw Error('관찰한 내용을 적어 주세요.');await change(s=>s.observations.push({note:note.slice(0,1000),at:new Date().toISOString()}));toast('관찰 메모를 저장했어요.');}}
 catch(error){toast(error.message);}finally{busy=false;}
});
document.addEventListener('change',async event=>{
 if(event.target.id!=='import-file')return;const file=event.target.files[0];if(!file)return;
 try{if(file.size>2000000)throw Error('2MB 이하의 기록 파일을 골라 주세요.');restoreCandidate=validateBackup(JSON.parse(await file.text()),bank);openDialog(`<h2 id="dialog-title">이 기록으로 바꿀까요?</h2><p>학습 ${restoreCandidate.completed.length}문제 · ${restoreCandidate.balance}P · 영입 ${restoreCandidate.owned.length}명</p><p>역사탐험 ${Object.values(restoreCandidate.history.lessons).filter(l=>l.paper).length}차시 · 단어 ${Object.keys(restoreCandidate.history.words).length}개 포함</p><p>현재 기록 전체를 선택한 백업으로 교체합니다. 역사 기록이 없는 옛 백업을 고르면 역사 진행도 초기화됩니다. 복원 전 현재 기록 파일을 먼저 내려받습니다.</p><div class="dialog-actions">${button('취소','close','','secondary')}${button('백업하고 복원','confirm-import')}</div>`);}catch(error){toast(error instanceof SyntaxError?'JSON 기록 파일을 읽지 못했어요.':error.message);}
});
try{
 const response=await fetch('questions.json');if(!response.ok)throw Error('문제를 불러오지 못했어요. 실행 바로가기로 다시 열어 주세요.');data=await response.json();
 bank=data.chapters.flatMap(c=>c.matches.flatMap(m=>m.questions.map(q=>({...q,chapter:c.id,match:m.id}))));
 const courseResponse=await fetch('history-data.json');if(!courseResponse.ok)throw Error('역사 수업을 불러오지 못했어요. 인터넷 연결 후 새로고침해 주세요.');course=await courseResponse.json();
 await openStore();state=await readState();render();onRemoteChange(async()=>{state=await readState();render();});
 if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>toast('오프라인 준비를 하지 못했어요. 연결된 상태에서는 계속할 수 있어요.'));
}catch(error){main.innerHTML=`<section class="panel stack"><h1>경기장을 열지 못했어요.</h1><p>${e(error.message)}</p><a class="btn" href="./">다시 시도</a></section>`;}
