export const SKILLS = { word: '단어 감각', core: '문장의 중심', modifier: '설명 연결', reference: '가리키는 말', meaning: '전체 뜻' };
export const POSITIONS = ['FW','FW','FW','MF','MF','MF','DF','DF','DF','DF','GK'];
const academyNames = ['JAY','NOAH','LEO','FINN','KAI','LUCA','THEO','MAX','ELI','BEN','SAM'];
export const ACADEMY = academyNames.map((name,i)=>({id:`academy-${i}`,name,label:name,position:POSITIONS[i],number:[7,9,11,8,6,10,3,4,5,2,1][i],price:0,tier:'ACADEMY',color:'navy'}));
export const PLAYERS = [
 {id:'son',name:'SON',label:'손흥민',position:'FW',number:7,price:160,tier:'CAPTAIN',color:'green',image:'assets/son.webp'},
 {id:'haaland',name:'HAALAND',label:'엘링 홀란',position:'FW',number:9,price:240,tier:'STRIKER',color:'sky',image:'assets/haaland.webp'},
 {id:'mbappe',name:'MBAPPÉ',label:'킬리안 음바페',position:'FW',number:10,price:320,tier:'WORLD CLASS',color:'navy',image:'assets/mbappe.webp'},
 {id:'jay-pro',name:'JAY',label:'Jay의 데뷔 카드',position:'FW',number:7,price:80,tier:'FIRST SIGNING',color:'gold'},
 {id:'alex',name:'ALEX',label:'알렉스 · 아카데미',position:'MF',number:8,price:80,tier:'PLAYMAKER',color:'green'},
 {id:'rio',name:'RIO',label:'리오 · 아카데미',position:'DF',number:4,price:80,tier:'DEFENDER',color:'navy'},
 {id:'oliver',name:'OLIVER',label:'올리버 · 아카데미',position:'GK',number:1,price:160,tier:'SAFE HANDS',color:'gold'},
 {id:'mateo',name:'MATEO',label:'마테오 · 아카데미',position:'MF',number:10,price:160,tier:'CREATOR',color:'sky'}
];
export const ALL_PLAYERS = [...ACADEMY,...PLAYERS];
export const playerById = id => ALL_PLAYERS.find(p=>p.id===id);
export const VIDEOS = ['https://drive.google.com/file/d/1Dk6GE3I-7XuJ9Ek1GK6cXksV6MgCsz7m/view','https://drive.google.com/file/d/1tai6o389h3FnvDGo8g8Mql16Qs4iWCq2/view','https://drive.google.com/file/d/1XT5ex6MoPPT9Z6Wa7Pxo_SPOEr3VCTuV/view'];
