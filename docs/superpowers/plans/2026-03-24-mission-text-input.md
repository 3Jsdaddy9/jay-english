# Mission Text Input & Parent Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Jay가 미션을 텍스트로 입력하고 제출하면 부모가 엄마 모드에서 확인 후 보너스 XP를 지급하는 엄마표 영어 피드백 루프를 구현한다.

**Architecture:** 단일 `index.html` 파일에 HTML/CSS/JS 모두 포함된 PWA. `localStorage`에 상태 저장. `todayMission` 필드를 `false | 'pending' | true`로 확장하고 `missionSubmissions` 배열을 신설하여 Jay의 답변과 부모 피드백을 영속화한다.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, localStorage, PWA (no build system)

---

## File Structure

- Modify: `index.html` — 전체 변경사항이 이 파일 하나에 집중됨
  - CSS 추가: textarea, pending badge, XP 선택 버튼, 칭찬 팝업
  - JS 수정: state model, mission 로직, mom mode, reward popup

---

### Task 1: State 모델 확장

**Files:**
- Modify: `index.html` (JS — `defaultState`, `getState`, `checkDailyReset`)

- [ ] **Step 1: `defaultState()` 에 `missionSubmissions` 추가**

`defaultState()` 반환 객체에 아래 필드 추가:
```js
missionSubmissions: []
// 각 항목 구조:
// { id, date, missionId, missionTitle, text, status:'pending'|'reviewed', baseXp, bonusXp, praiseMsg, notified }
```

- [ ] **Step 2: `getState()` 하위호환 처리**

기존 저장된 state에 `missionSubmissions`가 없을 수 있으므로:
```js
return {
  ...d, ...s,
  settings: { ...d.settings, ...(s.settings||{}) },
  missionSubmissions: s.missionSubmissions || []
};
```

- [ ] **Step 3: `checkDailyReset()` 에서 `todayMission` 처리 수정**

현재: `state.todayMission=false;`
변경: `todayMission`이 `'pending'` 상태인 날은 parent 미승인 → history에서 mission=false로 기록 (정직한 기록).
`true`인 경우만 완료로 기록:
```js
state.history.push({
  date: state.lastDate, xp: state.todayXp,
  ws: state.todayWordScout, reading: state.todayReading,
  mission: state.todayMission === true   // pending은 미완으로 기록
});
```
리셋 시에도 todayMission=false로 초기화 (기존 유지).

- [ ] **Step 4: 브라우저에서 수동 확인**

콘솔에서 `getState()` 실행 → `missionSubmissions: []` 존재 확인

- [ ] **Step 5: Commit**
```bash
cd "C:/AI/jay_english"
git add index.html
git commit -m "feat: extend state model for mission submissions"
```

---

### Task 2: Mission 입력 UI (textarea + 제출)

**Files:**
- Modify: `index.html` (CSS + JS — `MISSIONS`, `selectMission`, `completeMission`)

- [ ] **Step 1: `MISSIONS` 배열에 `placeholder` 추가**

```js
const MISSIONS = [
  { id:1, emoji:'📝', title:'한 줄 요약',        desc:'오늘 읽은 내용을 한 문장으로 말해봐 (한국어 OK!)', xp:15,
    placeholder:'오늘 이야기는... (한국어 OK!)' },
  { id:2, emoji:'⭐', title:'최애 문장',          desc:'가장 재미있었던 문장을 책에서 찾아 써봐',           xp:10,
    placeholder:'책에서 찾은 문장을 그대로 써봐 ✏️' },
  { id:3, emoji:'🔮', title:'다음 이야기 예측',   desc:'다음에 어떻게 될 것 같아? 영어나 한국어로 써봐',    xp:20,
    placeholder:'다음에는... (영어/한국어 OK!)' },
  { id:4, emoji:'✏️', title:'단어로 문장 만들기', desc:'오늘 Word Scout 단어 하나로 영어 문장 써봐',        xp:25,
    placeholder:'영어로 문장을 써봐! (예: I saw a...)' },
];
```

