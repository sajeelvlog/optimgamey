let audioCtx = null;

function playSound(type) {
    if (!audioCtx) {
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch(e) { return; }
    }
    if (!audioCtx || audioCtx.state === 'suspended') return;
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;

    if (type === 'correct') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); 
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); 
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
    } else if (type === 'wrong') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(120, now + 0.2);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    } else if (type === 'victory') {
        const notes = [523.25, 659.25, 783.99, 1046.50]; 
        notes.forEach((freq, index) => {
            const noteOsc = audioCtx.createOscillator();
            const noteGain = audioCtx.createGain();
            noteOsc.connect(noteGain);
            noteGain.connect(audioCtx.destination);
            noteOsc.type = 'triangle';
            noteOsc.frequency.setValueAtTime(freq, now + (index * 0.1));
            noteGain.gain.setValueAtTime(0.12, now + (index * 0.1));
            noteGain.gain.exponentialRampToValueAtTime(0.01, now + (index * 0.1) + 0.4);
            noteOsc.start(now + (index * 0.1));
            noteOsc.stop(now + (index * 0.1) + 0.4);
        });
    }
}

// Simplified & Easy World Cup 2026 Question Pool (15 Questions)
const questionPool = [
    { cat: "FOOTBALL BASICS", q: "How many players from one team are on the pitch during a match?", a: "11", opts: ["9", "10", "11", "12"] },
    { cat: "WORLD CUP HOSTS", q: "Which of these countries is one of the co-hosts for World Cup 2026?", a: "United States", opts: ["United States", "Brazil", "Germany", "Japan"] },
    { cat: "WORLD CUP BASICS", q: "How often is the FIFA World Cup tournament held?", a: "Every 4 years", opts: ["Every year", "Every 2 years", "Every 4 years", "Every 5 years"] },
    { cat: "ARGENTINA LEGEND", q: "Which famous number 10 led Argentina to win the 2022 World Cup?", a: "Lionel Messi", opts: ["Cristiano Ronaldo", "Lionel Messi", "Neymar Jr", "Kylian Mbappé"] },
    { cat: "SPAIN COLORS", q: "What is the main jersey color of the Spain national team?", a: "Red", opts: ["Blue", "Yellow", "Red", "Green"] },
    { cat: "ARGENTINA COLORS", q: "What colors are featured on Argentina's iconic home jersey?", a: "Sky Blue & White", opts: ["Red & Yellow", "Sky Blue & White", "Black & Gold", "Green & White"] },
    { cat: "WORLD CUP GOAL", q: "What body part are outfield players NOT allowed to use to touch the ball?", a: "Hands & Arms", opts: ["Head", "Chest", "Feet", "Hands & Arms"] },
    { cat: "SPAIN WONDERKID", q: "Which teenage star wears shirt #19 for Spain?", a: "Lamine Yamal", opts: ["Lamine Yamal", "Pedri", "Gavi", "Rodri"] },
    { cat: "WORLD CUP TROPHY", q: "What precious metal is the official FIFA World Cup Trophy made of?", a: "Gold", opts: ["Silver", "Gold", "Bronze", "Platinum"] },
    { cat: "GOALKEEPER ROLE", q: "Which player on the field is allowed to use their hands inside their penalty area?", a: "Goalkeeper", opts: ["Defender", "Midfielder", "Goalkeeper", "Striker"] },
    { cat: "MATCH DURATION", q: "How long is a standard football match without extra time?", a: "90 minutes", opts: ["60 minutes", "80 minutes", "90 minutes", "100 minutes"] },
    { cat: "CARD RULES", q: "What color card does a referee show to immediately expel a player from the game?", a: "Red Card", opts: ["Yellow Card", "Red Card", "Green Card", "Blue Card"] },
    { cat: "DEFENDING CHAMPIONS", q: "Which country won the previous FIFA World Cup held in Qatar in 2022?", a: "Argentina", opts: ["France", "Spain", "Argentina", "Croatia"] },
    { cat: "PENALTY KICK", q: "How many players face each other during a penalty kick shootout attempt?", a: "1 Kicker & 1 Goalkeeper", opts: ["1 Kicker & 1 Goalkeeper", "2 Kickers", "Full Teams", "3 Defenders"] },
    { cat: "TOURNAMENT EXTRA", q: "What restart is given when the ball completely crosses the sideline boundary?", a: "Throw-in", opts: ["Corner Kick", "Throw-in", "Free Kick", "Penalty Kick"] }
];

