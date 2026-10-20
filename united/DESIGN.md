# JAY UNITED Reading Academy

## 1. Atmosphere & identity
Approved reference: C:/Users/user/Desktop/JAY_UNITED_게임설계/JAY_UNITED_선수영입_화면시안.png. Prior generated design, not a site clone. Small European football academy, ivory reading panel against a rich green pitch, navy collegiate lettering, restrained gold card frames. The screenshot is a concept board of multiple devices, not a literal viewport template. Rebuild its actual home / learning / recruitment components as live DOM. Child persona: Korean grade5 reader, user-described AR3.5. Parent persona: open game, observe, export feedback. One decisive action per screen. Never decorate the question text before submission.

## 2. Color
--navy #0c2133; --ink #152d3c; --green #087565; --green-dark #05594d; --mint #e8f4ef; --gold #c4994b; --gold-ink #856021 (text on ivory); --paper #faf9f5; --white #ffffff; --muted #526674; --line #d7dedc; --red #a43832; --red-light #fff0ec; --sky #dceaf0. Color never encodes correctness alone.

## 3. Typography
Display Georgia bold (academy headings); body system-ui, 'Malgun Gothic', sans-serif; English reading uses same sans. Display 36–56, heading 24–32, sentence 22–30 with line-height1.6, body16–18, small14. English letter spacing normal, no allcaps sentences. Korean word-break keep-all and overflow-wrap break-word. Font files not needed/offline system fonts. Never prevent zoom.

## 4. Spacing & layout
Base4px. Tokens --s1:4px --s2:8px --s3:12px --s4:16px --s5:20px --s6:24px --s8:32px --s10:40px --s12:48px. Main max1120px; reading max800px; viewport padding16mobile/32desktop. Breakpoints640/900. Document scroll owner; bottom navigation mobile, top navigation desktop. Safe-area bottom. Grid minmax(0,1fr), no overflow hidden covering defects.

## 5. Reusable primitives
Button: native button, min48px touch, primary green/secondary border/quiet, hover darkens, visible 3px gold focus +2px offset, disabled differentiated, no repeated mutations while pending.
Panel: ivory, radius16px, line border, subtle shadow; never panel nesting merely for decoration.
Choice: native button with aria-pressed, min56px; neutral / selected navy border / correct green+label / incorrect red+label. Separate selection and submit. Hint appears only on request.
PlayerCard: gold frame, deep green layered inset, jersey/portrait+name+position, price or owned tag. Front surface has individual identity, fixed prices, purchase confirmation dialog. No real club crests. Academy jerseys are original vector artwork.
Pitch: live buttons laid out in 4-3-3, pick position then eligible player, bench selection accessible without drag.
Navigation: semantic links, active aria-current, responsive, named SVG icons.
Progress: semantic progress plus visible x/n, never random artificial metrics.
Dialog: native dialog with heading, explicit cancel/confirm, focus management, escape/clickclose.
Status: aria-live polite, plain short explanatory text, no rapid flashes.
Feedback: labeled radio groups (fun/difficulty), optional comment; saved locally with session summary, exportable file.

## 6. Motion & interaction
120ms button press transform/opacity only. 180ms success badge opacity once when completion changes. No moving background during reading. Reduced-motion disables transitions. No timer, speed reward, lives loss or streak punishment. Keyboard equivalents for every action; order tasks tap chunks and undo.

## 7. Depth & surface
Dimensional stadium art and green pitch behind ivory reading panel. Card foil achieved with layered linear gradients, inner gold line, cast shadow 0 12px 30px #0c213326. Image is only decorative; never renders an interface. Readability takes precedence: reading panel fully opaque. Radius8buttons/16panels/20hero, border1px. No confetti over text.

## 8. Constraints and handoff
Module lives under united/, existing XP/storage unchanged. IndexedDB transaction stores progress/rewards atomically, no login or cross-device sync. Local backup/restore plus feedback export. 72 questions authored from supplied source and explicit transfer examples, source shown in learning. Feedback records timing/hints/errors and child's rating without microphone or network upload. A parent check of spoken meaning is separate from auto-choice accuracy. No claim of AR measurement or proven card-system efficacy. Capture home/question/hint/error/repair/result/market/buy/squad/parent at375/768/1280 and inspect current build. Actual child trial remains user-provided future feedback, not simulated evidence.

## 9. History course (2026-10-19)
Retain existing football identity, tokens and player economy. Home promotes five history lessons; legacy matches remain under optional archive, no default Goodmorning content. Course pages use opaque reading panels, ordered manual paper/video/paper steps and semantic PDF/video links. Vocabulary is a separate focused recall panel with hidden answer, optional etymology hint, answer reveal, three honest self-ratings and next date. One main action at each phase; no timer/countdown. Recognition-only armistice never requires spelling. Parent sees dates/status, self-report labels and a ten-minute checklist. Progress and word records persist in optional history schema1 alongside original IndexedDB v1, with validation for both old and new backups. Private Drive media require existing account access; never change sharing permission. Offline text/reviews work; video/PDF links require internet. Do not describe unverified AR3.5 as a tested reading level.

## 10. Cloud migration
Use existing status/button primitives and palette. Sync strip max1120px, 16px padding, wrapping with 48px touch links. Explicit migration opens private cloud site, downloads full local backup, authenticates same parent account, and uses bound window/origin/nonce messages. Cloud record is never implicitly replaced. Existing origin becomes read-only after successful transfer. New account service supports automatic online writes and offline reading.

The migration strip is present in initial HTML to reserve its height. Its existing text/buttons retain the shared spacing, typography and color tokens.
