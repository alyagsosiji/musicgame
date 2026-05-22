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

// 음악 동기화 타이머 변수
let audioStartTime = 0; 
let cachedNoteGradients = []; 

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
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

// [오류 전면 수정] 소수점 오차 없는 정밀 타임스탬프 섹션별 고밀도 채보 생성기
(function generatePerfectCharts() {
    // --- 1. HARD 난이도 제작 (약 320노트) ---
    // Intro 구간 (1초 ~ 16초) - 0.8초 간격 싱글노트
    for (let t = 1.0; t < 16.0; t += 0.8) {
        charts.hard.push({ time: parseFloat(t.toFixed(2)), lane: Math.floor(t * 3) % 4 });
    }
    // Verse 구간 (16초 ~ 40초) - 0.4초 간격 정박 스크롤 + 1.6초마다 복합 동시타
    for (let t = 16.0; t < 40.0; t += 0.4) {
        let lane = Math.floor(t * 7) % 4;
        charts.hard.push({ time: parseFloat(t.toFixed(2)), lane: lane });
        if (parseFloat((t % 1.6).toFixed(1)) === 0) {
            charts.hard.push({ time: parseFloat(t.toFixed(2)), lane: (lane + 2) % 4 });
        }
    }
    // Build-up 구간 (40초 ~ 52초) - 비트 가속 계단형 배치 (0.2초 간격)
    for (let t = 40.0; t < 52.0; t += 0.2) {
        charts.hard.push({ time: parseFloat(t.toFixed(2)), lane: Math.floor(t * 11) % 4 });
    }
    // Main Drop 클라이맥스 (52초 ~ 84초) - 난타 폭타 스트림 (0.2초 간격) + 0.8초마다 쌍노트
    for (let t = 52.0; t < 84.0; t += 0.2) {
        let lane = Math.floor(t * 13) % 4;
        charts.hard.push({ time: parseFloat(t.toFixed(2)), lane: lane });
        if (parseFloat((t % 0.8).toFixed(1)) === 0) {
            charts.hard.push({ time: parseFloat(t.toFixed(2)), lane: (lane + 2) % 4 });
        }
    }
    // Outro 구간 (84초 ~ 100초) - 여운을 주는 싱글 배치 (0.6초 간격)
    for (let t = 84.0; t < 100.0; t += 0.6) {
        charts.hard.push({ time: parseFloat(t.toFixed(2)), lane: Math.floor(t * 5) % 4 });
    }

    // --- 2. MASTER 난이도 제작 (약 540노트 밀도) ---
    // Intro 구간 (1초 ~ 16초) - 정밀 0.4초 간격 연타 배치
    for (let t = 1.0; t < 16.0; t += 0.4) {
        charts.master.push({ time: parseFloat(t.toFixed(2)), lane: Math.floor(t * 5) % 4 });
    }
    // Verse 구간 (16초 ~ 40초) - 0.2초 촘촘한 비트 + 0.8초마다 양손 타격
    for (let t = 16.0; t < 40.0; t += 0.2) {
        let lane = Math.floor(t * 13) % 4;
        charts.master.push({ time: parseFloat(t.toFixed(2)), lane: lane });
        if (parseFloat((t % 0.8).toFixed(1)) === 0) {
            charts.master.push({ time: parseFloat(t.toFixed(2)), lane: (lane + 2) % 4 });
        }
    }
    // Build-up 구간 (40초 ~ 52초) - 초고속 16비트 양손 트릴 연타 (0.1초 간격)
    for (let t = 40.0; t < 52.0; t += 0.1) {
        charts.master.push({ time: parseFloat(t.toFixed(2)), lane: Math.floor(t * 23) % 4 });
    }
    // Main Drop 최상위 드롭 구간 (52초 ~ 84초) - 0.1초 미친 폭타 + 0.4초 간격 3라인 초정밀 동시타 융단폭격
    for (let t = 52.0; t < 84.0; t += 0.1) {
        let lane = Math.floor(t * 29) % 4;
        charts.master.push({ time: parseFloat(t.toFixed(2)), lane: lane });
        if (parseFloat((t % 0.4).toFixed(1)) === 0) {
            charts.master.push({ time: parseFloat(t.toFixed(2)), lane: (lane + 1) % 4 });
            charts.master.push({ time: parseFloat(t.toFixed(2)), lane: (lane + 2) % 4 });
        }
    }
    // Outro 구간 (84초 ~ 100초) - 마무리 변속 연주 (0.3초 간격)
    for (let t = 84.0; t < 100.0; t += 0.3) {
        charts.master.push({ time: parseFloat(t.toFixed(2)), lane: Math.floor(t * 7) % 4 });
    }

    // 전 채보 데이터 정렬 매칭 안전선 확보
    charts.hard.sort((a, b) => a.time - b.time);
    charts.master.sort((a, b) => a.time - b.time);
})();

