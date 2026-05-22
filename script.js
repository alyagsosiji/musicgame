// 1. 암호화(인코딩)된 Firebase 구성 정보 (오타 완벽 복구)
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

// 📢 코드 직접 수정형 공지사항 시트 데이터베이스
const horizonNotices = [
    {
        date: "2026-05-22",
        title: "🚀 수평선(Horizon) 은하 서비스 정식 가동",
        content: "여행자 여러분 환영합니다! Plum 작곡가님의 'Night Sky City' 곡을 이용한 리듬게임이 가동되었습니다. 은하 필드에서의 멋진 연주를 기대합니다."
    },
    {
        date: "2026-05-22",
        title: "🛠️ 시스템 대규모 기능 확장 패치 완료 리포트",
        content: "유저 편의 및 연출 강화를 위해 [볼륨 조절 슬라이더 슬롯], [인게임 일시정지 및 복구(P 키)], [오디오 장치 밀림 미세 제어 싱크 Offset(◀/▶ 키)], [판정 색상별 지향성 확산 충격파 링 이펙트] 4대 편의 기능의 하드웨어 최적화 융합이 완벽하게 완료되었습니다."
    },
    {
        date: "2026-05-19",
        title: "🔒 여행자 개인정보 안심 보안 수집 프로토콜",
        content: "본 시스템은 가입 시 실제 이메일을 일절 요구하거나 수집하지 않으며 오직 닉네임 해싱 가상 세션 식별 키로만 매핑됩니다. 따라서 비밀번호 분실 시 복구가 원천적으로 불가하오니 분실에 각별히 주의하시기 바랍니다."
    }
];

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

// 전역 상태 파라미터 변수 선언 관리부
let isSignUpMode = false;
let currentUser = null;
let isAdmin = false;
let currentPlatform = /Mobi|Android|iPhone/i.test(navigator.userAgent) ? "Mobile" : "Desktop";
let isAuthActionLock = false; 

let activeNotes = []; 
let chartData = [];
let selectedDifficulty = "easy";
let popupCallback = null;

// 실시간 통신 연결 제어용 구독 변수 파트
let rankingUnsubscribe = null; 
let adminRankUnsubscribe = null;
let adminUserUnsubscribe = null;

// 안티 스터터 타임라인 및 편의 기능 제어 변수군
let currentAudioTime = 0;
let lastAudioTime = 0;
let lastTimeSync = 0;
let cachedNoteGradients = []; 

let gameVolume = 0.8;          
let audioOffset = 0.000;       
let isPaused = false;          
let pauseStartTime = 0;        
let hitRings = [];             

let canvas, ctx;
let animationId = null;
let gameActive = false;
let score = 0, combo = 0, maxCombo = 0;

let perfectCount = 0;
let greatCount = 0;
let goodCount = 0;
let missCount = 0;

const lanes = [60, 160, 260, 360];
const keyMap = { 'd': 0, 'f': 1, 'j': 2, 'k': 3 };
let targetY = 476;

let lanePressed = [false, false, false, false];
let hitParticles = [];
let noteSpeedMultiplier = 4.0;

const ADMIN_ID_HASH = "5101000b55bf9a95db75cfd2a6c49f12064849ade2c6c6a6f7ed0164f7fea29f";
const ADMIN_PW_HASH = "5c8b57a6b0097c4c1542efbcc7a14d50f9e6b6693943d5c24c3c3ededaff733a";

