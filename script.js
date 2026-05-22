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
    projectId: atob(_skyHorizonConfig.pi),
    storageBucket: atob(_skyHorizonConfig.sb),
    messagingSenderId: atob(_skyHorizonConfig.mi),
    appId: atob(_skyHorizonConfig.ai),
    measurementId: atob(_skyHorizonConfig.ms)
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// 브라우저 내부 기능 제어 잠금
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

// 전역 연산 관리자 컨텍스트 변수
let isSignUpMode = false;
let currentUser = null;
let isAdmin = false;
let currentPlatform = /Mobi|Android|iPhone/i.test(navigator.userAgent) ? "Mobile" : "Desktop";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
let animationId = null;
let gameActive = false;
let score = 0, combo = 0, maxCombo = 0;

let perfectCount = 0;
let greatCount = 0;
let goodCount = 0;
let missCount = 0;

let lanePressed = [false, false, false, false];
let hitParticles = [];
let noteSpeedMultiplier = 4.0;

const ADMIN_ID_HASH = "5101000b55bf9a95db75cfd2a6c49f12064849ade2c6c6a6f7ed0164f7fea29f";
const ADMIN_PW_HASH = "5c8b57a6b0097c4c1542efbcc7a14d50f9e6b6693943d5c24c3c3ededaff733a";

// Plum - Night Sky City 실시간 채보 비트맵 싱크 셋업 데이터
const charts = {
    easy: [
        {time: 1.0, lane: 0}, {time: 2.2, lane: 2}, {time: 3.5, lane: 1}, {time: 4.8, lane: 3},
        {time: 7.0, lane: 0}, {time: 8.2, lane: 2}, {time: 9.5, lane: 1}, {time: 10.8, lane: 3},
        {time: 13.0, lane: 1}, {time: 14.5, lane: 2}, {time: 16.0, lane: 0}, {time: 17.5, lane: 3}
    ],
    normal: [
        {time: 0.8, lane: 0}, {time: 0.8, lane: 3}, 
        {time: 1.6, lane: 2}, {time: 2.4, lane: 1}, {time: 3.2, lane: 3},
        {time: 4.5, lane: 0}, {time: 4.5, lane: 1}, {time: 5.3, lane: 2}, {time: 6.1, lane: 1}
    ],
    hard: [
        {time: 0.5, lane: 0}, {time: 1.0, lane: 2}, {time: 1.5, lane: 1}, {time: 2.0, lane: 3},
        {time: 2.5, lane: 0}, {time: 2.5, lane: 3}, {time: 2.8, lane: 1}, {time: 3.2, lane: 2},
        {time: 5.0, lane: 1}, {time: 5.5, lane: 2}, {time: 6.0, lane: 0}, {time: 6.0, lane: 3}
    ],
    master: [
        {time: 0.3, lane: 0}, {time: 0.3, lane: 1}, {time: 0.6, lane: 2}, {time: 0.6, lane: 3},
        {time: 1.2, lane: 0}, {time: 1.5, lane: 2}, {time: 1.8, lane: 1}, {time: 2.1, lane: 0},
        {time: 5.0, lane: 0}, {time: 5.2, lane: 1}, {time: 5.4, lane: 2}, {time: 5.6, lane: 3}
    ]
};

// 배속 연산 증감 제어 핸들러
function adjustNoteSpeed(amount) {
    let nextSpeed = noteSpeedMultiplier + amount;
    if (nextSpeed >= 1.0 && nextSpeed <= 9.5) {
        noteSpeedMultiplier = nextSpeed;
        document.getElementById("speed-display-value").innerText = noteSpeedMultiplier.toFixed(1);
    }
}

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
    // [안정화 보완] 기존에 실행 중이던 애니메이션 프레임이 있다면 강제 격리 파기
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    selectedDifficulty = diff;
    fitCanvasSize();
    
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.getElementById("game-screen").classList.add("active");
    
    score = 0; combo = 0; maxCombo = 0;
    perfectCount = 0;
    greatCount = 0;
    goodCount = 0;
    missCount = 0;

    hitParticles = [];
    lanePressed = [false, false, false, false];
    chartData = JSON.parse(JSON.stringify(charts[selectedDifficulty]));

    if (!localStorage.getItem("horizon_tutorial_seen")) {
        document.getElementById("tutorial-overlay").style.display = "flex";
        if(currentPlatform === "Mobile") {
            document.getElementById("guide-desktop").classList.add("hidden");
            document.getElementById("guide-mobile").classList.remove("hidden");
        } else {
            document.getElementById("guide-desktop").classList.remove("hidden");
            document.getElementById("guide-mobile").classList.add("hidden");
        }
    } else {
        triggerAudioAndLoop();
    }
}

function closeTutorialAndStart() {
    document.getElementById("tutorial-overlay").style.display = "none";
    localStorage.setItem("horizon_tutorial_seen", "true");
    triggerAudioAndLoop();
}

function triggerAudioAndLoop() {
    // [안정화 보완] 혹시 모를 중복 루프 방지 처리 강화
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    gameActive = true;
    const audio = document.getElementById("game-audio");
    audio.currentTime = 0;
    audio.play().catch((err) => { console.warn(err); });
    gameLoop();
}

function exitGameMidway() {
    showCustomAlert("중도 하차", "진행 중인 모든 기록을 초기화하고 은하 대기실로 귀환하시겠습니까?", true, () => {
        gameActive = false;
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        const audio = document.getElementById("game-audio");
        audio.pause();
        audio.currentTime = 0;
        showLobby();
    });
}