// 그라데이션 캐싱 (끊김 현상 방지)
function preCacheGradients() {
    cachedNoteGradients = lanes.map(x => {
        let g = ctx.createLinearGradient(x - 40, 0, x + 40, 0);
        g.addColorStop(0, "#ff00ff");
        g.addColorStop(1, "#00ffff");
        return g;
    });
}

// 배속 조절 기능 엔진 함수
function adjustNoteSpeed(amount) {
    let nextSpeed = noteSpeedMultiplier + amount;
    if (nextSpeed >= 1.0 && nextSpeed <= 9.5) {
        noteSpeedMultiplier = nextSpeed;
        const speedDisplay = document.getElementById("speed-display-value");
        if (speedDisplay) {
            speedDisplay.innerText = noteSpeedMultiplier.toFixed(1);
        }
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

function toggleAuthMode() {
    isSignUpMode = !isSignUpMode;
    document.getElementById("auth-title").innerText = isSignUpMode ? "새 여행자 가입 (회원가입)" : "우주 진입 (로그인)";
    document.getElementById("auth-toggle").innerText = isSignUpMode ? "이미 계정이 있으신가요? 로그인하기" : "새로운 여행자이신가요? 회원가입하기";
    document.getElementById("btn-primary").innerText = isSignUpMode ? "가입하기" : "진입하기";
}

async function handleAuth() {
    const rawId = document.getElementById("auth-id").value.trim();
    const rawPw = document.getElementById("auth-pw").value.trim();

    if(!rawId || !rawPw) return showCustomAlert("경고", "모든 항목을 입력해 주세요.");
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
    canvas.width = 420;
    canvas.height = 560;
    targetY = canvas.height * 0.85;
    preCacheGradients(); 
}
window.addEventListener('resize', fitCanvasSize);

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
    activeNotes = []; 
    lanePressed = [false, false, false, false];
    chartData = JSON.parse(rmChartSafely(charts[selectedDifficulty] || []));

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
    const audio = document.getElementById("game-audio");
    audio.currentTime = 0;
    
    audio.play().then(() => {
        audioStartTime = performance.now(); 
        gameLoop();
    }).catch((err) => { 
        console.warn(err); 
        audioStartTime = performance.now();
        gameLoop();
    });
}

function exitGameMidway() {
    showCustomAlert("중도 하차", "진행 중인 모든 기록을 초기화하고 은하 대기실로 귀환하시겠습니까?", true, () => {
        gameActive = false;
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        chartData = [];  
        activeNotes = []; 
        
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
    let currentAudioTime = (performance.now() - audioStartTime) / 1000;
    
    if (Math.abs(currentAudioTime - audio.currentTime) > 0.15) {
        audioStartTime = performance.now() - (audio.currentTime * 1000);
        currentAudioTime = audio.currentTime;
    }

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

        ctx.fillStyle = cachedNoteGradients[n.lane] || "#ff00ff";
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

    if (audio.ended) {
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

// 라인별 최하단 단일 노트 단독 타겟 판정 엔진
function verifyHit(lane) {
    if(!gameActive) return;
    const currentAudioTime = (performance.now() - audioStartTime) / 1000;
    
    for(let i=0; i<activeNotes.length; i++) {
        let n = activeNotes[i];
        if(n.lane === lane) {
            let timeDiff = Math.abs(n.targetTime - currentAudioTime);
            
            if(timeDiff < 0.15) { 
                if(timeDiff < 0.05) { 
                    updateJudgement("PERFECT"); score += 1000; perfectCount++; 
                } else if(timeDiff < 0.10) { 
                    updateJudgement("GREAT"); score += 500; greatCount++;
                } else { 
                    updateJudgement("GOOD"); score += 200; goodCount++;
                }
                createSparks(n.x, targetY); 
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
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    const audio = document.getElementById("game-audio");
    audio.pause();
    audio.currentTime = 0;
    
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
    
    // [단축키 시스템] 대기실 및 플레이 도중 키보드로 배속을 바꿀 수 있는 핫키 대입
    if (e.key === "[") { adjustNoteSpeed(-0.5); return; }
    if (e.key === "]") { adjustNoteSpeed(0.5); return; }
    
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
