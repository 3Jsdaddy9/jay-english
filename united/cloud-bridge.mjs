import { readState,downloadFile,setReadOnly } from './store.mjs';
import { toast } from './ui.mjs';
const CLOUD='https://jay-united-learning.justdog10.chatgpt.site';
export function setupBridge(){
 const strip=document.querySelector('#sync-status');
 if(localStorage.getItem('jay-cloud-migrated')===CLOUD){setReadOnly(true);strip.querySelector('span').textContent='기록을 옮겼어요. 연동 화면에서 이어서 학습하세요.';}
 let pending=null;
 strip.querySelector('button').addEventListener('click',()=>{
  if(pending){toast('열린 연동 화면에서 로그인을 마쳐 주세요.');return;}
  const nonce=crypto.randomUUID(),child=window.open(CLOUD+'/united/index.html?from='+encodeURIComponent(location.origin)+'&transfer='+nonce,'jay-united-cloud');
  if(!child){toast('팝업을 허용한 뒤 다시 눌러 주세요.');return;}
  pending={nonce,child};setReadOnly(true);
  toast('새 창에서 같은 보호자 계정으로 로그인해 주세요.');
  const watcher=setInterval(()=>{if(child.closed||!pending){clearInterval(watcher);pending=null;if(localStorage.getItem('jay-cloud-migrated')!==CLOUD)setReadOnly(false);}},1000);
 });
 window.addEventListener('message',async event=>{
  if(!pending||event.origin!==CLOUD||event.source!==pending.child||event.data?.nonce!==pending.nonce)return;
  if(event.data.type==='jay-transfer-ready'){
   const record={app:'jay-united',version:1,state:await readState()};
   downloadFile('JAY_연동전_기록백업.json',record);
   event.source.postMessage({type:'jay-record-transfer',nonce:pending.nonce,record},CLOUD);
  }else if(event.data.type==='jay-transfer-complete'){
   localStorage.setItem('jay-cloud-migrated',CLOUD);pending=null;strip.querySelector('span').textContent='기록을 옮겼어요. 연동 화면에서 이어서 학습하세요.';toast('이제 PC와 휴대폰에서 연동 화면을 사용하세요.');
  }
 });
}