function gameLoop() {
    if (!gameActive) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const audio = document.getElementById("game-audio");
    const currentAudioTime = audio.currentTime;

    const currentSpeedFactor = noteSpeedMultiplier * 110; 
    const lookAheadTime = targetY / currentSpeedFactor;

    for(let l=0; l<4; l++) {
        if(lanePressed[l]) {
            let grad = ctx.createLinearGradient(lanes[l]-50, 0, lanes[l]+50, canvas.height);
            grad.addColorStop(0, "rgba(138, 43, 226, 0.0)");
            grad.addColorStop(0.85, "rgba(138, 43, 226, 0.25)");
            grad.addColorStop(1, "rgba(0, 255, 255, 0.1)");
            ctx.fillStyle = grad;
            ctx.fillRect(lanes[l]-46, 0, 92, canvas.height);
        }
    }

    ctx.strokeStyle = "rgba(138, 43, 226, 0.3)";
    lanes.forEach(x => {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    });

    ctx.strokeStyle = "#00ffff"; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, targetY); ctx.lineTo(canvas.width, targetY); ctx.stroke();

    while (chartData.length > 0 && chartData[0].time <= currentAudioTime + lookAheadTime) {
        const next = chartData.shift();
        activeNotes.push({ targetTime: next.time, lane: next.lane, x: lanes[next.lane] });
    }

    for (let i = activeNotes.length - 1; i >= 0; i--) {
        let n = activeNotes[i];
        n.y = targetY - (n.targetTime - currentAudioTime) * currentSpeedFactor;

        let noteGrad = ctx.createLinearGradient(n.x - 40, n.y - 10, n.x + 40, n.y + 6);
        noteGrad.addColorStop(0, "#ff00ff");
        noteGrad.addColorStop(1, "#00ffff");
        ctx.fillStyle = noteGrad;
        ctx.fillRect(n.x - 44, n.y - 9, 88, 18);

        if (currentAudioTime > n.targetTime + 0.15) {
            activeNotes.splice(i, 1);
            missCount++; 
            updateJudgement("MISS");
        }
    }

    for (let p = hitParticles.length - 1; p >= 0; p--) {
        let pt = hitParticles[p];
        pt.x += pt.vx; pt.y += pt.vy; pt.alpha -= 0.04;
        if(pt.alpha <= 0) { hitParticles.splice(p, 1); continue; }
        ctx.fillStyle = `rgba(0, 255, 255, ${pt.alpha})`;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2); ctx.fill();
    }

    if (audio.ended || (chartData.length === 0 && activeNotes.length === 0)) {
        finishGame();
        return;
    }
    animationId = requestAnimationFrame(gameLoop);
}

function createSparks(startX, startY) {
    for(let i=0; i<15; i++) {
        hitParticles.push({
            x: startX, y: startY,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.7) * 8,
            size: Math.random() * 3 + 1, alpha: 1.0
        });
    }
}

function verifyHit(lane) {
    if(!gameActive) return;
    const audio = document.getElementById("game-audio");
    const currentAudioTime = audio.currentTime;
    
    for(let i=0; i<activeNotes.length; i++) {
        let n = activeNotes[i];
        if(n.lane === lane) {
            let timeDiff = Math.abs(n.targetTime - currentAudioTime);
            
            if(timeDiff < 0.05) { 
                updateJudgement("PERFECT"); score += 1000; perfectCount++; 
                createSparks(n.x, targetY); activeNotes.splice(i,1); break;
            } else if(timeDiff < 0.10) { 
                updateJudgement("GREAT"); score += 500; greatCount++;
                createSparks(n.x, targetY); activeNotes.splice(i,1); break;
            } else if(timeDiff < 0.15) { 
                updateJudgement("GOOD"); score += 200; goodCount++;
                createSparks(n.x, targetY); activeNotes.splice(i,1); break;
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
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    const audio = document.getElementById("game-audio");
    audio.pause();
    audio.currentTime = 0;
    
    let englishLiveTitle = "LIVE CLEAR";
    
    if (goodCount === 0 && missCount === 0) {
        if (greatCount === 0 && perfectCount > 0) {
            englishLiveTitle = "PERFECT LIVE";
        } else {
            englishLiveTitle = "FULL COMBO";
        }
    }

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

    showCustomAlert(
        englishLiveTitle, 
        `SCORE: ${score.toLocaleString()}   |   MAX COMBO: ${maxCombo}`, 
        false, 
        () => {
            showLobby();
        }
    );
}

window.addEventListener("keydown", e => {
    const k = e.key.toLowerCase();
    if (keyMap[k] !== undefined) {
        lanePressed[keyMap[k]] = true;
        verifyHit(keyMap[k]);
    }
});

window.addEventListener("keyup", e => {
    const k = e.key.toLowerCase();
    if (keyMap[k] !== undefined) {
        lanePressed[keyMap[k]] = false;
    }
});

document.querySelectorAll(".touch-zone").forEach(z => {
    const currentLane = keyMap[z.getAttribute("data-key")];
    z.addEventListener("touchstart", e => {
        e.preventDefault();
        lanePressed[currentLane] = true;
        verifyHit(currentLane);
    });
    z.addEventListener("touchend", e => {
        e.preventDefault();
        lanePressed[currentLane] = false;
    });
});