const TOTAL_QUESTIONS = 15;
const QUESTION_TIME_LIMIT = 30;

let stateNeon = { name: "Spain 🇪🇸", currentIdx: 0, score: 0, totalTimeUsed: 0, deck: [], questionStartTime: 0, finished: false };
let stateCyan = { name: "Argentina 🇦🇷", currentIdx: 0, score: 0, totalTimeUsed: 0, deck: [], questionStartTime: 0, finished: false };

let globalIntervalId = null;

function shuffle(arr) {
    return arr.sort(() => Math.random() - 0.5);
}

function launchGameEngine() {
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch(e) {}

    const nameNeon = document.getElementById("inputNeon").value.trim();
    const nameCyan = document.getElementById("inputCyan").value.trim();

    if (nameNeon) stateNeon.name = nameNeon;
    if (nameCyan) stateCyan.name = nameCyan;

    document.getElementById("titleNeon").textContent = stateNeon.name;
    document.getElementById("titleCyan").textContent = stateCyan.name;

    document.getElementById("setupWindow").style.display = "none";

    stateNeon.deck = shuffle([...questionPool]).slice(0, TOTAL_QUESTIONS);
    stateCyan.deck = shuffle([...questionPool]).slice(0, TOTAL_QUESTIONS);

    stateNeon.questionStartTime = Date.now();
    stateCyan.questionStartTime = Date.now();

    renderQuestion('Neon');
    renderQuestion('Cyan');
    
    globalIntervalId = setInterval(processLiveTimers, 100);
}

function processLiveTimers() {
    const now = Date.now();

    if (!stateNeon.finished) {
        let elapsed = (now - stateNeon.questionStartTime) / 1000;
        let remaining = Math.max(0, QUESTION_TIME_LIMIT - elapsed);
        
        const timerEl = document.getElementById('timerNeon');
        timerEl.textContent = `⏱️ ${remaining.toFixed(1)}s`;
        
        if (remaining <= 5) {
            timerEl.classList.add('timer-warning');
        } else {
            timerEl.classList.remove('timer-warning');
        }

        if (remaining <= 0) {
            handleTimeout('Neon');
        }
    }

    if (!stateCyan.finished) {
        let elapsed = (now - stateCyan.questionStartTime) / 1000;
        let remaining = Math.max(0, QUESTION_TIME_LIMIT - elapsed);
        
        const timerEl = document.getElementById('timerCyan');
        timerEl.textContent = `⏱️ ${remaining.toFixed(1)}s`;
        
        if (remaining <= 5) {
            timerEl.classList.add('timer-warning');
        } else {
            timerEl.classList.remove('timer-warning');
        }

        if (remaining <= 0) {
            handleTimeout('Cyan');
        }
    }
}

function handleTimeout(team) {
    const state = (team === 'Neon') ? stateNeon : stateCyan;
    
    state.score -= 0.5; 
    state.totalTimeUsed += QUESTION_TIME_LIMIT;
    playSound('wrong');

    state.currentIdx++;
    state.questionStartTime = Date.now();
    
    if (state.currentIdx >= TOTAL_QUESTIONS) {
        completeTeamTrack(team);
    } else {
        renderQuestion(team);
    }
}