- [ ] **Step 2: CSS에 textarea 스타일 추가**

`</style>` 태그 바로 앞에 삽입:
```css
.mission-textarea {
  width: 100%; box-sizing: border-box;
  background: var(--surface); border: 2px solid var(--border);
  border-radius: 12px; color: var(--text); font-size: 15px;
  padding: 12px; margin-top: 12px; resize: none;
  font-family: inherit; line-height: 1.6; min-height: 90px;
  transition: border-color 0.2s;
}
.mission-textarea:focus { outline: none; border-color: var(--primary); }
.mission-textarea::placeholder { color: var(--text-muted); }
.char-hint { font-size: 12px; color: var(--text-muted); margin-top: 6px; text-align: right; }
.word-hint-tag {
  display: inline-block; background: rgba(108,99,255,0.15);
  border: 1px solid var(--primary); border-radius: 20px;
  padding: 3px 10px; font-size: 13px; color: var(--primary);
  font-weight: 600; margin-bottom: 8px;
}
```

- [ ] **Step 2b: `updateMissions()` guard 로직 교체 — pending/true 명시적 분기**

기존 `if (state.todayMission){...return;}` 한 줄을 아래 3-way 분기로 교체:
```js
if (state.todayMission === 'pending') {
  list.style.display='none'; area.style.display='none'; done.style.display='block';
  done.innerHTML = `
    <div style="font-size:80px;margin-bottom:12px;animation:float 2s ease-in-out infinite;">✉️</div>
    <div style="font-size:22px;font-weight:800;margin-bottom:8px;">엄마/아빠한테 보냈어!</div>
    <div style="font-size:14px;color:var(--text-muted);margin-bottom:8px;">검토 기다리는 중... ⏳</div>
    <div style="font-size:13px;color:var(--text-muted);">승인되면 XP를 받을 수 있어!</div>
  `;
  return;
}
if (state.todayMission === true) {
  list.style.display='none'; area.style.display='none'; done.style.display='block';
  return;  // 기존 done HTML 유지
}
// false: 이하 기존 목록 렌더링 유지
done.style.display='none'; list.style.display='block';
```

- [ ] **Step 3: `selectMission(id)` 수정 — textarea 렌더링**

```js
function selectMission(id) {
  document.querySelectorAll('.mission-card').forEach(c=>c.classList.remove('selected'));
  document.getElementById('mission-'+id).classList.add('selected');
  selectedMission = MISSIONS.find(m=>m.id===id);
  const area = document.getElementById('mission-complete-area');
  area.style.display = 'block';

  // 미션 4: Word Scout 단어 힌트 표시
  let wordHint = '';
  if (id === 4) {
    const words = getWords();
    if (words.length > 0) {
      const w = words[0].word;
      wordHint = `<div style="margin-top:8px;"><span style="font-size:12px;color:var(--text-muted);">오늘 단어: </span><span class="word-hint-tag">📌 ${w}</span></div>`;
    }
  }

  area.innerHTML = `
    ${wordHint}
    <textarea class="mission-textarea" id="mission-input"
      placeholder="${selectedMission.placeholder}"
      oninput="updateCharHint(this)"></textarea>
    <div class="char-hint" id="char-hint">최소 1자 이상 입력해줘 ✏️</div>
    <button class="btn btn-success" onclick="completeMission()" style="margin-top:12px;">
      ✉️ 엄마/아빠한테 보내기 (+${selectedMission.xp} XP 예정)
    </button>
  `;
}

function updateCharHint(el) {
  const len = el.value.trim().length;
  document.getElementById('char-hint').textContent =
    len === 0 ? '최소 1자 이상 입력해줘 ✏️' : `${len}자 작성 중 👍`;
}
```

- [ ] **Step 4: `completeMission()` 수정 — text 저장, pending 상태로 전환**