// Plum - Night Sky City 공식 전 난이도 채보 시트 기반
const charts = {
    easy: [
        {time: 1.5, lane: 0}, {time: 3.0, lane: 2}, {time: 4.5, lane: 1}, {time: 6.0, lane: 3},
        {time: 7.5, lane: 2}, {time: 9.0, lane: 1}, {time: 10.5, lane: 0}, {time: 12.0, lane: 3},
        {time: 13.5, lane: 1}, {time: 15.0, lane: 2},
        {time: 16.5, lane: 0}, {time: 18.0, lane: 1}, {time: 19.5, lane: 2}, {time: 21.0, lane: 3},
        {time: 22.0, lane: 2}, {time: 23.5, lane: 1}, {time: 25.0, lane: 0}, {time: 26.5, lane: 3},
        {time: 28.0, lane: 1}, {time: 29.5, lane: 2}, {time: 31.0, lane: 0}, {time: 32.5, lane: 3},
        {time: 34.0, lane: 1}, {time: 35.5, lane: 2}, {time: 37.0, lane: 0}, {time: 38.5, lane: 1},
        {time: 40.0, lane: 2}, {time: 41.5, lane: 3}, {time: 43.0, lane: 1}, {time: 44.5, lane: 2},
        {time: 45.5, lane: 0}, {time: 46.5, lane: 3}, {time: 47.5, lane: 1}, {time: 48.5, lane: 2},
        {time: 49.5, lane: 0}, {time: 50.5, lane: 1}, {time: 51.5, lane: 2}, {time: 52.5, lane: 3},
        {time: 53.5, lane: 0}, {time: 54.0, lane: 1}, {time: 54.5, lane: 2}, {time: 55.0, lane: 3},
        {time: 56.0, lane: 0}, {time: 57.0, lane: 2}, {time: 58.0, lane: 1}, {time: 59.0, lane: 3},
        {time: 60.0, lane: 2}, {time: 61.0, lane: 0}, {time: 62.0, lane: 3}, {time: 63.0, lane: 1},
        {time: 64.0, lane: 0}, {time: 65.0, lane: 2}, {time: 66.0, lane: 1}, {time: 67.0, lane: 3},
        {time: 68.0, lane: 2}, {time: 69.0, lane: 1}, {time: 70.0, lane: 0}, {time: 71.5, lane: 3},
        {time: 73.0, lane: 1}, {time: 74.5, lane: 2}, {time: 76.0, lane: 0}, {time: 77.5, lane: 3},
        {time: 79.0, lane: 1}, {time: 80.5, lane: 2}, {time: 82.0, lane: 0}, {time: 83.5, lane: 3},
        {time: 85.0, lane: 2}, {time: 87.0, lane: 1}, {time: 89.0, lane: 0}, {time: 91.0, lane: 3},
        {time: 93.0, lane: 1}, {time: 95.0, lane: 2}, {time: 97.0, lane: 0}, {time: 99.0, lane: 3}
    ],
    normal: [
        {time: 1.0, lane: 0}, {time: 1.8, lane: 3}, {time: 2.6, lane: 1}, {time: 3.4, lane: 2},
        {time: 4.2, lane: 0}, {time: 5.0, lane: 3}, {time: 5.8, lane: 1}, {time: 6.6, lane: 2},
        {time: 7.4, lane: 0}, {time: 8.2, lane: 3}, {time: 9.0, lane: 1}, {time: 9.8, lane: 2},
        {time: 10.6, lane: 0}, {time: 11.4, lane: 3}, {time: 12.2, lane: 1}, {time: 13.0, lane: 2},
        {time: 13.8, lane: 0}, {time: 14.4, lane: 1}, {time: 15.0, lane: 2}, {time: 15.6, lane: 3},
        {time: 16.5, lane: 0}, {time: 16.5, lane: 3}, {time: 17.5, lane: 1}, {time: 18.3, lane: 2},
        {time: 19.1, lane: 0}, {time: 19.9, lane: 3}, {time: 20.7, lane: 1}, {time: 21.5, lane: 2},
        {time: 22.3, lane: 0}, {time: 22.3, lane: 2}, {time: 23.3, lane: 1}, {time: 24.1, lane: 3},
        {time: 24.9, lane: 0}, {time: 25.7, lane: 2}, {time: 26.5, lane: 1}, {time: 27.3, lane: 3},
        {time: 28.1, lane: 0}, {time: 28.1, lane: 3}, {time: 29.1, lane: 1}, {time: 29.9, lane: 2},
        {time: 30.7, lane: 0}, {time: 31.5, lane: 3}, {time: 32.3, lane: 1}, {time: 33.1, lane: 2},
        {time: 33.9, lane: 0}, {time: 33.9, lane: 2}, {time: 34.9, lane: 1}, {time: 35.7, lane: 3},
        {time: 36.5, lane: 0}, {time: 37.3, lane: 2}, {time: 38.1, lane: 1}, {time: 38.9, lane: 3},
        {time: 40.0, lane: 0}, {time: 40.8, lane: 1}, {time: 41.6, lane: 2}, {time: 42.4, lane: 3},
        {time: 43.2, lane: 0}, {time: 44.0, lane: 1}, {time: 44.8, lane: 2}, {time: 45.4, lane: 3},
        {time: 46.0, lane: 0}, {time: 46.5, lane: 1}, {time: 47.0, lane: 2}, {time: 47.5, lane: 3},
        {time: 48.0, lane: 2}, {time: 48.5, lane: 1}, {time: 49.0, lane: 0}, {time: 49.5, lane: 3},
        {time: 50.2, lane: 1}, {time: 50.8, lane: 2}, {time: 51.4, lane: 0}, {time: 52.0, lane: 3},
        {time: 52.6, lane: 1}, {time: 53.2, lane: 2}, {time: 53.8, lane: 0}, {time: 54.4, lane: 3},
        {time: 54.8, lane: 1}, {time: 55.2, lane: 2}, {time: 55.6, lane: 0}, {time: 55.6, lane: 3},
        {time: 56.2, lane: 0}, {time: 56.8, lane: 2}, {time: 57.4, lane: 1}, {time: 58.0, lane: 3},
        {time: 58.6, lane: 0}, {time: 58.6, lane: 2}, {time: 59.4, lane: 1}, {time: 60.0, lane: 3},
        {time: 60.6, lane: 0}, {time: 61.2, lane: 2}, {time: 61.8, lane: 1}, {time: 62.4, lane: 3},
        {time: 63.0, lane: 1}, {time: 63.0, lane: 3}, {time: 63.8, lane: 0}, {time: 64.4, lane: 2},
        {time: 65.2, lane: 0}, {time: 65.8, lane: 2}, {time: 66.4, lane: 1}, {time: 67.0, lane: 3},
        {time: 67.6, lane: 0}, {time: 67.6, lane: 2}, {time: 68.4, lane: 1}, {time: 69.0, lane: 3},
        {time: 69.6, lane: 0}, {time: 70.2, lane: 2}, {time: 71.8, lane: 1}, {time: 72.4, lane: 3},
        {time: 73.2, lane: 0}, {time: 73.2, lane: 3}, {time: 74.0, lane: 1}, {time: 74.8, lane: 2},
        {time: 75.6, lane: 0}, {time: 76.4, lane: 3}, {time: 77.2, lane: 1}, {time: 78.0, lane: 2},
        {time: 78.8, lane: 0}, {time: 78.8, lane: 2}, {time: 79.6, lane: 1}, {time: 80.4, lane: 3},
        {time: 81.2, lane: 0}, {time: 82.0, lane: 2}, {time: 82.8, lane: 1}, {time: 83.6, lane: 3},
        {time: 84.4, lane: 0}, {time: 84.4, lane: 3},
        {time: 86.0, lane: 1}, {time: 87.0, lane: 2}, {time: 88.0, lane: 0}, {time: 89.0, lane: 3},
        {time: 90.5, lane: 1}, {time: 91.5, lane: 2}, {time: 92.5, lane: 0}, {time: 93.5, lane: 3},
        {time: 95.0, lane: 1}, {time: 96.5, lane: 2}, {time: 98.0, lane: 0}, {time: 99.5, lane: 3}
    ],
    hard: [],
    master: []
};

