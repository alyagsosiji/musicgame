// Firebase 구성 정보 설정
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

// 개발자 도구 및 무단 불펌 기능 전면 잠금 (F12, 단축키, 우클릭 차단)
window.addEventListener('keydown', function (e) {
    if (e.keyCode === 123) { e.preventDefault(); return false; }
    if (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) { e.preventDefault(); return false; }
    if (e.ctrlKey && e.keyCode === 85) { e.preventDefault(); return false; }
});

// 전역 관리 변수
let isSignUpMode = false;
let currentUser = null;
let isAdmin = false;
let currentPlatform = /Mobi|Android|iPhone/i.test(navigator.userAgent) ? "Mobile" : "Desktop";

// 리듬 게임 핵심 내부 데이터
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
let animationId;
let gameActive = false;
let score = 0;
let combo = 0;
let maxCombo = 0;
let perfectCount = 0;
let selectedDifficulty = 'easy';
let notes = [];
let lastNoteTime = 0;

// 우주 수평선 너머 공간 난이도 설정 메트릭스
const difficultySettings = {
    easy: { speed: 4, interval: 1000 },
    normal: { speed: 6, interval: 750 },
    hard: { speed: 9, interval: 480 },
    master: { speed: 12, interval: 320 }
};

// 화면 토글링 시스템
function toggleAuthMode() {
    isSignUpMode = !isSignUpMode;
    document.getElementById("auth-title").innerText = isSignUpMode ? "새로운 은하 생성 (회원가입)" : "우주 진입 (로그인)";
    document.getElementById("auth-toggle").innerText = isSignUpMode ? "이미 계정이 있으신가요? 로그인하기" : "새로운 여행자이신가요? 회원가입하기";
}

// 비밀번호 및 아이디 핸들러 로직
async function handleAuth() {
    const rawId = document.getElementById("auth-id").value.trim();
    const rawPw = document.getElementById("auth-pw").value.trim();

    if(!rawId || !rawPw) return alert("아이디와 비밀번호를 빠짐없이 입력해주세요.");

    // 지정 관리자 계정 하드코딩 검증 규칙
    if (rawId === "아시" && rawPw === "260416") {
        isAdmin = true;
        currentUser = { uid: "admin_asi", displayName: "아시(관리자)", email: "asi@horizon.com" };
        document.getElementById("btn-admin").classList.remove("hidden");
        showLobby();
        return;
    }

    // 일반 유저는 Firebase 인증 체계 호환을 위해 가상 이메일 마스킹 처리
    const emailFormat = rawId.includes("@") ? rawId : `${rawId}@horizon.com`;

    try {
        if (isSignUpMode) {
            const userCredential = await auth.createUserWithEmailAndPassword(emailFormat, rawPw);
            await userCredential.user.updateProfile({ displayName: rawId });
            alert("우주선 승선이 완료되었습니다. (회원가입 성공)");
        } else {
            await auth.signInWithEmailAndPassword(emailFormat, rawPw);
        }
    } catch (error) {
        alert("인증에 실패하였습니다: " + error.message);
    }
}

// 실시간 인증 상태 리스너
auth.onAuthStateChanged((user) => {
    if (user && !isAdmin) {
        currentUser = user;
        showLobby();
    } else if (!isAdmin) {
        showScreen("auth-screen");
    }
});

function handleLogout() {
    auth.signOut();
    isAdmin = false;
    currentUser = null;
    document.getElementById("btn-admin").classList.add("hidden");
    showScreen("auth-screen");
}

function showScreen(screenId) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.getElementById(screenId).classList.add("active");
}

function showLobby() {
    showScreen("lobby-screen");
    document.getElementById("user-welcome").innerText = `반갑습니다, ${currentUser.displayName || currentUser.email.split('@')[0]} 여행자님!`;
    loadRankings();
}

