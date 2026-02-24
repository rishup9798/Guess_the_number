/**
 * GAME MODULE - Core Logic
 * Version: 2.0.0
 */

const Game = (() => {
    'use strict';

    // Private variables
    let secret = '';
    let attempts = 0;
    let maxAttempts = 15;
    let gameOver = false;
    let guesses = [];
    let hintsUsed = 0;
    let maxHints = 3;
    let difficulty = 'medium';
    let timerMode = false;
    let timerDuration = 0;
    let timerInterval = null;
    let timeLeft = 0;
    let startTime = null;

    // Difficulty settings
    const DIFFICULTY_SETTINGS = {
        easy: { attempts: 6, hints: 5 },
        medium: { attempts: 15, hints: 3 },
        hard: { attempts: 15, hints: 0 }
    };

    // Callbacks
    let onUpdate = null;
    let onTimerTick = null;
    let onGameEnd = null;

    /**
     * Initialize game
     */
    const init = (callbacks = {}) => {
        onUpdate = callbacks.onUpdate || null;
        onTimerTick = callbacks.onTimerTick || null;
        onGameEnd = callbacks.onGameEnd || null;
        
        reset();
        return getState();
    };

    /**
     * Reset game
     */
    const reset = () => {
        // Generate new secret
        secret = Math.floor(Math.random() * 10000)
            .toString()
            .padStart(4, '0');
        
        attempts = 0;
        gameOver = false;
        guesses = [];
        hintsUsed = 0;
        startTime = Date.now();
        
        // Reset timer if active
        if (timerMode) {
            resetTimer();
        }
        
        console.log('🎯 New game started. Secret:', secret); // For testing
        
        if (onUpdate) onUpdate(getState());
    };

    /**
     * Reset timer
     */
    const resetTimer = () => {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        
        if (timerMode) {
            timeLeft = timerDuration;
            startTimer();
        }
    };

    /**
     * Start timer
     */
    const startTimer = () => {
        timerInterval = setInterval(() => {
            timeLeft--;
            
            if (onTimerTick) onTimerTick(timeLeft);
            
            if (timeLeft <= 0) {
                // Time's up - game over
                gameOver = true;
                if (timerInterval) {
                    clearInterval(timerInterval);
                    timerInterval = null;
                }
                if (onGameEnd) onGameEnd('timeout');
            }
            
            if (onUpdate) onUpdate(getState());
        }, 1000);
    };

    /**
     * Set difficulty
     */
    const setDifficulty = (level) => {
        if (!DIFFICULTY_SETTINGS[level]) return;
        
        difficulty = level;
        maxAttempts = DIFFICULTY_SETTINGS[level].attempts;
        maxHints = DIFFICULTY_SETTINGS[level].hints;
        
        reset();
    };

    /**
     * Set timer mode
     */
    const setTimerMode = (enabled, seconds = 60) => {
        timerMode = enabled;
        timerDuration = seconds;
        
        if (enabled) {
            resetTimer();
        } else if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        
        reset();
    };

    /**
     * Analyze guess using frequency algorithm
     */
    const analyzeGuess = (guess) => {
        const target = secret.split('');
        const attempt = guess.split('');
        
        let exact = 0;
        let targetFreq = new Map();
        let guessFreq = new Map();
        
        // Find exact matches
        for (let i = 0; i < 4; i++) {
            if (attempt[i] === target[i]) {
                exact++;
            } else {
                targetFreq.set(target[i], (targetFreq.get(target[i]) || 0) + 1);
                guessFreq.set(attempt[i], (guessFreq.get(attempt[i]) || 0) + 1);
            }
        }
        
        // Find partial matches
        let partial = 0;
        for (let [digit, count] of guessFreq) {
            if (targetFreq.has(digit)) {
                partial += Math.min(count, targetFreq.get(digit));
            }
        }
        
        return { exact, partial };
    };

    /**
     * Make a guess
     */
    const makeGuess = (guess) => {
        if (gameOver) {
            return { success: false, message: 'Game over. Start new game.' };
        }

        if (attempts >= maxAttempts) {
            gameOver = true;
            if (onGameEnd) onGameEnd('attempts');
            return { success: false, message: 'Maximum attempts reached!' };
        }

        if (!/^\d{4}$/.test(guess)) {
            return { success: false, message: 'Enter exactly 4 digits!' };
        }

        // Analyze guess
        const analysis = analyzeGuess(guess);
        attempts++;

        // Store guess
        const guessEntry = {
            attempt: attempts,
            sequence: guess,
            exact: analysis.exact,
            partial: analysis.partial,
            time: new Date().toLocaleTimeString()
        };
        guesses.unshift(guessEntry);

        // Calculate score
        const score = calculateScore(attempts, analysis.exact);

        // Check win condition
        if (analysis.exact === 4) {
            gameOver = true;
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
            if (onGameEnd) onGameEnd('win', { attempts, score });
            
            if (onUpdate) onUpdate(getState());
            return {
                success: true,
                gameWon: true,
                message: '🎉 ACCESS GRANTED! You win! 🎉',
                score: score
            };
        }

        // Check loss condition
        if (attempts >= maxAttempts) {
            gameOver = true;
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
            if (onGameEnd) onGameEnd('lose', { secret });
        }

        if (onUpdate) onUpdate(getState());

        return {
            success: true,
            feedback: analysis,
            message: `Attempt ${attempts}: ${analysis.exact} exact, ${analysis.partial} partial`
        };
    };

    /**
     * Calculate score based on performance
     */
    const calculateScore = (attemptsUsed, exactMatches) => {
        let baseScore = 1000;
        let attemptPenalty = attemptsUsed * 50;
        let hintPenalty = hintsUsed * 100;
        let timeBonus = 0;
        
        if (timerMode && timeLeft > 0) {
            timeBonus = timeLeft * 10;
        }
        
        let finalScore = baseScore - attemptPenalty - hintPenalty + timeBonus;
        return Math.max(finalScore, 100); // Minimum score 100
    };

    /**
     * Use a hint
     */
    const useHint = () => {
        if (gameOver) {
            return { success: false, message: 'Game is over!' };
        }

        if (hintsUsed >= maxHints) {
            return { success: false, message: 'No hints remaining!' };
        }

        hintsUsed++;
        
        // Generate hint (random position)
        const pos = Math.floor(Math.random() * 4);
        const digit = secret[pos];

        if (onUpdate) onUpdate(getState());

        return {
            success: true,
            position: pos + 1,
            digit: digit,
            remaining: maxHints - hintsUsed
        };
    };

    /**
     * Get current game state
     */
    const getState = () => {
        return {
            secret: gameOver ? secret : '????',
            attempts: attempts,
            maxAttempts: maxAttempts,
            gameOver: gameOver,
            guesses: [...guesses],
            hintsUsed: hintsUsed,
            maxHints: maxHints,
            remainingAttempts: maxAttempts - attempts,
            remainingHints: maxHints - hintsUsed,
            difficulty: difficulty,
            timerMode: timerMode,
            timeLeft: timeLeft,
            timerDuration: timerDuration,
            score: calculateScore(attempts, 0)
        };
    };

    /**
     * Get game statistics
     */
    const getStats = () => {
        return {
            totalGames: parseInt(localStorage.getItem('totalGames') || '0'),
            totalWins: parseInt(localStorage.getItem('totalWins') || '0'),
            bestScore: parseInt(localStorage.getItem('bestScore') || '0'),
            averageAttempts: calculateAverageAttempts()
        };
    };

    /**
     * Calculate average attempts from history
     */
    const calculateAverageAttempts = () => {
        const scores = JSON.parse(localStorage.getItem('scores') || '[]');
        if (scores.length === 0) return 0;
        
        const total = scores.reduce((sum, s) => sum + s.attempts, 0);
        return Math.round(total / scores.length);
    };

    // Public API
    return {
        init,
        reset,
        makeGuess,
        useHint,
        setDifficulty,
        setTimerMode,
        getState,
        getStats,
        calculateScore
    };
})();

// Freeze object to prevent modifications
Object.freeze(Game);