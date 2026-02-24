/**
 * UI MODULE - User Interface Controller
 * Version: 2.0.0
 */

const UI = (() => {
    'use strict';

    // DOM Elements cache
    const elements = {};

    // Current state
    let currentTab = 'history';
    let soundEnabled = true;

    /**
     * Initialize UI
     */
    const init = () => {
        cacheElements();
        setupEventListeners();
        updateGameUI(Game.getState());
        updateLeaderboard();
        updateAchievements();
        
        // Observe game changes
        Game.init({
            onUpdate: updateGameUI,
            onTimerTick: updateTimer,
            onGameEnd: handleGameEnd
        });

        // Observe theme changes
        window.addEventListener('themechange', (e) => {
            console.log('Theme changed:', e.detail.theme);
        });
    };

    /**
     * Cache DOM elements for performance
     */
    const cacheElements = () => {
        const ids = [
            'secretDisplay', 'attemptsDisplay', 'remainingDisplay',
            'hintsDisplay', 'timerDisplay', 'guessInput', 'guessBtn',
            'hintBtn', 'messageText', 'messagePanel', 'historyList',
            'leaderboardList', 'achievementsList', 'soundBtn',
            'progressBar', 'timerStat', 'scoreModal', 'playerName'
        ];
        
        ids.forEach(id => {
            elements[id] = document.getElementById(id);
        });
    };

    /**
     * Setup event listeners
     */
    const setupEventListeners = () => {
        // Input validation
        elements.guessInput?.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
        });

        // Enter key
        elements.guessInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') makeGuess();
        });

        // Difficulty buttons
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.difficulty-btn').forEach(b => 
                    b.classList.remove('active'));
                this.classList.add('active');
            });
        });

        // Timer buttons
        document.querySelectorAll('.timer-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.timer-btn').forEach(b => 
                    b.classList.remove('active'));
                this.classList.add('active');
            });
        });
    };

    /**
     * Update game UI
     */
    const updateGameUI = (state) => {
        if (!state) return;

        // Update displays
        updateText('secretDisplay', state.secret);
        updateText('attemptsDisplay', `${state.attempts}/${state.maxAttempts}`);
        updateText('remainingDisplay', state.remainingAttempts);
        updateText('hintsDisplay', state.remainingHints);

        // Update progress bar
        const progress = (state.attempts / state.maxAttempts) * 100;
        updateStyle('progressBar', 'width', `${progress}%`);

        // Update timer visibility
        if (elements.timerStat) {
            elements.timerStat.style.display = state.timerMode ? 'block' : 'none';
        }

        // Update hint button state
        if (elements.hintBtn) {
            elements.hintBtn.disabled = state.gameOver || state.remainingHints === 0;
        }

        // Update guess button and input
        if (elements.guessBtn) elements.guessBtn.disabled = state.gameOver;
        if (elements.guessInput) elements.guessInput.disabled = state.gameOver;

        // Update history
        updateHistory(state.guesses);
    };

    /**
     * Update timer display
     */
    const updateTimer = (timeLeft) => {
        if (!elements.timerDisplay) return;
        
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        elements.timerDisplay.textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Warning when low on time
        if (timeLeft <= 10) {
            elements.timerDisplay.style.color = 'var(--text-secondary)';
            elements.timerDisplay.classList.add('pulse');
        } else {
            elements.timerDisplay.style.color = '';
            elements.timerDisplay.classList.remove('pulse');
        }
    };

    /**
     * Update text content safely
     */
    const updateText = (id, text) => {
        if (elements[id]) {
            elements[id].textContent = text;
        }
    };

    /**
     * Update style property safely
     */
    const updateStyle = (id, property, value) => {
        if (elements[id]) {
            elements[id].style[property] = value;
        }
    };

    /**
     * Update history display
     */
    const updateHistory = (guesses) => {
        if (!elements.historyList) return;

        if (!guesses || guesses.length === 0) {
            elements.historyList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-terminal"></i>
                    <p>No attempts yet. Start breaching!</p>
                </div>
            `;
            return;
        }

        let html = '';
        guesses.forEach(g => {
            html += `
                <div class="history-row">
                    <div>#${g.attempt}</div>
                    <div>${g.sequence}</div>
                    <div class="text-primary">${g.exact}</div>
                    <div class="text-accent">${g.partial}</div>
                    <div>${g.time}</div>
                    <div class="${g.exact === 4 ? 'text-primary' : (g.exact > 0 ? 'text-accent' : 'text-secondary')}">
                        ${g.exact === 4 ? 'WIN' : (g.exact > 0 ? 'MATCH' : 'NO MATCH')}
                    </div>
                </div>
            `;
        });

        elements.historyList.innerHTML = html;
    };

    /**
     * Update leaderboard display
     */
    const updateLeaderboard = () => {
        if (!elements.leaderboardList) return;

        const difficulty = document.getElementById('difficultyFilter')?.value || 'all';
        const scores = Leaderboard.getTopScores(20, difficulty);

        if (scores.length === 0) {
            elements.leaderboardList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-trophy"></i>
                    <p>No scores yet. Be the first!</p>
                </div>
            `;
            return;
        }

        let html = '';
        scores.forEach((score, index) => {
            const rankClass = index === 0 ? 'top-1' : (index === 1 ? 'top-2' : (index === 2 ? 'top-3' : ''));
            const date = new Date(score.date).toLocaleDateString();
            
            html += `
                <div class="leaderboard-row ${rankClass}">
                    <div>#${index + 1}</div>
                    <div>${score.player}</div>
                    <div class="text-primary">${Leaderboard.formatScore(score.score)}</div>
                    <div>${score.attempts}</div>
                    <div>${Math.floor(score.time / 60)}:${(score.time % 60).toString().padStart(2, '0')}</div>
                    <div class="text-${score.difficulty === 'easy' ? 'primary' : (score.difficulty === 'medium' ? 'accent' : 'secondary')}">
                        ${score.difficulty.toUpperCase()}
                    </div>
                </div>
            `;
        });

        elements.leaderboardList.innerHTML = html;
    };

    /**
     * Update achievements display
     */
    const updateAchievements = () => {
        if (!elements.achievementsList) return;

        const stats = Game.getStats();
        const scores = Leaderboard.getScores();

        const achievements = [
            {
                name: 'FIRST BLOOD',
                desc: 'Win your first game',
                icon: 'fa-skull',
                unlocked: stats.totalWins > 0,
                progress: stats.totalWins > 0 ? '1/1' : '0/1'
            },
            {
                name: 'CODE MASTER',
                desc: 'Win 10 games',
                icon: 'fa-crown',
                unlocked: stats.totalWins >= 10,
                progress: `${stats.totalWins}/10`
            },
            {
                name: 'PERFECT BREACH',
                desc: 'Win without any hints',
                icon: 'fa-bolt',
                unlocked: scores.some(s => s.hintsUsed === 0 && s.score > 900),
                progress: 'Check history'
            },
            {
                name: 'SPEED RUNNER',
                desc: 'Win in under 30 seconds',
                icon: 'fa-clock',
                unlocked: scores.some(s => s.time < 30),
                progress: 'Check history'
            },
            {
                name: 'TOP 10',
                desc: 'Reach top 10 on leaderboard',
                icon: 'fa-trophy',
                unlocked: Leaderboard.getRank(Game.getState().score) <= 10,
                progress: 'Check rank'
            },
            {
                name: 'HARDCORE',
                desc: 'Win on hard difficulty',
                icon: 'fa-dragon',
                unlocked: scores.some(s => s.difficulty === 'hard' && s.score > 800),
                progress: 'Check history'
            }
        ];

        let html = '';
        achievements.forEach(a => {
            html += `
                <div class="achievement-card ${a.unlocked ? 'unlocked' : ''}">
                    <div class="achievement-icon"><i class="fas ${a.icon}"></i></div>
                    <div class="achievement-name">${a.name}</div>
                    <div class="achievement-desc">${a.desc}</div>
                    <div class="achievement-progress">${a.progress}</div>
                </div>
            `;
        });

        elements.achievementsList.innerHTML = html;
    };

    /**
     * Make a guess
     */
    const makeGuess = () => {
        const guess = elements.guessInput?.value.trim();
        
        if (!guess) {
            showMessage('Enter a 4-digit code!', 'error');
            return;
        }

        const result = Game.makeGuess(guess);
        
        if (!result.success) {
            showMessage(result.message, 'error');
            elements.guessInput?.classList.add('shake');
            setTimeout(() => elements.guessInput?.classList.remove('shake'), 300);
        } else {
            showMessage(result.message, 'info');
        }

        elements.guessInput.value = '';
        elements.guessInput.focus();
    };

    /**
     * Use a hint
     */
    const useHint = () => {
        const hint = Game.useHint();
        
        if (hint.success) {
            showMessage(`Hint: Position ${hint.position} is ${hint.digit}`, 'info');
        } else {
            showMessage(hint.message, 'error');
        }
    };

    /**
     * Start new game
     */
    const newGame = () => {
        Game.reset();
        showMessage('New game started!', 'success');
    };

    /**
     * Save score to leaderboard
     */
    const saveScore = () => {
        const state = Game.getState();
        
        if (!state.gameOver || !state.secret) {
            showMessage('Complete a game first!', 'error');
            return;
        }

        // Show modal
        const modal = document.getElementById('scoreModal');
        if (modal) {
            modal.classList.add('show');
        }
    };

    /**
     * Close modal
     */
    const closeModal = () => {
        const modal = document.getElementById('scoreModal');
        if (modal) {
            modal.classList.remove('show');
        }
    };

    /**
     * Save score with player name
     */
    const saveScoreWithName = () => {
        const playerName = document.getElementById('playerName')?.value.trim();
        
        if (!playerName) {
            showMessage('Enter your name!', 'error');
            return;
        }

        const state = Game.getState();
        
        const scoreData = {
            score: Game.calculateScore(state.attempts, 4),
            attempts: state.attempts,
            time: state.timerMode ? (state.timerDuration - state.timeLeft) : 0,
            difficulty: state.difficulty,
            hintsUsed: state.hintsUsed,
            won: true
        };

        Leaderboard.addScore(playerName, scoreData);
        
        closeModal();
        updateLeaderboard();
        showMessage('Score saved!', 'success');
        
        // Switch to leaderboard tab
        switchTab('leaderboard');
    };

    /**
     * Show message
     */
    const showMessage = (text, type = 'info') => {
        if (elements.messageText) {
            elements.messageText.textContent = text;
        }
        
        if (elements.messagePanel) {
            const colors = {
                success: 'var(--text-primary)',
                error: 'var(--text-secondary)',
                info: 'var(--text-primary)',
                warning: 'var(--text-accent)'
            };
            elements.messagePanel.style.borderLeftColor = colors[type] || colors.info;
        }
    };

    /**
     * Switch tabs
     */
    const switchTab = (tabName) => {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Find and activate clicked button
        document.querySelectorAll('.tab-btn').forEach(btn => {
            if (btn.textContent.toLowerCase().includes(tabName)) {
                btn.classList.add('active');
            }
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        const tabToShow = document.getElementById(`${tabName}Tab`);
        if (tabToShow) {
            tabToShow.classList.add('active');
        }

        // Refresh content if needed
        if (tabName === 'leaderboard') {
            updateLeaderboard();
        } else if (tabName === 'achievements') {
            updateAchievements();
        }

        currentTab = tabName;
    };

    /**
     * Toggle sound
     */
    const toggleSound = () => {
        soundEnabled = !soundEnabled;
        
        if (elements.soundBtn) {
            elements.soundBtn.innerHTML = soundEnabled ? 
                '<i class="fas fa-volume-up"></i> SOUND' : 
                '<i class="fas fa-volume-mute"></i> SOUND';
        }
    };

    /**
     * Handle game end events
     */
    const handleGameEnd = (result, data) => {
        if (result === 'win') {
            showMessage('🎉 VICTORY! You breached the system! 🎉', 'success');
            triggerConfetti();
            
            // Auto-show save modal after win
            setTimeout(() => {
                const modal = document.getElementById('scoreModal');
                if (modal) {
                    modal.classList.add('show');
                }
            }, 1500);
            
        } else if (result === 'lose') {
            showMessage(`💀 SYSTEM LOCKED! Code was ${data.secret}`, 'error');
        } else if (result === 'timeout') {
            showMessage('⏰ TIME EXPIRED! System locked!', 'error');
        }
    };

    /**
     * Trigger confetti effect
     */
    const triggerConfetti = () => {
        for (let i = 0; i < 100; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.style.cssText = `
                    position: fixed;
                    left: ${Math.random() * 100}%;
                    top: -10px;
                    width: 8px;
                    height: 8px;
                    background: hsl(${Math.random() * 360}, 100%, 50%);
                    border-radius: 50%;
                    animation: fall ${Math.random() * 3 + 2}s linear;
                    z-index: 10000;
                    pointer-events: none;
                `;
                document.body.appendChild(confetti);
                
                setTimeout(() => confetti.remove(), 5000);
            }, i * 10);
        }
    };

    // Public API
    return {
        init,
        makeGuess,
        useHint,
        newGame,
        saveScore,
        saveScoreWithName,
        closeModal,
        switchTab,
        toggleSound,
        showMessage,
        updateLeaderboard,
        updateAchievements
    };
})();

// Freeze object
Object.freeze(UI);