```js
function completeMission() {
  if (!selectedMission || state.todayMission === true) return;  // pending 아닌 완료만 차단
  const inputEl = document.getElementById('mission-input');
  const text = inputEl ? inputEl.value.trim() : '';
  if (!text) { alert('내용을 입력해줘! ✏️'); return; }

  // 제출 저장
  const submission = {
    id: Date.now(),
    date: new Date().toDateString(),
    missionId: selectedMission.id,
    missionTitle: selectedMission.title,
    missionEmoji: selectedMission.emoji,
    text: text,
    status: 'pending',
    baseXp: selectedMission.xp,
    bonusXp: 0,
    praiseMsg: '',
    notified: false
  };
  state.missionSubmissions = state.missionSubmissions || [];
  state.missionSubmissions.push(submission);
  state.todayMission = 'pending';
  saveState(state);

  // 봉투 애니메이션 → pending 화면
  document.getElementById('mission-list').style.display = 'none';
  document.getElementById('mission-complete-area').style.display = 'none';
  document.getElementById('mission-done-state').style.display = 'block';
  document.getElementById('mission-done-state').innerHTML = `
    <div style="font-size:80px;margin-bottom:12px;animation:float 2s ease-in-out infinite;">✉️</div>
    <div style="font-size:22px;font-weight:800;margin-bottom:8px;">엄마/아빠한테 보냈어!</div>
    <div style="font-size:14px;color:var(--text-muted);margin-bottom:8px;">검토 기다리는 중... ⏳</div>
    <div style="font-size:13px;color:var(--text-muted);">승인되면 XP를 받을 수 있어!</div>
  `;
}
```

- [ ] **Step 5: CSS에 float 애니메이션 추가 (없을 경우)**

```css
@keyframes float {
  0%,100% { transform: translateY(0); }
  50%      { transform: translateY(-8px); }
}
```

- [ ] **Step 6: 브라우저에서 수동 확인**

  - 미션 선택 → textarea 보임
  - 텍스트 없이 버튼 클릭 → alert
  - 텍스트 입력 후 제출 → 봉투 화면
  - `getState().missionSubmissions` 에 데이터 확인
  - `getState().todayMission === 'pending'` 확인

- [ ] **Step 7: Commit**
```bash
git add index.html
git commit -m "feat: add text input to mission screen with pending submission state"
```

---

### Task 3: Pending 상태 홈/미션 화면 표시

**Files:**
- Modify: `index.html` (JS — `setCheck`, `updateMissions`)

- [ ] **Step 1: `setCheck()` — pending 상태 처리 추가**

```js
function setCheck(id, done) {
  const el = document.getElementById(id);
  if (done === 'pending') {
    el.textContent = '⏳';
    el.className = 'activity-check';
    el.style.background = 'rgba(255,200,0,0.2)';
    el.style.color = '#f0c000';
  } else {
    el.style.background = '';
    el.style.color = '';
    el.textContent = done ? '✓' : '○';
    el.className = 'activity-check ' + (done ? 'check-done' : 'check-pending');
  }
}
```

- [ ] **Step 2: `updateHome()` — todayMission 'pending' 전달**

기존:
```js
setCheck('check-mission', state.todayMission);
```
변경:
```js
setCheck('check-mission', state.todayMission); // 이미 'pending' 문자열 그대로 전달되므로 OK
```
→ setCheck가 'pending' 문자열을 받아 처리하므로 updateHome은 수정 불필요. 단, `todayMission === true` 조건 체크가 있는 곳을 확인:

