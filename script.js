/* 전체 불법 드래그 및 선택 차단 */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    -webkit-tap-highlight-color: transparent; 
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
}

body {
    width: 100vw;
    height: 100dvh; 
    overflow: hidden;
    /* 디폴트 몽환적 배경 그라데이션 애니메이션 */
    background: linear-gradient(-45deg, #090d16, #12132c, #250a3a, #0f172a);
    background-size: 400% 400%;
    animation: gradientBG 20s ease infinite;
    font-family: 'Noto Serif KR', serif;
    color: #ffffff;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 1rem;
}

@keyframes gradientBG {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
}

/* ── ⚡ 최적화 모드(eco-mode) 활성화 시 적용될 정적 스타일 ── */
body.eco-mode {
    background: #111326; /* 애니메이션을 완전히 끄고 분위기 있는 단색 정적 배경으로 변경 */
    animation: none !important;
}
body.eco-mode #stars-container {
    display: none !important; /* 모바일 연산 장치를 과도하게 쓰는 별빛 입자 그래픽 전면 제거 */
}

#stars-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 1;
}

.star {
    position: absolute;
    background: white;
    border-radius: 50%;
    opacity: 0;
    animation: floatUp linear infinite;
}

@keyframes floatUp {
    0% { transform: translateY(105dvh) scale(0); opacity: 0; }
    10% { opacity: 0.7; }
    90% { opacity: 0.7; }
    100% { transform: translateY(-5dvh) scale(1.2); opacity: 0; }
}

/* 메인 컨테이너 */
.main-container {
    position: relative;
    z-index: 2;
    text-align: center;
    padding: clamp(2.2rem, 6vh, 4rem) clamp(1rem, 5vw, 3rem);
    background: rgba(255, 255, 255, 0.02);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-radius: 24px;
    border: 1px solid rgba(255, 255, 255, 0.06);
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
    width: 100%;
    max-width: 630px;
}

/* ⚡ 최적화 버튼 스타일 */
.eco-btn {
    position: absolute;
    top: 15px;
    right: 20px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 6px 12px;
    border-radius: 20px;
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.7rem;
    font-family: sans-serif;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
    transition: all 0.3s;
}
.eco-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
}
body.eco-mode .eco-btn {
    border-color: rgba(34, 211, 238, 0.4);
    color: #22d3ee;
    background: rgba(34, 211, 238, 0.05);
}

/* 🛠️ 글자 위치 및 이모지 자동 줄바꿈 문제 해결 */
.title {
    font-family: 'Cinzel', 'Noto Serif KR', serif;
    font-size: clamp(1.35rem, 4.6vw, 2.1rem);
    font-weight: 500;
    letter-spacing: 1px;
    margin-bottom: 0.6rem;
    line-height: 1.4;
    padding: 0 5px;
    /* keep-all: 글자가 한 글자씩 외롭게 떨어지지 않고, 단어 단위로 붙어서 예쁘게 내려가도록 제어 */
    word-break: keep-all; 
    background: linear-gradient(to right, #ffffff, #e0e7ff, #e8d5ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.subtitle {
    font-size: clamp(0.68rem, 2.2vw, 0.85rem);
    font-weight: 300;
    letter-spacing: 1px;
    color: #94a3b8;
    margin-bottom: clamp(1.5rem, 4vh, 2.5rem);
    opacity: 0.6;
}

/* 플레이어 */
.player-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: clamp(2rem, 5vh, 3.2rem);
}

.cd-capsule {
    width: 110px;
    height: 80px;
    background: rgba(5, 11, 22, 0.6);
    border: 1px solid rgba(34, 211, 238, 0.15);
    border-radius: 50px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
}

.cd-capsule:hover, .cd-capsule.playing {
    transform: scale(1.04);
    border-color: rgba(192, 132, 252, 0.4);
    box-shadow: 0 0 25px rgba(168, 85, 247, 0.25);
}

.cd-disk {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: linear-gradient(135deg, #c7d2fe 0%, #c084fc 35%, #818cf8 65%, #a5f3fc 100%);
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: inset 0 0 8px rgba(255, 255, 255, 0.6), 0 0 10px rgba(129, 140, 248, 0.3);
    animation: rotateDisk 5s linear infinite;
    animation-play-state: paused;
}

.cd-capsule.playing .cd-disk {
    animation-play-state: running;
}

.cd-inner-ring {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 1.5px solid rgba(15, 23, 42, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
}

.cd-center-hole {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #090d16;
    border: 1px solid rgba(255, 255, 255, 0.15);
}

@keyframes rotateDisk {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.player-tip {
    font-size: 0.65rem;
    font-family: 'Cinzel', serif;
    letter-spacing: 2px;
    color: #64748b;
    margin-top: 0.7rem;
    transition: color 0.3s;
}
.cd-capsule.playing + .player-tip {
    color: #a78bfa;
}

/* 카운트다운 타이머 벨런스 */
.countdown-wrapper {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: clamp(0.15rem, 1vw, 1rem);
    margin-bottom: clamp(1.8rem, 4vh, 2.5rem);
    width: 100%;
}

.time-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    min-width: 0;
}

.time-num {
    font-family: 'Cinzel', serif;
    font-size: clamp(1.45rem, 6.2vw, 3.4rem);
    font-weight: 700;
    line-height: 1;
    background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 50%, #f472b6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 0 15px rgba(216, 180, 254, 0.2));
}

.ms-box .time-num {
    font-size: clamp(1.45rem, 6.2vw, 3.4rem);
    color: #f472b6;
}

.time-label {
    font-size: clamp(0.52rem, 1.6vw, 0.68rem);
    letter-spacing: 1px;
    color: #475569;
    margin-top: 0.5rem;
    font-weight: 500;
}

.heart-icon {
    font-size: clamp(1.2rem, 3.5vw, 1.5rem);
    color: #f472b6;
    animation: heartbeat 2s infinite ease-in-out;
    filter: drop-shadow(0 0 10px rgba(244, 114, 182, 0.5));
    display: inline-block;
}

@keyframes heartbeat {
    0%, 100% { transform: scale(1); opacity: 0.4; }
    50% { transform: scale(1.18); opacity: 0.9; }
}

@media (max-width: 380px) {
    .main-container { padding: 1.5rem 0.6rem; }
    .eco-btn { top: 10px; right: 10px; padding: 4px 8px; font-size: 0.6rem; }
    .title { margin-top: 1rem; }
}