// 고밀도 채보 생성기
(function generatePerfectCharts() {
    for (let t = 1.0; t < 16.0; t += 0.8) {
        charts.hard.push({ time: parseFloat(t.toFixed(2)), lane: Math.floor(t * 3) % 4 });
    }
    for (let t = 16.0; t < 40.0; t += 0.4) {
        let lane = Math.floor(t * 7) % 4;
        charts.hard.push({ time: parseFloat(t.toFixed(2)), lane: lane });
        if (parseFloat((t % 1.6).toFixed(1)) === 0) {
            charts.hard.push({ time: parseFloat(t.toFixed(2)), lane: (lane + 2) % 4 });
        }
    }
    for (let t = 40.0; t < 52.0; t += 0.2) {
        charts.hard.push({ time: parseFloat(t.toFixed(2)), lane: Math.floor(t * 11) % 4 });
    }
    for (let t = 52.0; t < 84.0; t += 0.2) {
        let lane = Math.floor(t * 13) % 4;
        charts.hard.push({ time: parseFloat(t.toFixed(2)), lane: lane });
        if (parseFloat((t % 0.8).toFixed(1)) === 0) {
            charts.hard.push({ time: parseFloat(t.toFixed(2)), lane: (lane + 2) % 4 });
        }
    }
    for (let t = 84.0; t < 100.0; t += 0.6) {
        charts.hard.push({ time: parseFloat(t.toFixed(2)), lane: Math.floor(t * 5) % 4 });
    }

    for (let t = 1.0; t < 16.0; t += 0.4) {
        charts.master.push({ time: parseFloat(t.toFixed(2)), lane: Math.floor(t * 5) % 4 });
    }
    for (let t = 16.0; t < 40.0; t += 0.2) {
        let lane = Math.floor(t * 13) % 4;
        charts.master.push({ time: parseFloat(t.toFixed(2)), lane: lane });
        if (parseFloat((t % 0.8).toFixed(1)) === 0) {
            charts.master.push({ time: parseFloat(t.toFixed(2)), lane: (lane + 2) % 4 });
        }
    }
    for (let t = 40.0; t < 52.0; t += 0.1) {
        charts.master.push({ time: parseFloat(t.toFixed(2)), lane: Math.floor(t * 23) % 4 });
    }
    for (let t = 52.0; t < 84.0; t += 0.1) {
        let lane = Math.floor(t * 29) % 4;
        charts.master.push({ time: parseFloat(t.toFixed(2)), lane: lane });
        if (parseFloat((t % 0.4).toFixed(1)) === 0) {
            charts.master.push({ time: parseFloat(t.toFixed(2)), lane: (lane + 1) % 4 });
            charts.master.push({ time: parseFloat(t.toFixed(2)), lane: (lane + 2) % 4 });
        }
    }
    for (let t = 84.0; t < 100.0; t += 0.3) {
        charts.master.push({ time: parseFloat(t.toFixed(2)), lane: Math.floor(t * 7) % 4 });
    }

    charts.hard.sort((a, b) => a.time - b.time);
    charts.master.sort((a, b) => a.time - b.time);
})();

