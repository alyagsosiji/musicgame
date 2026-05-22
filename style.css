// 1. 암호화(인코딩)된 Firebase 구성 정보
const _skyHorizonConfig = {
    ak: "QUl6YVN5RG9uSldVaC15Ri1JZVF1aHZJdmRVSlBaTl80bnlKY2N3",
    ad: "cmVnYW1lMDQxNi5maXJlYmFzZWFwcC5jb20=",
    pi: "cmVnYW1lMDQxNg==",
    sb: "cmVnYW1lMDQxNi5maXJlYmFzZXN0b3JhZ2UuYXBw",
    mi: "MjE5Mjc1NjM2MjU1",
    ai: "MToyMTkyNzU2MzYyNTU6d2ViOmVkNDU2ZjQxYTEyN2IxMzFiN2VmMmE=",
    ms: "Ry1ENDlUODNYM0xD"
};

const firebaseConfig = {
    apiKey: atob(_skyHorizonConfig.ak),
    authDomain: atob(_skyHorizonConfig.ad),
    projectId: btoa(atob(_skyHorizonConfig.pi)) === "Y21WbllXMWxNRFF4Tmc9PQ==" ? atob(_skyHorizonConfig.pi) : "", // 무단 변경 검증 레이어
    storageBucket: atob(_skyHorizonConfig.sb),
    messagingSenderId: atob(_skyHorizonConfig.mi),
    appId: atob(_skyHorizonConfig.ai),
    measurementId: atob(_skyHorizonConfig.ms)
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// 브라우저 무단 조작 차단 시큐리티 시스템
window.addEventListener('contextmenu', e => e.preventDefault());
window.addEventListener('dragstart', e => e.preventDefault());
window.addEventListener('selectstart', e => {
    if (e.target.tagName === 'INPUT') return; 
    e.preventDefault();
});

window.addEventListener('keydown', function (e) {
    if (e.keyCode === 123) { e.preventDefault(); return false; }
    if (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) { e.preventDefault(); return false; }
    if (e.ctrlKey && e.keyCode === 85) { e.preventDefault(); return false; }
    if (e.key === "Escape" && gameActive) { exitGameMidway(); }
});

// 시스템 환경 변수
let isSignUpMode = false;
let currentUser = null;
let isAdmin = false;
let currentPlatform = /Mobi|Android|iPhone/i.test(navigator.userAgent) ? "Mobile" : "Desktop";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
let animationId;
let gameActive = false;
let score = 0, combo = 0, maxCombo = 0, perfectCount = 0;
let selectedDifficulty = 'easy';
let activeNotes = [];
let chartData = [];
let popupCallback = null;

// 관리자 보안 해시 (아시 / 260416)
const ADMIN_ID_HASH = "bec68297bcf9ba195b0ff7a5d9cf2bb57a91605e5d5ff2400e28f3bb26cd4e2b";
const ADMIN_PW_HASH = "69894e634125b34df435e5d17c06eb61df1f8b65b6f3c1143a41b52bc66bb56e";

// Plum - Night Sky City 정밀 연동 채보 데이터 시트
const charts = {
    easy: [
        {time: 1.0, lane: 0}, {time: 2.2, lane: 2}, {time: 3.5, lane: 1}, {time: 4.8, lane: 3},
        {time: 7.0, lane: 0}, {time: 8.2, lane: 2}, {time: 9.5, lane: 1}, {time: 10.8, lane: 3},
        {time: 13.0, lane: 1}, {time: 14.5, lane: 2}, {time: 16.0, lane: 0}, {time: 17.5, lane: 3},
        {time: 20.0, lane: 1}, {time: 21.2, lane: 2}, {time: 23.0, lane: 0}, {time: 24.5, lane: 3},
        {time: 26.0, lane: 0}, {time: 27.0, lane: 1}, {time: 28.0, lane: 2}, {time: 29.0, lane: 3}
    ],
    normal: [
        {time: 0.8, lane: 0}, {time: 1.6, lane: 2}, {time: 2.4, lane: 1}, {time: 3.2, lane: 3},
        {time: 4.5, lane: 0}, {time: 5.3, lane: 2}, {time: 6.1, lane: 1}, {time: 7.0, lane: 3},
        {time: 9.0, lane: 1}, {time: 9.8, lane: 2}, {time: 11.0, lane: 0}, {time: 12.2, lane: 3},
        {time: 14.0, lane: 0}, {time: 14.8, lane: 1}, {time: 15.6, lane: 2}, {time: 16.4, lane: 3}
    ],
    hard: [
        {time: 0.5, lane: 0}, {time: 1.0, lane: 2}, {time: 1.5, lane: 1}, {time: 2.0, lane: 3},
        {time: 2.5, lane: 0}, {time: 2.8, lane: 1}, {time: 3.2, lane: 2}, {time: 3.6, lane: 3},
        {time: 5.0, lane: 1}, {time: 5.5, lane: 2}, {time: 6.0, lane: 0}, {time: 6.5, lane: 3},
        {time: 15.0, lane: 0}, {time: 15.3, lane: 1}, {time: 15.6, lane: 2}, {time: 15.9, lane: 3}
    ],
    master: [
        {time: 0.3, lane: 0}, {time: 0.6, lane: 1}, {time: 0.9, lane: 2}, {time: 1.2, lane: 3},
        {time: 1.5, lane: 2}, {time: 1.8, lane: 1}, {time: 2.1, lane: 0}, {time: 2.4, lane: 3},
        {time: 5.0, lane: 0}, {time: 5.2, lane: 1}, {time: 5.4, lane: 2}, {time: 5.6, lane: 3},
        {time: 14.0, lane: 0}, {time: 14.2, lane: 1}, {time: 14.4, lane: 0}, {time: 14.6, lane: 1},
        {time: 25.0, lane: 0}, {time: 25.2, lane: 1}, {time: 25.4, lane: 2}, {time: 25.6, lane: 3}
    ]
};

// [수정] 모니터 Hz 주사율과 독립적인 초당 하강 픽셀 속도 매트릭스 변환 (기기 최적화)
const speedSettings = { easy: 300, normal: 400, hard: 550, master: 700 };

// 2. 고정 커스텀 자체 팝업 시스템 기능 제어 구조
function showCustomAlert(title, message, isConfirm = false, callback = null) {
    document.getElementById("popup-title").innerText = title;
    document.getElementById("popup-message").innerText = message;
    popupCallback = callback;

    const cancelBtn = document.getElementById("popup-cancel-btn");
    if(isConfirm) cancelBtn.classList.remove("hidden");
    else cancelBtn.classList.add("hidden");
    
    document.getElementById("custom-popup").style.display = "flex";
}

function closeCustomPopup(confirmed = true) {
    document.getElementById("custom-popup").style.display = "none";
    if(confirmed && popupCallback) popupCallback();
    popupCallback = null;
}

// [버그 수정] 중복 바인딩 및 동작 먹통 현상을 방지하는 전용 단방향 인터페이스 할당
document.getElementById("popup-confirm-btn").onclick = () => closeCustomPopup(true);
document.getElementById("popup-cancel-btn").onclick = () => closeCustomPopup(false);

function openTosModal() { document.getElementById("tos-modal").style.display = "flex"; }
function closeTosModal() { document.getElementById("tos-modal").style.display = "none"; }

async function secureHash(string) {
    const utf8 = new TextEncoder().encode(string);
    const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function toggleAuthMode() {
    isSignUpMode = !isSignUpMode;
    document.getElementById("auth-title").innerText = isSignUpMode ? "새 여행자 가입 (회원가입)" : "우주 진입 (로그인)";
    document.getElementById("auth-toggle").innerText = isSignUpMode ? "이미 계정이 있으신가요? 로그인하기" : "새로운 여행자이신가요? 회원가입하기";
}

async function handleAuth() {
    const rawId = document.getElementById("auth-id").value.trim();
    const rawPw = document.getElementById("auth-pw").value.trim();

    if(!rawId || !rawPw) return showCustomAlert("경고", "모든 항목을 입력해 주세요.");

    const inputIdHash = await secureHash(rawId);
    const inputPwHash = await secureHash(rawPw);

    if (inputIdHash === ADMIN_ID_HASH && inputPwHash === ADMIN_PW_HASH) {
        isAdmin = true;
        currentUser = { uid: "admin_asi", displayName: "아시" };
        document.getElementById("btn-admin").classList.remove("hidden");
        showLobby();
        return;
    }

    const secureEmail = `${await secureHash(rawId.toLowerCase())}@horizon.com`;
    
    try {
        if (isSignUpMode) {
            const userCredential = await auth.createUserWithEmailAndPassword(secureEmail, rawPw);
            await userCredential.user.updateProfile({ displayName: rawId });
            await db.collection("horizon_users").doc(userCredential.user.uid).set({
                username: rawId,
                joinedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            showCustomAlert("성공", "수평선 너머 은하에 가입되었습니다.");
        } else {
            await auth.signInWithEmailAndPassword(secureEmail, rawPw);
        }
    } catch (error) {
        showCustomAlert("오류", "계정 식별에 실패했습니다: " + error.message);
    }
}

auth.onAuthStateChanged((user) => {
    if (user && !isAdmin) {
        currentUser = user;
        showLobby();
    }
});

function handleLogout() {
    auth.signOut();
    isAdmin = false;
    currentUser = null;
    document.getElementById("btn-admin").classList.add("hidden");
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.getElementById("auth-screen").classList.add("active");
}

function showLobby() {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.getElementById("lobby-screen").classList.add("active");
    document.getElementById("user-welcome").innerText = `반갑습니다, ${currentUser.displayName} 여행자님!`;
    loadRankings();
}

async function loadRankings() {
    const tbody = document.getElementById("ranking-tbody");
    tbody.innerHTML = "";
    try {
        const snapshot = await db.collection("horizon_rankings").orderBy("score", "desc").limit(20).get();
        let rank = 1;
        snapshot.forEach(doc => {
            const data = doc.data();
            tbody.innerHTML += `<tr>
                <td>${rank++}</td>
                <td>${data.username}</td>
                <td>${data.difficulty.toUpperCase()}</td>
                <td>${data.score}</td>
                <td>${data.maxCombo}</td>
                <td>${data.perfectCount}</td>
                <td><span class="platform-badge">${data.platform}</span></td>
            </tr>`;
        });
    } catch (e) { console.log(e); }
}

function switchAdminTab(type) {
    document.querySelectorAll(".admin-tab-content").forEach(c => c.classList.remove("active"));
    if(type === 'rank') document.getElementById("admin-rank-section").classList.add("active");
    if(type === 'user') document.getElementById("admin-user-section").classList.add("active");
}

async function openAdminPanel() {
    if(!isAdmin) return;
    document.getElementById("admin-modal").style.display = "flex";
    
    const rankTbody = document.getElementById("admin-ranking-tbody");
    rankTbody.innerHTML = "";
    const rankSnap = await db.collection("horizon_rankings").limit(30).get();
    rankSnap.forEach(doc => {
        const d = doc.data();
        rankTbody.innerHTML += `<tr><td>${d.username}</td><td>${d.score}</td><td>${d.difficulty}</td>
        <td><button onclick="requestDeleteRank('${doc.id}')" style="background:#cc0000; padding:4px;">삭제</button></td></tr>`;
    });

    const userTbody = document.getElementById("admin-user-tbody");
    userTbody.innerHTML = "";
    const userSnap = await db.collection("horizon_users").limit(30).get();
    userSnap.forEach(doc => {
        const u = doc.data();
        userTbody.innerHTML += `<tr><td>${u.username}</td><td>활동 중</td>
        <td><button onclick="requestBanUser('${doc.id}')" style="background:#cc0000; padding:4px;">추방</button></td></tr>`;
    });
}

function closeAdminPanel() { document.getElementById("admin-modal").style.display = "none"; }

function requestDeleteRank(id) {
    showCustomAlert("확인", "해당 기록을 기록실에서 파기하시겠습니까?", true, async () => {
        await db.collection("horizon_rankings").doc(id).delete();
        openAdminPanel();
        loadRankings();
    });
}

function requestBanUser(id) {
    showCustomAlert("확인", "해당 유저의 우주선 자격을 영구 박탈하시겠습니까?", true, async () => {
        await db.collection("horizon_users").doc(id).delete();
        openAdminPanel();
    });
}

// 3. 고성능 동기화 리듬게임 연산 엔진 구역
const lanes = [60, 160, 260, 360];
const keyMap = { 'd': 0, 'f': 1, 'j': 2, 'k': 3 };
let targetY = 476;

function fitCanvasSize() {
    canvas.width = 420;
    canvas.height = 560;
    targetY = canvas.height * 0.85;
}
window.addEventListener('resize', fitCanvasSize);

function startGame(diff) {
    selectedDifficulty = diff;
    fitCanvasSize();
    
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.getElementById("game-screen").classList.add("active");
    
    score = 0; combo = 0; maxCombo = 0; perfectCount = 0;
    activeNotes = [];
    chartData = JSON.parse(JSON.stringify(charts[selectedDifficulty]));
    gameActive = true;

    const audio = document.getElementById("game-audio");
    audio.currentTime = 0;
    audio.play().catch((err) => { console.warn(err); });

    gameLoop();
}

function exitGameMidway() {
    showCustomAlert("중도 하차", "진행 중인 모든 기록을 초기화하고 은하 대기실로 귀환하시겠습니까?", true, () => {
        gameActive = false;
        cancelAnimationFrame(animationId);
        const audio = document.getElementById("game-audio");
        audio.pause();
        audio.currentTime = 0;
        showLobby();
    });
}

function gameLoop() {
    if (!gameActive) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 트랙 레인 가이드 도식화
    ctx.strokeStyle = "rgba(138, 43, 226, 0.3)";
    lanes.forEach(x => {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    });

    // 판정선 도식화
    ctx.strokeStyle = "#00ffff"; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, targetY); ctx.lineTo(canvas.width, targetY); ctx.stroke();

    const audio = document.getElementById("game-audio");
    const currentAudioTime = audio.currentTime;
    const currentSpeedFactor = speedSettings[selectedDifficulty];
    
    // [버그 수정] 모니터 Hz 주사율과 완벽히 격리된 오디오 절대 시간 기반 가시 범위 선 생성
    const lookAheadTime = targetY / currentSpeedFactor;

    if (chartData.length > 0 && chartData[0].time <= currentAudioTime + lookAheadTime) {
        const next = chartData.shift();
        activeNotes.push({ targetTime: next.time, lane: next.lane, x: lanes[next.lane] });
    }

    for (let i = activeNotes.length - 1; i >= 0; i--) {
        let n = activeNotes[i];
        
        // [버그 수정] 프레임 드랍이나 초고주사율에서도 일정하게 위치를 추적하는 동적 변동 연산
        n.y = targetY - (n.targetTime - currentAudioTime) * currentSpeedFactor;

        ctx.fillStyle = "#e0b0ff";
        ctx.fillRect(n.x - 40, n.y - 10, 80, 16);

        // 판정선을 완벽히 지나쳐 오차가 150ms를 넘어가면 MISS 처리
        if (currentAudioTime > n.targetTime + 0.15) {
            activeNotes.splice(i, 1);
            updateJudgement("MISS");
        }
    }

    if (audio.ended || (chartData.length === 0 && activeNotes.length === 0)) {
        finishGame();
        return;
    }
    animationId = requestAnimationFrame(gameLoop);
}

// [구조 수정] 거리 기준 픽셀 측정이 아닌 밀리초(ms) 오차 기반의 고정 판정 연산
function verifyHit(lane) {
    if(!gameActive) return;
    const audio = document.getElementById("game-audio");
    const currentAudioTime = audio.currentTime;
    
    for(let i=0; i<activeNotes.length; i++) {
        let n = activeNotes[i];
        if(n.lane === lane) {
            let timeDiff = Math.abs(n.targetTime - currentAudioTime);
            
            if(timeDiff < 0.05) { // 50ms 이내 타격 시
                updateJudgement("PERFECT"); score += 1000; perfectCount++; activeNotes.splice(i,1); break;
            } else if(timeDiff < 0.10) { // 100ms 이내 타격 시
                updateJudgement("GREAT"); score += 500; activeNotes.splice(i,1); break;
            } else if(timeDiff < 0.15) { // 150ms 이내 타격 시
                updateJudgement("GOOD"); score += 200; activeNotes.splice(i,1); break;
            }
        }
    }
}

function updateJudgement(res) {
    document.getElementById("game-judge").innerText = res;
    if(res === "MISS") combo = 0; 
    else { combo++; if(combo > maxCombo) maxCombo = combo; }
    document.getElementById("game-combo").innerText = `${combo} COMBO`;
    document.getElementById("game-score").innerText = `SCORE: ${score}`;
}

async function finishGame() {
    gameActive = false;
    cancelAnimationFrame(animationId);
    
    const audio = document.getElementById("game-audio");
    audio.pause();
    audio.currentTime = 0;
    
    if (currentUser && currentUser.uid !== "admin_asi") {
        await db.collection("horizon_rankings").add({
            username: currentUser.displayName,
            score: score,
            maxCombo: maxCombo,
            perfectCount: perfectCount,
            difficulty: selectedDifficulty,
            platform: currentPlatform,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    }

    // [버그 수정] 비동기 함수 파이프라인 매핑 구조 확립을 통한 로비 복귀 수락 연동
    showCustomAlert("완료", `수평선 종착지에 도달했습니다. 최종 스코어: ${score}점`, false, () => {
        showLobby();
    });
}

window.addEventListener("keydown", e => {
    const k = e.key.toLowerCase();
    if (keyMap[k] !== undefined) verifyHit(keyMap[k]);
});
document.querySelectorAll(".touch-zone").forEach(z => {
    z.addEventListener("touchstart", e => {
        e.preventDefault();
        verifyHit(keyMap[z.getAttribute("data-key")]);
    });
});
