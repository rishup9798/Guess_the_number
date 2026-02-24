/**
 * LEADERBOARD MODULE - Score Tracking System
 * Version: 2.0.0
 */

const Leaderboard = (() => {
    'use strict';

    const STORAGE_KEY = 'cyber_lock_scores';
    const MAX_ENTRIES = 100;

    let scores = [];
    let onUpdate = null;

    /**
     * Initialize leaderboard
     */
    const init = (callback = null) => {
        onUpdate = callback;
        loadScores();
        return getScores();
    };

    /**
     * Load scores from localStorage
     */
    const loadScores = () => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            scores = stored ? JSON.parse(stored) : [];
            
            // Sort by score (highest first)
            scores.sort((a, b) => b.score - a.score);
            
            console.log(`📊 Loaded ${scores.length} scores`);
        } catch (error) {
            console.error('Failed to load scores:', error);
            scores = [];
        }
    };

    /**
     * Save scores to localStorage
     */
    const saveScores = () => {
        try {
            // Keep only top MAX_ENTRIES
            const toSave = scores.slice(0, MAX_ENTRIES);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
            
            if (onUpdate) onUpdate(toSave);
            
            return true;
        } catch (error) {
            console.error('Failed to save scores:', error);
            return false;
        }
    };

    /**
     * Add a new score
     */
    const addScore = (playerName, scoreData) => {
        // Validate
        if (!playerName || !scoreData) return false;
        
        // Create score entry
        const entry = {
            id: Date.now() + Math.random().toString(36),
            player: playerName.toUpperCase().substring(0, 20),
            score: scoreData.score || 0,
            attempts: scoreData.attempts || 0,
            time: scoreData.time || 0,
            difficulty: scoreData.difficulty || 'medium',
            date: new Date().toISOString(),
            timestamp: Date.now()
        };

        // Add to scores
        scores.push(entry);
        
        // Sort by score
        scores.sort((a, b) => b.score - a.score);
        
        // Keep only top MAX_ENTRIES
        if (scores.length > MAX_ENTRIES) {
            scores = scores.slice(0, MAX_ENTRIES);
        }

        // Save to storage
        saveScores();

        // Track stats
        updateStats(scoreData);

        return entry;
    };

    /**
     * Update game statistics
     */
    const updateStats = (scoreData) => {
        // Update total games
        const totalGames = parseInt(localStorage.getItem('totalGames') || '0') + 1;
        localStorage.setItem('totalGames', totalGames);

        // Update wins if applicable
        if (scoreData.won) {
            const totalWins = parseInt(localStorage.getItem('totalWins') || '0') + 1;
            localStorage.setItem('totalWins', totalWins);
        }

        // Update best score
        const bestScore = parseInt(localStorage.getItem('bestScore') || '0');
        if (scoreData.score > bestScore) {
            localStorage.setItem('bestScore', scoreData.score);
        }
    };

    /**
     * Get all scores
     */
    const getScores = (difficulty = 'all') => {
        if (difficulty === 'all') {
            return scores;
        }
        return scores.filter(s => s.difficulty === difficulty);
    };

    /**
     * Get top scores
     */
    const getTopScores = (limit = 10, difficulty = 'all') => {
        let filtered = difficulty === 'all' ? scores : scores.filter(s => s.difficulty === difficulty);
        return filtered.slice(0, limit);
    };

    /**
     * Get player's best score
     */
    const getPlayerBest = (playerName) => {
        const playerScores = scores.filter(s => 
            s.player.toLowerCase() === playerName.toLowerCase()
        );
        
        if (playerScores.length === 0) return null;
        
        return playerScores.sort((a, b) => b.score - a.score)[0];
    };

    /**
     * Get rank for a score
     */
    const getRank = (score) => {
        const index = scores.findIndex(s => s.score <= score);
        return index === -1 ? scores.length + 1 : index + 1;
    };

    /**
     * Format score for display
     */
    const formatScore = (score) => {
        return score.toString().padStart(6, '0');
    };

    /**
     * Clear all scores
     */
    const clearAll = () => {
        if (confirm('Are you sure you want to clear all scores?')) {
            scores = [];
            saveScores();
            
            // Reset stats
            localStorage.setItem('totalGames', '0');
            localStorage.setItem('totalWins', '0');
            localStorage.setItem('bestScore', '0');
            
            return true;
        }
        return false;
    };

    /**
     * Export scores as JSON
     */
    const exportScores = () => {
        const dataStr = JSON.stringify(scores, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `cyber-lock-scores-${new Date().toISOString()}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    /**
     * Import scores from JSON
     */
    const importScores = (jsonData) => {
        try {
            const imported = JSON.parse(jsonData);
            if (Array.isArray(imported)) {
                scores = [...scores, ...imported];
                scores.sort((a, b) => b.score - a.score);
                scores = scores.slice(0, MAX_ENTRIES);
                saveScores();
                return true;
            }
        } catch (error) {
            console.error('Failed to import scores:', error);
        }
        return false;
    };

    // Public API
    return {
        init,
        addScore,
        getScores,
        getTopScores,
        getPlayerBest,
        getRank,
        formatScore,
        clearAll,
        exportScores,
        importScores
    };
})();

// Freeze object
Object.freeze(Leaderboard);