function preCacheGradients() {
    if (!canvas) return;
    cachedNoteGradients = lanes.map(x => {
        let g = ctx.createLinearGradient(x - 40, 0, x + 40, 0);
        g.addColorStop(0, "#ff00ff");
        g.addColorStop(1, "#00ffff");
        return g;
    });
}

function adjustNoteSpeed(amount) {
    let nextSpeed = noteSpeedMultiplier + amount;
    if (nextSpeed >= 1.0 && nextSpeed <= 9.5) {
        noteSpeedMultiplier = nextSpeed;
        const speedDisplay = document.getElementById("speed-display-value");
        if (speedDisplay) speedDisplay.innerText = noteSpeedMultiplier.toFixed(1);
    }
}

function adjustAudioOffset(amount) {
    audioOffset = parseFloat((audioOffset + amount).toFixed(3));
    const offsetDisplay = document.getElementById("offset-display-value");
    if (offsetDisplay) {
        offsetDisplay.innerText = (audioOffset > 0 ? "+" : "") + audioOffset.toFixed(3) + "s";
    }
}

function togglePauseGame() {
    if (!gameActive && !isPaused) return; 
    const audio = document.getElementById("game-audio");
    const pauseOverlay = document.getElementById("pause-overlay");

    if (!isPaused) {
        isPaused = true;
        gameActive = false; 
        if (audio) audio.pause();
        pauseStartTime = performance.now();
        cancelAnimationFrame(animationId);
        if (pauseOverlay) pauseOverlay.style.display = "flex";
        document.getElementById("game-judge").innerText = "PAUSED";
    } else {
        isPaused = false;
        gameActive = true;
        if (pauseOverlay) pauseOverlay.style.display = "none";
        document.getElementById("game-judge").innerText = "";

        if (audio) {
            audio.play().then(() => {
                let pausedDuration = performance.now() - pauseStartTime;
                lastTimeSync += pausedDuration; 
                gameLoop();
            }).catch(e => {
                let pausedDuration = performance.now() - pauseStartTime;
                lastTimeSync += pausedDuration;
                gameLoop();
            });
        }
    }
}

function openNoticeModal() {
    const container = document.getElementById("notice-list-container");
    if (container) {
        container.innerHTML = ""; 
        horizonNotices.forEach(notice => {
            container.innerHTML += `
                <div style="background: rgba(138, 43, 226, 0.08); border: 1px solid rgba(0, 255, 255, 0.2); border-radius: 8px; padding: 12px; margin-bottom: 12px; box-sizing: border-box;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <span style="color: #ffffff; font-weight: bold; font-size: 0.95rem;">${notice.title}</span>
                        <span style="color: #8a2be2; font-size: 0.78rem; font-family: monospace;">${notice.date}</span>
                    </div>
                    <p style="margin: 0; font-size: 0.85rem; color: #b0b0d8; line-height: 1.5; text-align: left; white-space: pre-wrap;">${notice.content}</p>
                </div>
            `;
        });
    }
    const noticeModal = document.getElementById("notice-modal");
    if (noticeModal) noticeModal.style.display = "flex";
}

function closeNoticeModal() {
    const noticeModal = document.getElementById("notice-modal");
    if (noticeModal) noticeModal.style.display = "none";
}

// 🔒 안전 진입 프로토콜 (DOM 로딩 안전 가드 레이어)
document.addEventListener("DOMContentLoaded", () => {
    canvas = document.getElementById("gameCanvas");
    if (canvas) ctx = canvas.getContext("2d");
    
    preCacheGradients();

    const volSlider = document.getElementById("volume-slider");
    if (volSlider) {
        volSlider.value = gameVolume;
        volSlider.addEventListener("input", (e) => {
            gameVolume = parseFloat(e.target.value);
            const audio = document.getElementById("game-audio");
            if (audio) audio.volume = gameVolume;
        });
    }

    const confirmBtn = document.getElementById("popup-confirm-btn");
    if (confirmBtn) confirmBtn.onclick = () => closeCustomPopup(true);
    
    const cancelBtn = document.getElementById("popup-cancel-btn");
    if (cancelBtn) cancelBtn.onclick = () => closeCustomPopup(false);

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
});

