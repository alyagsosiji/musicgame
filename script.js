// 1. Firebase 초기화 및 개인정보 해싱 적용 문구
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

// 브라우저 기본 보안 및 조작 불허 장치 잠금
window.addEventListener('contextmenu', e => e.preventDefault());
window.addEventListener('selectstart', e => e.preventDefault());
window.addEventListener('dragstart', e => e.preventDefault());
window.addEventListener('keydown', function (e) {
    if (e.keyCode === 123) { e.preventDefault(); return false; }
    if (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) { e.preventDefault(); return false; }
    if (e.ctrlKey && e.keyCode === 85) { e.preventDefault(); return false; }
});

// 시스템 변수 및 기기 판정
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

// [보완] 고유 정밀 채보 데이터베이스 (곡 타임스탬프 기준 매핑)
const charts = {
    easy: [ {time: 1.2, lane: 0}, {time: 2.4, lane: 1}, {time: 3.6, lane: 2}, {time: 4.8, lane: 3}, {time: 6.0, lane: 1} ],
    normal: [ {time: 1.0, lane: 0}, {time: 1.8, lane: 2}, {time: 2.5, lane: 1}, {time: 3.2, lane: 3}, {time: 4.0, lane: 0} ],
    hard: [ {time: 0.5, lane: 0}, {time: 0.9, lane: 3}, {time: 1.3, lane: 1}, {time: 1.7, lane: 2}, {time: 2.1, lane: 0} ],
    master: [ {time: 0.3, lane: 1}, {time: 0.6, lane: 2}, {time: 0.9, lane: 0}, {time: 1.2, lane: 3}, {time: 1.5, lane: 1} ]
};
const speedSettings = { easy: 5, normal: 7, hard: 10, master: 14 };

// 2. 자체 커스텀 알림 시스템 기능 구현
function showCustomAlert(title, message) {
    document.getElementById("popup-title").innerText = title;
    document.getElementById("popup-message").innerText = message;
    document.getElementById("custom-popup").style.display = "flex";
}
function closeCustomPopup() {
    document.getElementById("custom-popup").style.display = "none";
}

// 3. 약관 창 제어
function openTosModal() { document.getElementById("tos-modal").style.display = "flex"; }
function closeTosModal() { document.getElementById("tos-modal").style.display = "none"; }

// 4. 단방향 문자열 암호화 처리용 헬퍼함수 (Web Crypto API 적용)
async function secureHash(string) {
    const utf8 = new TextEncoder().encode(string);
    const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function toggleAuthMode() {
    isSignUpMode = !isSignUpMode;
    document.getElementById("auth-title").innerText = isSignUpMode ? "새 은하 가입 (회원가입)" : "우주 진입 (로그인)";
    document.getElementById("auth-toggle").innerText = isSignUpMode ? "이미 계정이 있으신가요? 로그인하기" : "회원가입하기";
}

// 회원가입 및 로그인 절차 
async function handleAuth() {
    const rawId = document.getElementById("auth-id").value.trim();
    const rawPw = document.getElementById("auth-pw").value.trim();

    if(!rawId || !rawPw) return showCustomAlert("경고", "아이디와 비밀번호를 모두 기재해 주세요.");

    // 어드민 전용 지정 계정 매칭 규칙
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
            // 유저 관리를 위한 별도 컬렉션 생성 기록 저장
            await db.collection("horizon_users").doc(userCredential.user.uid).set({
                username: rawId,
                joinedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            showCustomAlert("성공", "우주선 승선 등록이 수락되었습니다.");
        } else {
            await auth.signInWithEmailAndPassword(secureEmail, rawPw);
        }
    } catch (error) {
        showCustomAlert("오류", "계정 인증 도중 거부되었습니다: " + error.message);
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

// 5. [보완] 어드민 탭 전환 및 유저 관리 기능 구현
function switchAdminTab(type) {
    document.querySelectorAll(".admin-tab-content").forEach(c => c.classList.remove("active"));
    if(type === 'rank') document.getElementById("admin-rank-section").classList.add("active");
    if(type === 'user') document.getElementById("admin-user-section").classList.add("active");
}

async function openAdminPanel() {
    if(!isAdmin) return;
    document.getElementById("admin-modal").style.display = "flex";
    
    // 랭킹 목록 갱신
    const rankTbody = document.getElementById("admin-ranking-tbody");
    rankTbody.innerHTML = "";
    const rankSnap = await db.collection("horizon_rankings").limit(30).get();
    rankSnap.forEach(doc => {
        const d = doc.data();
        rankTbody.innerHTML += `<tr><td>${d.username}</td><td>${d.score}</td><td>${d.difficulty}</td>
        <td><button onclick="deleteRank('${doc.id}')" style="background:#cc0000; padding:4px;">삭제</button></td></tr>`;
    });

    // 유저 목록 명단 로드
    const userTbody = document.getElementById("admin-user-tbody");
    userTbody.innerHTML = "";
    const userSnap = await db.collection("horizon_users").limit(30).get();
    userSnap.forEach(doc => {
        const u = doc.data();
        userTbody.innerHTML += `<tr><td>${u.username}</td><td>정상 작동 중</td>
        <td><button onclick="banUser('${doc.id}')" style="background:#cc0000; padding:4px;">추방</button></td></tr>`;
    });
}

function closeAdminPanel() { document.getElementById("admin-modal").style.display = "none"; }

async function deleteRank(id) {
    if(confirm("기록을 파기합니까?")) { await db.collection("horizon_rankings").doc(id).delete(); openAdminPanel(); loadRankings(); }
}
async function banUser(id) {
    if(confirm("해당 유저를 추방 처리하시겠습니까?")) { await db.collection("horizon_users").doc(id).delete(); openAdminPanel(); }
}

// 6. 리듬게임 가변 연산 메인 엔진
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
    
    // 깊은 복사로 채보 복제 생성
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
    
    // 레인 가이드 도식화
    ctx.strokeStyle = "rgba(138, 43, 226, 0.3)";
    lanes.forEach(x => {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    });

    // 판정선 (수평선 일루전)
    ctx.strokeStyle = "#00ffff"; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, targetY); ctx.lineTo(canvas.width, targetY); ctx.stroke();

    const audio = document.getElementById("game-audio");
    const currentAudioTime = audio.currentTime;

    // 실시간 비트맵 타임 노출 연산
    if (chartData.length > 0 && chartData[0].time <= currentAudioTime + 1.5) {
        const next = chartData.shift();
        activeNotes.push({ x: lanes[next.lane], y: 0, lane: next.lane });
    }

    const currentSpeed = speedSettings[selectedDifficulty];
    for (let i = activeNotes.length - 1; i >= 0; i--) {
        let n = activeNotes[i];
        n.y += currentSpeed;

        // 몽환적 노트 그래픽 연산
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
    showCustomAlert("완료", `최종 스코어 ${score}점을 획득했습니다.`);
    
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

// 크로스플랫폼 통합 바인딩 제어
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