// 글로벌 리더보드 데이터 파싱
async function loadRankings() {
    const tbody = document.getElementById("ranking-tbody");
    tbody.innerHTML = "";
    
    try {
        const snapshot = await db.collection("horizon_rankings").orderBy("score", "desc").limit(25).get();
        let rank = 1;
        snapshot.forEach(doc => {
            const data = doc.data();
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${rank++}</td>
                <td>${data.username}</td>
                <td class="${data.difficulty}">${data.difficulty.toUpperCase()}</td>
                <td>${data.score}</td>
                <td>${data.maxCombo}</td>
                <td>${data.perfectCount}</td>
                <td><span class="platform-badge">${data.platform || 'Desktop'}</span></td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error("랭킹 테이블 로드 실패:", err);
    }
}

// 최종 결과 수평선 저장 인젝터
async function saveScore() {
    if(!currentUser) return;
    try {
        await db.collection("horizon_rankings").add({
            uid: currentUser.uid,
            username: currentUser.displayName || currentUser.email.split('@')[0],
            score: score,
            maxCombo: maxCombo,
            perfectCount: perfectCount,
            difficulty: selectedDifficulty,
            platform: currentPlatform,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (err) {
        console.error("클라우드 기록 실패:", err);
    }
}

// 어드민 전용 컨트롤 패널 로직
async function openAdminPanel() {
    if(!isAdmin) return;
    document.getElementById("admin-modal").style.display = "flex";
    const tbody = document.getElementById("admin-tbody");
    tbody.innerHTML = "";

    const snapshot = await db.collection("horizon_rankings").orderBy("timestamp", "desc").limit(50).get();
    snapshot.forEach(doc => {
        const data = doc.data();
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${data.username}</td>
            <td>${data.score}</td>
            <td>${data.difficulty}</td>
            <td><button onclick="deleteData('${doc.id}')" style="background:#cc0000; padding:4px 8px; font-size:0.8rem;">삭제</button></td>
        `;
        tbody.appendChild(tr);
    });
}

function closeAdminPanel() {
    document.getElementById("admin-modal").style.display = "none";
}

async function deleteData(docId) {
    if(confirm("수평선 너머 기록실에서 이 데이터를 영구 파기하시겠습니까?")) {
        await db.collection("horizon_rankings").doc(docId).delete();
        openAdminPanel();
        loadRankings();
    }
}

// 리듬게임 연산 엔진 구역
const lanes = [100, 200, 300, 400];
const keyMap = { 'd': 0, 'f': 1, 'j': 2, 'k': 3 };
const targetY = 500;

function resizeCanvas() {
    canvas.width = 500;
    canvas.height = 600;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function startGame(diff) {
    selectedDifficulty = diff;
    showScreen("game-screen");
    
    score = 0; combo = 0; maxCombo = 0; perfectCount = 0;
    notes = [];
    gameActive = true;
    
    document.getElementById("game-score").innerText = "SCORE: 0";
    document.getElementById("game-combo").innerText = "0 COMBO";
    document.getElementById("game-judge").innerText = "START";

    const audio = document.getElementById("game-audio");
    audio.currentTime = 0;
    audio.play().catch(e => console.log("음악 리소스를 확인해주세요."));

    lastNoteTime = Date.now();
    gameLoop();
}

function gameLoop() {
    if (!gameActive) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawTrack();

    const now = Date.now();
    const config = difficultySettings[selectedDifficulty];
    if (now - lastNoteTime > config.interval) {
        const randomLane = Math.floor(Math.random() * 4);
        notes.push({ x: lanes[randomLane], y: 0, lane: randomLane });
        lastNoteTime = now;
    }

    for (let i = notes.length - 1; i >= 0; i--) {
        let n = notes[i];
        n.y += config.speed;
        
        // 우주의 수평선 네온 이펙트 노트 디자인
        ctx.fillStyle = "#e0b0ff";
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#ff00ff";
        ctx.fillRect(n.x - 40, n.y - 10, 80, 20);
        ctx.shadowBlur = 0;

        if (n.y > canvas.height) {
            notes.splice(i, 1);
            triggerJudgement("MISS");
        }
    }

    const audio = document.getElementById("game-audio");
    if(audio.ended) {
        endGame();
        return;
    }

    animationId = requestAnimationFrame(gameLoop);
}

function drawTrack() {
    // 트랙 라인
    ctx.strokeStyle = "rgba(138, 43, 226, 0.25)";
    ctx.lineWidth = 2;
    for(let i=0; i<lanes.length; i++) {
        ctx.beginPath();
        ctx.moveTo(lanes[i], 0);
        ctx.lineTo(lanes[i], canvas.height);
        ctx.stroke();
    }
    
    // 판정선 (수평선 효과)
    ctx.strokeStyle = "#00ffff";
    ctx.lineWidth = 4;
    ctx.shadowBlur = 12;
    ctx.shadowColor = "#00ffff";
    ctx.beginPath();
    ctx.moveTo(0, targetY);
    ctx.lineTo(canvas.width, targetY);
    ctx.stroke();
    ctx.shadowBlur = 0;
}

function pressKey(laneIndex) {
    if (!gameActive) return;
    
    let hit = false;
    for (let i = 0; i < notes.length; i++) {
        let n = notes[i];
        if (n.lane === laneIndex) {
            let distance = Math.abs(n.y - targetY);
            
            if (distance < 28) {
                triggerJudgement("PERFECT");
                score += 1000 + combo * 10;
                perfectCount++;
                hit = true;
            } else if (distance < 55) {
                triggerJudgement("GREAT");
                score += 600 + combo * 5;
                hit = true;
            } else if (distance < 85) {
                triggerJudgement("GOOD");
                score += 300;
                hit = true;
            }
            
            if (hit) {
                notes.splice(i, 1);
                break;
            }
        }
    }
}

function triggerJudgement(type) {
    const judgeDiv = document.getElementById("game-judge");
    judgeDiv.innerText = type;
    
    if (type === "MISS") {
        combo = 0;
        judgeDiv.style.color = "#ff3333";
    } else {
        combo++;
        if(combo > maxCombo) maxCombo = combo;
        judgeDiv.style.color = type === "PERFECT" ? "#00ffff" : "#ff00ff";
    }
    document.getElementById("game-combo").innerText = `${combo} COMBO`;
    document.getElementById("game-score").innerText = `SCORE: ${score}`;
}

async function endGame() {
    gameActive = false;
    cancelAnimationFrame(animationId);
    alert(`수평선 끝에 도달했습니다!\n최종 스코어: ${score}점`);
    await saveScore();
    showLobby();
}

// 하드웨어 입력 바인딩 제어 (크로스플랫폼 완전 분리)
window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    if (keyMap[key] !== undefined) pressKey(keyMap[key]);
});

document.querySelectorAll(".touch-zone").forEach(zone => {
    zone.addEventListener("touchstart", (e) => {
        e.preventDefault();
        const key = zone.getAttribute("data-key");
        if (keyMap[key] !== undefined) pressKey(keyMap[key]);
    });
});