function renderQuestion(team) {
    const state = (team === 'Neon') ? stateNeon : stateCyan;
    
    document.getElementById(`score${team}`).textContent = `Points: ${state.score.toFixed(1)} | Q: ${state.currentIdx + 1}/${TOTAL_QUESTIONS}`;

    const currentQuestion = state.deck[state.currentIdx];
    
    document.getElementById(`qCat${team}`).textContent = currentQuestion.cat;
    const txtElement = document.getElementById(`qText${team}`);
    const gridElement = document.getElementById(`opts${team}`);
    
    txtElement.textContent = currentQuestion.q;
    gridElement.innerHTML = ""; 

    currentQuestion.opts.forEach(option => {
        const btn = document.createElement("button");
        btn.className = "opt-btn";
        btn.textContent = option;
        
        btn.addEventListener("click", () => {
            if (state.finished) return;

            const timeSpentOnQuestion = (Date.now() - state.questionStartTime) / 1000;
            state.totalTimeUsed += timeSpentOnQuestion;

            if (option === currentQuestion.a) {
                state.score += 1.0;
                playSound('correct');
            } else {
                state.score -= 0.5; 
                playSound('wrong');
            }
            
            state.currentIdx++;
            state.questionStartTime = Date.now();
            
            if (state.currentIdx >= TOTAL_QUESTIONS) {
                completeTeamTrack(team);
            } else {
                renderQuestion(team);
            }
        });

        gridElement.appendChild(btn);
    });
}

function completeTeamTrack(team) {
    const state = (team === 'Neon') ? stateNeon : stateCyan;
    state.finished = true;
    
    document.getElementById(`timer${team}`).textContent = "FINISHED";
    document.getElementById(`timer${team}`).classList.remove('timer-warning');
    document.getElementById(`score${team}`).textContent = `Points: ${state.score.toFixed(1)} | Done`;
    
    document.getElementById(`qCat${team}`).textContent = "MATCH COMPLETE";
    document.getElementById(`qText${team}`).textContent = "Waiting for opponents to cross line...";
    document.getElementById(`opts${team}`).innerHTML = "";

    if (stateNeon.finished && stateCyan.finished) {
        clearInterval(globalIntervalId);
        evaluateWinner();
    }
}

function evaluateWinner() {
    playSound('victory');

    const windowOverlay = document.getElementById("victoryWindow");
    const textBanner = document.getElementById("winnerBanner");
    const emojiBanner = document.getElementById("victoryEmoji");
    const descBanner = document.getElementById("victoryDesc");
    
    let ultimateWinner = "";
    let winReason = "";

    if (stateNeon.score > stateCyan.score) {
        ultimateWinner = "Neon";
        winReason = "Higher overall accuracy score!";
    } else if (stateCyan.score > stateNeon.score) {
        ultimateWinner = "Cyan";
        winReason = "Higher overall accuracy score!";
    } else {
        if (stateNeon.totalTimeUsed < stateCyan.totalTimeUsed) {
            ultimateWinner = "Neon";
            winReason = "Tie broken! Answered World Cup questions faster!";
        } else if (stateCyan.totalTimeUsed < stateNeon.totalTimeUsed) {
            ultimateWinner = "Cyan";
            winReason = "Tie broken! Answered World Cup questions faster!";
        } else {
            ultimateWinner = "Draw";
            winReason = "Perfect timing match!";
        }
    }

    if (ultimateWinner === "Neon") {
        textBanner.textContent = `${stateNeon.name} WINS!`;
        textBanner.style.color = "var(--brand-neon)";
        emojiBanner.textContent = "🏆🇪🇸⚡";
    } else if (ultimateWinner === "Cyan") {
        textBanner.textContent = `${stateCyan.name} WINS!`;
        textBanner.style.color = "var(--brand-cyan)";
        emojiBanner.textContent = "🏆🇦🇷⚡";
    } else {
        textBanner.textContent = "IT'S A DRAW!";
        textBanner.style.color = "#FFFFFF";
        emojiBanner.textContent = "🤝⚽🤝";
    }

    descBanner.innerHTML = `
        <strong>${winReason}</strong><br><br>
        <strong>${stateNeon.name}:</strong> ${stateNeon.score.toFixed(1)} Pts (${stateNeon.totalTimeUsed.toFixed(2)}s)<br>
        <strong>${stateCyan.name}:</strong> ${stateCyan.score.toFixed(1)} Pts (${stateCyan.totalTimeUsed.toFixed(2)}s)
    `;
    windowOverlay.style.display = "flex";
}