function toggleAuthMode() {
    isSignUpMode = !isSignUpMode;
    document.getElementById("auth-title").innerText = isSignUpMode ? "새 여행자 가입 (회원가입)" : "우주 진입 (로그인)";
    document.getElementById("auth-toggle").innerText = isSignUpMode ? "이미 계정이 있으신가요? 로그인하기" : "새로운 여행자이신가요? 회원가입하기";
    document.getElementById("btn-primary").innerText = isSignUpMode ? "가입하기" : "진입하기";
    
    const tosContainer = document.getElementById("tos-container");
    if (tosContainer) {
        if (isSignUpMode) {
            tosContainer.classList.remove("hidden");
            tosContainer.style.display = "flex"; 
        } else {
            tosContainer.classList.add("hidden");
            tosContainer.style.display = "none";  
            const tosCheckbox = document.getElementById("tos-checkbox");
            if (tosCheckbox) tosCheckbox.checked = false; 
        }
    }
}

// 🔒 [요청사항 반영] 체크 미동의 시 자체 커스텀 팝업으로 유도 기능 탑재
async function handleAuth() {
    const rawId = document.getElementById("auth-id").value.trim();
    const rawPw = document.getElementById("auth-pw").value.trim();

    if(!rawId || !rawPw) return showCustomAlert("경고", "모든 항목을 입력해 주세요.");

    if (isSignUpMode) {
        const tosCheckbox = document.getElementById("tos-checkbox");
        if (tosCheckbox && !tosCheckbox.checked) {
            // 자체 설계 알림창 시스템을 연동하여 이용약관 확인창을 띄우고 바로 모달을 열어줌
            return showCustomAlert("약관 동의 필요", "회원가입을 진행하려면 이용약관을 확인하고 동의해 주세요.", false, () => {
                openTosModal(); 
            });
        }
    }

    if (isSignUpMode && rawPw.length < 6) {
        return showCustomAlert("경고", "비밀번호는 최소 6자리 이상 설정해야 은하 진입이 가능합니다.");
    }

    isAuthActionLock = true; 

    const inputIdHash = await secureHash(rawId);
    const inputPwHash = await secureHash(rawPw);

    if (inputIdHash === ADMIN_ID_HASH && inputPwHash === ADMIN_PW_HASH) {
        isAdmin = true;
        currentUser = { uid: "admin_asi", displayName: "아시" };
        document.getElementById("btn-admin").classList.remove("hidden");
        isAuthActionLock = false;
        showLobby(rawId);
        return;
    }

    const secureEmail = `${(await secureHash(rawId.toLowerCase())).slice(0, 32)}@horizon.com`;
    
    try {
        if (isSignUpMode) {
            const userCredential = await auth.createUserWithEmailAndPassword(secureEmail, rawPw);
            await userCredential.user.updateProfile({ displayName: rawId });
            await userCredential.user.reload(); 
            currentUser = auth.currentUser; 

            await db.collection("horizon_users").doc(currentUser.uid).set({
                username: rawId,
                joinedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            isAuthActionLock = false; 
            showCustomAlert("성공", "수평선 너머 은하에 가입되었습니다.", false, () => {
                showLobby(rawId);
            });
        } else {
            const userCredential = await auth.signInWithEmailAndPassword(secureEmail, rawPw);
            currentUser = userCredential.user;
            
            await db.collection("horizon_users").doc(currentUser.uid).set({
                username: currentUser.displayName || rawId,
                lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            isAuthActionLock = false; 
            showLobby(rawId);
        }
    } catch (error) {
        isAuthActionLock = false; 
        showCustomAlert("오류", "계정 식별에 실패했습니다: " + error.message);
    }
}

auth.onAuthStateChanged((user) => {
    if (isAdmin) return; 
    if (isAuthActionLock) return; 
    if (user) {
        currentUser = user;
        showLobby();
    }
});

function handleLogout() {
    if (rankingUnsubscribe) { rankingUnsubscribe(); rankingUnsubscribe = null; }
    if (adminRankUnsubscribe) { adminRankUnsubscribe(); adminRankUnsubscribe = null; }
    if (adminUserUnsubscribe) { adminUserUnsubscribe(); adminUserUnsubscribe = null; }
    
    auth.signOut();
    isAdmin = false;
    currentUser = null;
    document.getElementById("btn-admin").classList.add("hidden");
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.getElementById("auth-screen").classList.add("active");
}

function showLobby(fallbackName = "") {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.getElementById("lobby-screen").classList.add("active");
    
    const finalRenderName = currentUser ? (currentUser.displayName || fallbackName || "여행자") : (fallbackName || "여행자");
    document.getElementById("user-welcome").innerText = `반갑습니다, ${finalRenderName} 여행자님!`;
    
    startRealtimeRankings();
}

function startRealtimeRankings() {
    if (rankingUnsubscribe) rankingUnsubscribe();
    const tbody = document.getElementById("ranking-tbody");
    
    rankingUnsubscribe = db.collection("horizon_rankings")
        .orderBy("score", "desc")
        .limit(20)
        .onSnapshot((snapshot) => {
            tbody.innerHTML = "";
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
        }, (error) => {
            console.error(error);
        });
}

// 오타 정밀 교정 파트 (c.classList)
function switchAdminTab(type) {
    document.querySelectorAll(".admin-tab-content").forEach(c => c.classList.remove("active"));
    if(type === 'rank') document.getElementById("admin-rank-section").classList.add("active");
    if(type === 'user') document.getElementById("admin-user-section").classList.add("active");
}

async function openAdminPanel() {
    if(!isAdmin) return;
    document.getElementById("admin-modal").style.display = "flex";
    
    const rankTbody = document.getElementById("admin-ranking-tbody");
    const userTbody = document.getElementById("admin-user-tbody");

    if (adminRankUnsubscribe) adminRankUnsubscribe();
    if (adminUserUnsubscribe) adminUserUnsubscribe();

    adminRankUnsubscribe = db.collection("horizon_rankings").orderBy("timestamp", "desc").limit(30)
        .onSnapshot(snapshot => {
            rankTbody.innerHTML = "";
            snapshot.forEach(doc => {
                const d = doc.data();
                rankTbody.innerHTML += `<tr><td>${d.username}</td><td>${d.score}</td><td>${d.difficulty}</td>
                <td><button onclick="requestDeleteRank('${doc.id}')" style="background:#cc0000; padding:4px;">삭제</button></td></tr>`;
            });
        }, e => console.error(e));

    adminUserUnsubscribe = db.collection("horizon_users").limit(30)
        .onSnapshot(snapshot => {
            userTbody.innerHTML = "";
            snapshot.forEach(doc => {
                const u = doc.data();
                userTbody.innerHTML += `<tr><td>${u.username || '여행자'}</td><td>활동 중</td>
                <td><button onclick="requestBanUser('${doc.id}')" style="background:#cc0000; padding:4px;">추방</button></td></tr>`;
            });
        }, e => console.error(e));
}

function closeAdminPanel() { 
    document.getElementById("admin-modal").style.display = "none"; 
    if (adminRankUnsubscribe) { adminRankUnsubscribe(); adminRankUnsubscribe = null; }
    if (adminUserUnsubscribe) { adminUserUnsubscribe(); adminUserUnsubscribe = null; }
}

function requestDeleteRank(id) {
    showCustomAlert("확인", "해당 기록을 기록실에서 파기하시겠습니까?", true, async () => {
        await db.collection("horizon_rankings").doc(id).delete();
    });
}

function requestBanUser(id) {
    showCustomAlert(
        "여행자 자격 영구 박탈", 
        "해당 유저를 추방하고, 이 유저가 등록한 모든 글로벌 랭킹 기록을 서버에서 영구 파기하시겠습니까?", 
        true, 
        async () => {
            try {
                const userDoc = await db.collection("horizon_users").doc(id).get();
                if (userDoc.exists) {
                    const targetUsername = userDoc.data().username;
                    const rankingSnap = await db.collection("horizon_rankings").where("username", "==", targetUsername).get();
                    
                    const batch = db.batch();
                    rankingSnap.forEach(doc => {
                        batch.delete(doc.ref);
                    });
                    await batch.commit(); 
                }
                await db.collection("horizon_users").doc(id).delete();
            } catch(e) {
                console.error("추방 실패: ", e);
            }
        }
    );
}

function fitCanvasSize() {
    if (!canvas) return;
    canvas.width = 420;
    canvas.height = 560;
    targetY = canvas.height * 0.85;
    preCacheGradients(); 
}
window.addEventListener('resize', fitCanvasSize);

// SHA-256 암호화
async function secureHash(string) {
    if (window.crypto && crypto.subtle && crypto.subtle.digest) {
        try {
            const utf8 = new TextEncoder().encode(string);
            const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (e) {}
    }
    const rotateRight = (n, x) => (n >>> x) | (n << (32 - x));
    const K = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];
    let H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const words = [];
    const ascii = unescape(encodeURIComponent(string));
    for (let i = 0; i < ascii.length; i++) words[i >> 2] |= ascii.charCodeAt(i) << (24 - (i % 4) * 8);
    const bits = ascii.length * 8;
    words[ascii.length >> 2] |= 0x80 << (24 - (ascii.length % 4) * 8);
    while ((words.length * 32) % 512 !== 448) words.push(0);
    words.push(Math.floor(bits / 4294967296)); words.push(bits & 0xffffffff);
    
    for (let i = 0; i < words.length; i += 16) {
        let a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
        const stage = new Array(64);
        for (let j = 0; j < 64; j++) {
            if (j < 16) stage[j] = words[i + j];
            else {
                const s0 = rotateRight(stage[j - 15], 7) ^ rotateRight(stage[j - 15], 18) ^ (stage[j - 15] >>> 3);
                const s1 = rotateRight(stage[j - 2], 17) ^ rotateRight(stage[j - 2], 19) ^ (stage[j - 2] >>> 10);
                stage[j] = (stage[j - 16] + s0 + stage[j - 7] + s1) & 0xffffffff;
            }
            const ch = (e & f) ^ (~e & g);
            const maj = (a & b) ^ (a & c) ^ (b & c);
            const S0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
            const S1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
            const t1 = (h + S1 + ch + K[j] + stage[j]) & 0xffffffff;
            const t2 = (S0 + maj) & 0xffffffff;
            h = g; g = f; f = e; e = (d + t1) & 0xffffffff; d = c; c = b; b = a; a = (t1 + t2) & 0xffffffff;
        }
        H[0] = (H[0] + a) & 0xffffffff; H[1] = (H[1] + b) & 0xffffffff; H[2] = (H[2] + c) & 0xffffffff; H[3] = (H[3] + d) & 0xffffffff;
        H[4] = (H[4] + e) & 0xffffffff; H[5] = (H[5] + f) & 0xffffffff; H[6] = (H[6] + g) & 0xffffffff; H[7] = (H[7] + h) & 0xffffffff;
    }
    return H.map(h => (h >>> 0).toString(16).padStart(8, '0')).join('');
}

function startGame(diff) {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    selectedDifficulty = diff;
    fitCanvasSize();
    
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.getElementById("game-screen").classList.add("active");
    
    score = 0; combo = 0; maxCombo = 0;
    perfectCount = 0; greatCount = 0; goodCount = 0; missCount = 0;

    hitParticles = [];
    hitRings = []; 
    activeNotes = []; 
    isPaused = false; 
    lanePressed = [false, false, false, false];
    chartData = JSON.parse(rmChartSafely(charts[selectedDifficulty] || []));

    const audio = document.getElementById("game-audio");
    if (audio) audio.volume = gameVolume;

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

function rmChartSafely(obj) { return JSON.stringify(obj); }

function closeTutorialAndStart() {
    document.getElementById("tutorial-overlay").style.display = "none";
    localStorage.setItem("horizon_tutorial_seen", "true");
    triggerAudioAndLoop();
}

function triggerAudioAndLoop() {
    if (animationId) cancelAnimationFrame(animationId);
    gameActive = true;
    isPaused = false;
    const audio = document.getElementById("game-audio");
    if(audio) audio.currentTime = 0;
    if(audio) audio.volume = gameVolume;
    
    if(audio) {
        audio.play().then(() => {
            lastAudioTime = audio.currentTime;
            lastTimeSync = performance.now();
            currentAudioTime = audio.currentTime;
            gameLoop();
        }).catch((err) => { 
            console.warn(err); 
            lastAudioTime = 0;
            lastTimeSync = performance.now();
            currentAudioTime = 0;
            gameLoop();
        });
    } else {
        lastTimeSync = performance.now();
        gameLoop();
    }
}

function exitGameMidway() {
    showCustomAlert("중도 하차", "진행 중인 모든 기록을 초기화하고 은하 대기실로 귀환하시겠습니까?", true, () => {
        gameActive = false;
        isPaused = false;
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        chartData = [];  
        activeNotes = []; 
        
        const audio = document.getElementById("game-audio");
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }
        const pauseOverlay = document.getElementById("pause-overlay");
        if (pauseOverlay) pauseOverlay.style.display = "none";
        
        showLobby();
    });
}

function gameLoop() {
    if (!gameActive && !isPaused) return;
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const audio = document.getElementById("game-audio");
    
    if (audio && audio.currentTime !== lastAudioTime) {
        lastAudioTime = audio.currentTime;
        lastTimeSync = performance.now();
        currentAudioTime = lastAudioTime;
    } else {
        if (audio && !audio.paused && gameActive && !isPaused) {
            let elapsed = (performance.now() - lastTimeSync) / 1000;
            if (elapsed > 0.15) elapsed = 0.15; 
            currentAudioTime = lastAudioTime + elapsed;
        } else if (!audio) {
            currentAudioTime = (performance.now() - lastTimeSync) / 1000;
        }
    }

    let syncTime = currentAudioTime + audioOffset;
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

    while (chartData.length > 0 && chartData[0].time <= syncTime + lookAheadTime) {
        const next = chartData.shift();
        activeNotes.push({ targetTime: next.time, lane: next.lane, x: lanes[next.lane] });
    }

    for (let i = activeNotes.length - 1; i >= 0; i--) {
        let n = activeNotes[i];
        n.y = targetY - (n.targetTime - syncTime) * currentSpeedFactor;

        ctx.fillStyle = cachedNoteGradients[n.lane] || "#ff00ff";
        ctx.fillRect(n.x - 44, n.y - 9, 88, 18);

        if (syncTime > n.targetTime + 0.15) {
            activeNotes.splice(i, 1);
            missCount++; 
            updateJudgement("MISS");
        }
    }

    for (let r = hitRings.length - 1; r >= 0; r--) {
        let ring = hitRings[r];
        ring.radius += 2.5;
        ring.alpha -= 0.05;
        if (ring.alpha <= 0 || ring.radius >= ring.maxRadius) {
            hitRings.splice(r, 1);
            continue;
        }
        ctx.strokeStyle = ring.color;
        ctx.globalAlpha = ring.alpha;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1.0; 
    }

    for (let p = hitParticles.length - 1; p >= 0; p--) {
        let pt = hitParticles[p];
        pt.x += pt.vx; pt.y += pt.vy; pt.alpha -= 0.04;
        if(pt.alpha <= 0) { hitParticles.splice(p, 1); continue; }
        ctx.fillStyle = (pt.color || `rgba(0, 255, 255, `) + pt.alpha + ")";
        ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2); ctx.fill();
    }

    if (audio && audio.ended) {
        finishGame();
        return;
    }
    if (!isPaused) {
        animationId = requestAnimationFrame(gameLoop);
    }
}

function createSparks(startX, startY, judgment) {
    let count = 15;
    let colorPrefix = "rgba(0, 255, 255, "; 
    let sizeMax = 3;
    let ringColor = "#00ffff";

    if (judgment === "PERFECT") {
        count = 26;
        colorPrefix = "rgba(255, 215, 0, "; 
        sizeMax = 4.2;
        ringColor = "#ffd700";
    } else if (judgment === "GREAT") {
        count = 18;
        colorPrefix = "rgba(255, 0, 255, ";  
        sizeMax = 3.5;
        ringColor = "#ff00ff";
    } else if (judgment === "GOOD") {
        count = 10;
        colorPrefix = "rgba(0, 220, 255, ";  
        sizeMax = 2.5;
        ringColor = "#00dcff";
    }

    for(let i=0; i<count; i++) {
        hitParticles.push({
            x: startX, y: startY,
            vx: (Math.random() - 0.5) * 9,
            vy: (Math.random() - 0.7) * 9,
            size: Math.random() * sizeMax + 1, 
            alpha: 1.0,
            color: colorPrefix
        });
    }

    hitRings.push({
        x: startX, y: startY,
        radius: 4, maxRadius: 45, alpha: 1.0, color: ringColor
    });
}

function verifyHit(lane) {
    if(!gameActive || isPaused) return;
    let syncTime = currentAudioTime + audioOffset;
    
    for(let i=0; i<activeNotes.length; i++) {
        let n = activeNotes[i];
        if(n.lane === lane) {
            let timeDiff = Math.abs(n.targetTime - syncTime);
            
            if(timeDiff < 0.15) { 
                let judgeStr = "GOOD";
                if(timeDiff < 0.05) { 
                    judgeStr = "PERFECT"; score += 1000; perfectCount++; 
                } else if(timeDiff < 0.10) { 
                    judgeStr = "GREAT"; score += 500; greatCount++;
                } else { 
                    score += 200; goodCount++;
                }
                updateJudgement(judgeStr);
                createSparks(n.x, targetY, judgeStr); 
                activeNotes.splice(i, 1); 
                break;
            }
            break; 
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
    isPaused = false;
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    const audio = document.getElementById("game-audio");
    if (audio) {
        audio.pause();
        audio.currentTime = 0;
    }
    
    let englishLiveTitle = "LIVE CLEAR";
    if (goodCount === 0 && missCount === 0) {
        if (greatCount === 0 && perfectCount > 0) englishLiveTitle = "PERFECT LIVE";
        else englishLiveTitle = "FULL COMBO";
    }

    if (currentUser && currentUser.uid !== "admin_asi" && !isAdmin) {
        try {
            await db.collection("horizon_rankings").add({
                username: currentUser.displayName || "여행자",
                score: score,
                maxCombo: maxCombo,
                perfectCount: perfectCount,
                difficulty: selectedDifficulty,
                platform: currentPlatform,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch(e) { console.error(e); }
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
    
    if (e.key === "[") { adjustNoteSpeed(-0.5); return; }
    if (e.key === "]") { adjustNoteSpeed(0.5); return; }
    if (e.key === "ArrowLeft") { adjustAudioOffset(-0.01); return; }
    if (e.key === "ArrowRight") { adjustAudioOffset(0.01); return; }
    if (k === "p") { togglePauseGame(); return; }
    
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
