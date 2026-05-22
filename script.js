// 1. Firebase 연동 구성 정의
const firebaseConfig = {
    apiKey: "AIzaSyDonJWUh-yF-IeQuhvIvdUJPZN_4nyJccw",
    authDomain: "regame0416.firebaseapp.com",
    projectId: "regame0416",
    storageBucket: "regame0416.firebasestorage.app",
    messagingSenderId: "219275636255",
    appId: "1:219275636255:web:ed456f41a127b131b7ef2a",
    measurementId: "G-D49T83X3LC"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// 무단 제어 단축키 잠금 시스템
window.addEventListener('contextmenu', e => e.preventDefault());
window.addEventListener('selectstart', e => e.preventDefault());
window.addEventListener('dragstart', e => e.preventDefault());
window.addEventListener('keydown', function (e) {
    if (e.keyCode === 123) { e.preventDefault(); return false; }
    if (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) { e.preventDefault(); return false; }
    if (e.ctrlKey && e.keyCode === 85) { e.preventDefault(); return false; }
});

// 전역 엔진 통제 컨텍스트
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

// 2. Night Sky City 음악 맞춤형 실제 타임스탬프 채보 (밀리초 단위 싱크 대응)
const charts = {
    easy: [
        {time: 1.0, lane: 0}, {time: 2.2, lane: 2}, {time: 3.5, lane: 1}, {time: 4.8, lane: 3},
        {time: 7.0, lane: 0}, {time: 8.2, lane: 2}, {time: 9.5, lane: 1}, {time: 10.8, lane: 3},
        {time: 13.0, lane: 1}, {time: 14.5, lane: 2}, {time: 16.0, lane: 0}, {time: 17.5, lane: 3},
        {time: 20.0, lane: 1}, {time: 21.2, lane: 2}, {time: 23.0, lane: 0}, {time: 24.5, lane: 3},
        // 메인 드롭 비트 시작
        {time: 26.0, lane: 0}, {time: 27.0, lane: 1}, {time: 28.0, lane: 2}, {time: 29.0, lane: 3},
        {time: 31.0, lane: 2}, {time: 32.0, lane: 1}, {time: 33.0, lane: 0}, {time: 35.0, lane: 3}
    ],
    normal: [
        {time: 0.8, lane: 0}, {time: 1.6, lane: 2}, {time: 2.4, lane: 1}, {time: 3.2, lane: 3},
        {time: 4.5, lane: 0}, {time: 5.3, lane: 2}, {time: 6.1, lane: 1}, {time: 7.0, lane: 3},
        {time: 9.0, lane: 1}, {time: 9.8, lane: 2}, {time: 11.0, lane: 0}, {time: 12.2, lane: 3},
        {time: 14.0, lane: 0}, {time: 14.8, lane: 1}, {time: 15.6, lane: 2}, {time: 16.4, lane: 3},
        {time: 19.0, lane: 2}, {time: 20.2, lane: 1}, {time: 21.5, lane: 0}, {time: 22.8, lane: 3},
        // 메인 드롭 쪼개기 비트
        {time: 25.5, lane: 0}, {time: 26.2, lane: 2}, {time: 27.0, lane: 1}, {time: 27.8, lane: 3},
        {time: 29.0, lane: 0}, {time: 29.5, lane: 1}, {time: 30.0, lane: 2}, {time: 31.0, lane: 3},
        {time: 33.0, lane: 1}, {time: 33.8, lane: 2}, {time: 34.5, lane: 0}, {time: 35.2, lane: 3}
    ],
    hard: [
        {time: 0.5, lane: 0}, {time: 1.0, lane: 2}, {time: 1.5, lane: 1}, {time: 2.0, lane: 3},
        {time: 2.5, lane: 0}, {time: 2.8, lane: 1}, {time: 3.2, lane: 2}, {time: 3.6, lane: 3},
        {time: 5.0, lane: 1}, {time: 5.5, lane: 2}, {time: 6.0, lane: 0}, {time: 6.5, lane: 3},
        {time: 8.0, lane: 2}, {time: 8.4, lane: 1}, {time: 8.8, lane: 0}, {time: 9.2, lane: 3},
        {time: 11.0, lane: 0}, {time: 11.5, lane: 3}, {time: 12.0, lane: 1}, {time: 12.5, lane: 2},
        // 드롭 전 가속 빌드업
        {time: 15.0, lane: 0}, {time: 15.3, lane: 1}, {time: 15.6, lane: 2}, {time: 15.9, lane: 3},
        {time: 18.0, lane: 3}, {time: 18.3, lane: 2}, {time: 18.6, lane: 1}, {time: 18.9, lane: 0},
        {time: 22.0, lane: 0}, {time: 22.4, lane: 2}, {time: 22.8, lane: 1}, {time: 23.2, lane: 3},
        // 폭타 드롭 구간
        {time: 25.0, lane: 0}, {time: 25.3, lane: 1}, {time: 25.6, lane: 2}, {time: 25.9, lane: 3},
        {time: 26.5, lane: 3}, {time: 26.8, lane: 2}, {time: 27.1, lane: 1}, {time: 27.4, lane: 0},
        {time: 28.5, lane: 1}, {time: 28.8, lane: 2}, {time: 29.1, lane: 0}, {time: 29.4, lane: 3},
        {time: 31.0, lane: 0}, {time: 31.4, lane: 1}, {time: 31.8, lane: 2}, {time: 32.2, lane: 3},
        {time: 34.0, lane: 2}, {time: 34.3, lane: 1}, {time: 34.6, lane: 3}, {time: 35.0, lane: 0}
    ],
    master: [
        // 도입부 분할 연타
        {time: 0.3, lane: 0}, {time: 0.6, lane: 1}, {time: 0.9, lane: 2}, {time: 1.2, lane: 3},
        {time: 1.5, lane: 2}, {time: 1.8, lane: 1}, {time: 2.1, lane: 0}, {time: 2.4, lane: 3},
        {time: 3.5, lane: 1}, {time: 3.7, lane: 2}, {time: 3.9, lane: 0}, {time: 4.1, lane: 3},
        {time: 5.0, lane: 0}, {time: 5.2, lane: 1}, {time: 5.4, lane: 2}, {time: 5.6, lane: 3},
        {time: 7.0, lane: 3}, {time: 7.2, lane: 2}, {time: 7.4, lane: 1}, {time: 7.6, lane: 0},
        {time: 9.0, lane: 1}, {time: 9.3, lane: 2}, {time: 9.6, lane: 0}, {time: 9.9, lane: 3},
        {time: 11.5, lane: 0}, {time: 11.7, lane: 2}, {time: 11.9, lane: 1}, {time: 12.1, lane: 3},
        // 트릴 비트 돌입
        {time: 14.0, lane: 0}, {time: 14.2, lane: 1}, {time: 14.4, lane: 0}, {time: 14.6, lane: 1},
        {time: 16.0, lane: 2}, {time: 16.2, lane: 3}, {time: 16.4, lane: 2}, {time: 16.6, lane: 3},
        {time: 19.0, lane: 1}, {time: 19.3, lane: 2}, {time: 19.6, lane: 0}, {time: 19.9, lane: 3},
        {time: 22.0, lane: 0}, {time: 22.2, lane: 3}, {time: 22.4, lane: 1}, {time: 22.6, lane: 2},
        // 메인 하이라이트 폭타 스트림 (Night Sky City Drop 피크)
        {time: 25.0, lane: 0}, {time: 25.2, lane: 1}, {time: 25.4, lane: 2}, {time: 25.6, lane: 3},
        {time: 25.8, lane: 2}, {time: 26.0, lane: 1}, {time: 26.2, lane: 0}, {time: 26.4, lane: 3},
        {time: 27.0, lane: 1}, {time: 27.2, lane: 2}, {time: 27.4, lane: 1}, {time: 27.6, lane: 2},
        {time: 28.0, lane: 0}, {time: 28.2, lane: 3}, {time: 28.4, lane: 1}, {time: 28.6, lane: 2},
        {time: 29.5, lane: 3}, {time: 29.7, lane: 2}, {time: 29.9, lane: 1}, {time: 30.1, lane: 0},
        {time: 31.0, lane: 0}, {time: 31.2, lane: 2}, {time: 31.4, lane: 1}, {time: 31.6, lane: 3},
        {time: 32.5, lane: 1}, {time: 32.7, lane: 0}, {time: 32.9, lane: 2}, {time: 33.1, lane: 3},
        {time: 34.0, lane: 0}, {time: 34.2, lane: 1}, {time: 34.4, lane: 2}, {time: 34.6, lane: 3},
        {time: 34.8, lane: 1}, {time: 35.0, lane: 2}, {time: 35.2, lane: 0}, {time: 35.4, lane: 3}
    ]
};
const speedSettings = { easy: 5, normal: 7, hard: 10, master: 14 };

// 3. 브라우저 창 팝업 차단용 커스텀 비동기 모달 엔진
function showCustomAlert(title, message, isConfirm = false, callback = null) {
    document.getElementById("popup-title").innerText = title;
    document.getElementById("popup-message").innerText = message;
    
    const cancelBtn = document.getElementById("popup-cancel-btn");
    if(isConfirm) {
        cancelBtn.classList.remove("hidden");
        popupCallback = callback;
    } else {
        cancelBtn.classList.add("hidden");
        popupCallback = null;
    }
    document.getElementById("custom-popup").style.display = "flex";
}

function closeCustomPopup(confirmed = true) {
    document.getElementById("custom-popup").style.display = "none";
    if(popupCallback && confirmed) popupCallback();
    popupCallback = null;
}

document.getElementById("popup-cancel-btn").addEventListener("click", () => closeCustomPopup(false));

function openTosModal() { document.getElementById("tos-modal").style.display = "flex"; }
function closeTosModal() { document.getElementById("tos-modal").style.display = "none"; }

// SHA-256 아이디 해싱 레이어
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

// 회원인증 모듈
async function handleAuth() {
    const rawId = document.getElementById("auth-id").value.trim();
    const rawPw = document.getElementById("auth-pw").value.trim();

    if(!rawId || !rawPw) return showCustomAlert("경고", "모든 항목을 입력해 주세요.");

    if (rawId === "아시" && rawPw === "260416") {
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

// 4. 어드민 기능 제어 (커스텀 컨펌 완벽 적용)
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

// 5. 게임 가변 연산 코어 엔진
const lanes = [60, 160, 260, 360];
const keyMap = { 'd': 0, 'f': 1, 'j': 2, 'k': 3 };
let targetY = 480;

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
    audio.play().catch(() => {});

    gameLoop();
}

function gameLoop() {
    if (!gameActive) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 트랙 라인 렌더링
    ctx.strokeStyle = "rgba(138, 43, 226, 0.3)";
    lanes.forEach(x => {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    });

    // 판정선 렌더링
    ctx.strokeStyle = "#00ffff"; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, targetY); ctx.lineTo(canvas.width, targetY); ctx.stroke();

    const audio = document.getElementById("game-audio");
    const currentAudioTime = audio.currentTime;

    // 타임스탬프 기반 정밀 서브노트 배치 연산
    if (chartData.length > 0 && chartData[0].time <= currentAudioTime + 1.2) {
        const next = chartData.shift();
        activeNotes.push({ x: lanes[next.lane], y: 0, lane: next.lane });
    }

    const currentSpeed = speedSettings[selectedDifficulty];
    for (let i = activeNotes.length - 1; i >= 0; i--) {
        let n = activeNotes[i];
        n.y += currentSpeed;

        // 노트 연출 효과
        ctx.fillStyle = "#e0b0ff";
        ctx.fillRect(n.x - 40, n.y - 10, 80, 16);

        if (n.y > canvas.height) {
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

function verifyHit(lane) {
    if(!gameActive) return;
    for(let i=0; i<activeNotes.length; i++) {
        let n = activeNotes[i];
        if(n.lane === lane) {
            let dist = Math.abs(n.y - targetY);
            if(dist < 25) { updateJudgement("PERFECT"); score += 1000; perfectCount++; activeNotes.splice(i,1); break; }
            else if(dist < 50) { updateJudgement("GREAT"); score += 500; activeNotes.splice(i,1); break; }
            else if(dist < 80) { updateJudgement("GOOD"); score += 200; activeNotes.splice(i,1); break; }
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
    
    showCustomAlert("완료", `수평선 종착지에 도달했습니다. 최종 스코어: ${score}점`);
    
    if (currentUser) {
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
    showLobby();
}

// 하드웨어 계층 제어 오버라이딩
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