`updateMissions()` 첫 줄:
```js
// 기존:
if (state.todayMission){ ... }
// 변경:
if (state.todayMission === true){ ... }  // 완료된 경우만
// pending 상태 추가:
if (state.todayMission === 'pending') {
  list.style.display='none'; area.style.display='none';
  done.style.display='block';
  done.innerHTML = `
    <div style="font-size:80px;margin-bottom:12px;animation:float 2s ease-in-out infinite;">✉️</div>
    <div style="font-size:22px;font-weight:800;margin-bottom:8px;">엄마/아빠한테 보냈어!</div>
    <div style="font-size:14px;color:var(--text-muted);margin-bottom:8px;">검토 기다리는 중... ⏳</div>
    <div style="font-size:13px;color:var(--text-muted);">승인되면 XP를 받을 수 있어!</div>
  `;
  return;
}
```

- [ ] **Step 3: 브라우저 확인**

  - pending 상태에서 홈 화면 미션 체크 → ⏳ 노란색 표시
  - 미션 탭 이동 → 봉투 화면 표시

- [ ] **Step 4: Commit**
```bash
git add index.html
git commit -m "feat: show pending state on home and mission screens"
```

---

### Task 4: 엄마 모드 — 미션 답변 검토 UI

**Files:**
- Modify: `index.html` (HTML — `screen-mom` 섹션, JS — `updateMomMode`, `approveMission`)

- [ ] **Step 1: CSS — 검토 UI 스타일 추가**

```css
.submission-card {
  background: var(--surface); border: 2px solid var(--border);
  border-radius: 14px; padding: 16px; margin-bottom: 14px;
}
.submission-card .sub-text {
  background: var(--card); border-radius: 10px;
  padding: 10px 12px; font-size: 14px; line-height: 1.7;
  color: var(--text); margin: 10px 0; white-space: pre-wrap;
  border-left: 3px solid var(--primary);
}
.xp-btn-group { display: flex; gap: 8px; margin: 10px 0; }
.xp-btn {
  flex: 1; padding: 8px 0; border: 2px solid var(--border);
  border-radius: 10px; background: var(--card); color: var(--text);
  font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.15s;
}
.xp-btn.selected { border-color: var(--accent); background: rgba(0,212,255,0.12); color: var(--accent); }
.praise-input {
  width: 100%; box-sizing: border-box; background: var(--surface);
  border: 1px solid var(--border); border-radius: 10px; color: var(--text);
  font-size: 13px; padding: 10px; font-family: inherit; resize: none;
  height: 56px;
}
.praise-input:focus { outline: none; border-color: var(--primary); }
```

- [ ] **Step 2: `screen-mom` HTML에 답변 검토 섹션 추가**

엄마 모드 화면에서 기존 "Jay가 모르는 단어" 섹션 바로 위에 삽입:
```html
<!-- Jay 미션 답변 검토 -->
<div class="section-title" style="margin-top:8px;">📬 Jay의 미션 답변</div>
<div id="mom-submissions"></div>
```

- [ ] **Step 3: `updateMomMode()` 에 `renderMomSubmissions()` 호출 추가**

```js
function updateMomMode(){
  state=getState();
  document.getElementById('mom-book-title').value=state.settings.bookTitle||'';
  document.getElementById('mom-chapter').value=state.settings.chapter||'';
  renderMomWordList();
  renderMomUnknownWords();
  renderMomSubmissions();  // 추가
}
```

- [ ] **Step 4: `renderMomSubmissions()` 함수 신규 작성**

```js
function renderMomSubmissions() {
  const subs = (state.missionSubmissions || []).filter(s => s.status === 'pending');
  const el = document.getElementById('mom-submissions');
  if (!subs.length) {
    el.innerHTML = '<div style="font-size:13px;color:var(--text-muted);padding:10px 0;">아직 제출된 답변이 없어요</div>';
    return;
  }
  el.innerHTML = subs.map(s => `
    <div class="submission-card" id="subcard-${s.id}">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
        <span style="font-size:20px;">${s.missionEmoji||'🎯'}</span>
        <span style="font-weight:700;font-size:15px;">${s.missionTitle||''}</span>
        <span style="font-size:11px;color:var(--text-muted);margin-left:auto;">${s.date||''}</span>
      </div>
      <div class="sub-text">${s.text||''}</div>
      <div style="font-size:13px;color:var(--text-muted);margin-bottom:6px;">보너스 XP 선택 (기본 ${s.baseXp||0} XP 별도)</div>
      <div class="xp-btn-group" id="xpbtn-${s.id}">
        ${[5,10,15,20].map(v=>`<button class="xp-btn" data-xp="${v}" onclick="selectBonus(this, ${s.id})">+${v}</button>`).join('')}
      </div>
      <textarea class="praise-input" id="praise-${s.id}" placeholder="짧은 칭찬 메시지 (선택) 예: 잘했어! 👍"></textarea>
      <button class="btn btn-success" style="margin-top:10px;" onclick="approveMission(${s.id})">✅ 승인하기</button>
    </div>
  `).join('');
}

// selectBonus: 클릭된 버튼을 명시적으로 받아 data-xp로 값 관리
function selectBonus(btn, subId) {
  document.querySelectorAll(`#xpbtn-${subId} .xp-btn`).forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
}
```

- [ ] **Step 5: `approveMission(subId)` 함수 신규 작성**

```js
function approveMission(subId) {
  state = getState();
  const sub = (state.missionSubmissions || []).find(s => s.id === subId);
  if (!sub) return;

  // 선택된 보너스 XP 읽기 (data-xp 속성 사용, textContent 파싱 불필요)
  const selectedBtn = document.querySelector(`#xpbtn-${subId} .xp-btn.selected`);
  if (!selectedBtn) { alert('보너스 XP를 선택해주세요! (+5/+10/+15/+20)'); return; }
  const bonusXp = parseInt(selectedBtn.dataset.xp) || 0;
  const praiseMsg = document.getElementById('praise-'+subId).value.trim();

  sub.status = 'reviewed';
  sub.bonusXp = bonusXp;
  sub.praiseMsg = praiseMsg;
  sub.notified = false;
  saveState(state);

  // 카드 시각적 피드백
  const card = document.getElementById('subcard-'+subId);
  card.style.opacity = '0.5';
  card.innerHTML = '<div style="text-align:center;padding:12px;font-size:20px;">✅ 승인 완료!</div>';
  setTimeout(() => renderMomSubmissions(), 800);
}
```

- [ ] **Step 6: 브라우저 확인**

  - 미션 제출 후 엄마 모드 진입 → "📬 Jay의 미션 답변" 섹션에 카드 표시
  - XP 버튼 선택 → 파란 하이라이트
  - 칭찬 메시지 입력 가능
  - 승인 → 카드 사라짐
  - `getState().missionSubmissions[0].status === 'reviewed'` 확인

- [ ] **Step 7: Commit**
```bash
git add index.html
git commit -m "feat: add mission review UI in mom mode with bonus XP selection"
```

---

### Task 5: Jay 앱 재진입 시 보상 팝업

**Files:**
- Modify: `index.html` (HTML — praise popup, JS — `checkPendingRewards`, init)

- [ ] **Step 1: CSS — 칭찬 팝업 스타일**

```css
.praise-popup {
  position: fixed; top: 50%; left: 50%;
  transform: translate(-50%, -50%) scale(0.8);
  background: var(--card); border: 2px solid var(--accent);
  border-radius: 20px; padding: 32px 24px; text-align: center;
  z-index: 300; min-width: 280px; max-width: 340px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  opacity: 0; pointer-events: none; transition: all 0.3s;
}
.praise-popup.show { opacity: 1; pointer-events: auto; transform: translate(-50%,-50%) scale(1); }
.praise-msg-box {
  background: var(--surface); border-radius: 12px;
  padding: 12px 16px; margin: 12px 0;
  font-size: 15px; color: var(--text); line-height: 1.6;
  font-style: italic;
}
```

- [ ] **Step 2: HTML — 칭찬 팝업 마크업 추가**

`</body>` 직전, 기존 xpPopup `div` 아래에 추가:
```html
<div class="overlay" id="overlay-praise"></div>
<div class="praise-popup" id="praisePopup">
  <div style="font-size:64px;margin-bottom:8px;">🎉</div>
  <div id="praisePopupTitle" style="font-size:22px;font-weight:800;margin-bottom:4px;"></div>
  <div id="praisePopupXp" style="font-size:28px;font-weight:900;color:var(--accent);margin-bottom:8px;"></div>
  <div id="praisePopupMsg" class="praise-msg-box" style="display:none;"></div>
  <button class="btn btn-primary" onclick="closePraisePopup()" style="margin-top:8px;">최고야! 🙌</button>
</div>
```

- [ ] **Step 3: `checkPendingRewards()` 함수 신규 작성**

```js
function checkPendingRewards() {
  state = getState();
  const reviewed = (state.missionSubmissions || []).filter(s => s.status === 'reviewed' && !s.notified);
  if (!reviewed.length) return;

  // 첫 번째 리뷰 항목 처리
  const s = reviewed[0];
  const totalXp = s.baseXp + (s.bonusXp || 0);

  // XP 지급
  const prevLevel = getLevelInfo(state.xp).level;
  state.xp += totalXp;
  state.todayXp += totalXp;
  if (state.todayMission === 'pending') state.todayMission = true;
  s.notified = true;
  saveState(state);

  // 팝업 표시
  document.getElementById('praisePopupTitle').textContent = '엄마/아빠가 칭찬했어!';
  document.getElementById('praisePopupXp').textContent = '+' + totalXp + ' XP';
  const msgEl = document.getElementById('praisePopupMsg');
  if (s.praiseMsg) {
    msgEl.textContent = '"' + s.praiseMsg + '"';
    msgEl.style.display = 'block';
  } else {
    msgEl.style.display = 'none';
  }
  document.getElementById('overlay-praise').classList.add('show');
  document.getElementById('praisePopup').classList.add('show');

  if (getLevelInfo(state.xp).level > prevLevel) {
    setTimeout(() => alert('🎉 레벨 업! 축하해, Jay!'), 1200);
  }
}

function closePraisePopup() {
  document.getElementById('overlay-praise').classList.remove('show');
  document.getElementById('praisePopup').classList.remove('show');
  updateHome();
  // 남은 리뷰 항목 연속 처리
  setTimeout(checkPendingRewards, 400);
}
```

- [ ] **Step 4: `navigate('home')` 시 `checkPendingRewards()` 호출**

`navigate()` 함수에서:
```js
if (screen==='home') { updateHome(); checkPendingRewards(); }
```

- [ ] **Step 5: 초기화 코드에 `checkPendingRewards()` 추가**

파일 맨 아래 init 블록:
```js
checkDailyReset();
updateHome();
checkPendingRewards();  // 추가
updateTimerDisplay();
```

- [ ] **Step 6: 브라우저 전체 흐름 확인**

  1. 미션 텍스트 입력 후 제출 → 봉투 화면
  2. 엄마 모드 진입 → 답변 카드 보임
  3. 보너스 XP 선택 + 칭찬 입력 → 승인
  4. 엄마 모드 나가서 홈 → 🎉 팝업 표시
  5. XP 반영 확인
  6. 미션 체크 ○ → ⏳ → ✓ 흐름 확인

- [ ] **Step 7: Commit**
```bash
git add index.html
git commit -m "feat: add praise popup and reward notification on home navigate"
```

---

### Task 6: 마무리 — git push

- [ ] **Step 1: 최종 전체 흐름 확인**

  - 새 날 시뮬레이션: `localStorage` 초기화 후 전체 흐름 재확인
  - 기존 미션 완료 기록(history)이 깨지지 않는지 확인

- [ ] **Step 2: GitHub push**
```bash
cd "C:/AI/jay_english"
git push origin main
```

- [ ] **Step 3: 배포 확인**

  https://3jsdaddy9.github.io/jay-english 에서 실제 동작 확인
