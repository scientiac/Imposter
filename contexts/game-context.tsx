/**
 * Game Context - Manages game state across all screens
 */

import {
    getRandomWordPair,
    type Category
} from '@/data/game-data';
import React, { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

// --- Types ---

export type Player = {
    id: string;
    name: string;
    score: number;
    isImposter: boolean;
    isDead: boolean; // For future elimination logic
};

export enum GamePhase {
    PLAYER_SETUP, // Adding players (pass-the-phone)
    SETUP,      // Category selection and settings
    REVEAL,     // Passing phone to see words
    DISCUSSION, // Timer running
    VOTING,     // Casting votes (pass-the-phone)
    RESULTS     // Round summary
}

// Imposter word display modes
export type ImposterWordMode = 'different_word' | 'no_word' | 'hint_mode';

interface GameState {
    // Game config
    players: Player[];
    selectedCategories: Category[];
    randomizeStartingPlayer: boolean;
    imposterCount: number; // Number of imposters (default 1)
    imposterWordMode: ImposterWordMode; // What the imposter sees

    // Round state
    phase: GamePhase;
    roundNumber: number;
    realWord: string;
    imposterWord: string;
    revealPass: 1 | 2; // 1: Reveal words, 2: Collect/Show hints
    allHints: string[]; // Collective pool of hints from all players
    hintWord: string | null; // The hint given to the current player (if any)
    hintGiverIndex: number | null; // Deprecated but keeping for compatibility if needed
    imposterIndices: number[]; // Support multiple imposters
    currentPlayerIndex: number; // For reveal / voting turns
    currentVoterIndex: number; // For pass-the-phone voting
    startingPlayerIndex: number | null; // Index of player who starts
    revealedPlayers: boolean[]; // Track who has seen their role
    votes: Record<string, string>; // voterId -> targetId
    playerOrder: number[]; // Randomized order for discussion
    revealOrder: number[]; // Randomized order for reveal phase
    lastFirstPlayerIndex: number | null; // Track who started last time to rotate
}

interface GameContextValue extends GameState {
    // Setup actions
    addPlayer: (name: string) => void;
    removePlayer: (id: string) => void;
    updatePlayerName: (id: string, name: string) => void;
    toggleCategory: (category: Category) => void;
    setRandomizeStartingPlayer: (value: boolean) => void;
    setImposterCount: (count: number) => void;
    setImposterWordMode: (mode: ImposterWordMode) => void;
    setHintWord: (word: string) => void;
    addHint: (hint: string) => void;
    resetPlayers: () => void; // Clear all players for new game
    completePlayerSetup: () => void; // Finish player entry, go to lobby

    // Game flow
    startGame: () => void;
    revealWord: (playerIndex: number) => void;
    nextPlayerReveal: () => void;
    startDiscussion: () => void;
    castVote: (voterId: string, targetId: string) => void;
    nextVoter: () => boolean; // Returns true if there are more voters
    submitVotes: () => void; // Calculate results
    nextRound: () => void;
    endGame: () => void;
    startNewGame: () => void; // Full reset including player setup

    // Helpers
    getPlayerWord: (playerIndex: number) => string;
    isPlayerImposter: (playerIndex: number) => boolean;
    getCurrentVoter: () => Player | null;
}

// --- Secure Randomization ---

// Use crypto for better randomness
function secureRandom(max: number): number {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        return array[0] % max;
    }
    // Fallback for environments without crypto
    return Math.floor(Math.random() * max);
}

// Fisher-Yates shuffle with secure random
function secureShuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = secureRandom(i + 1);
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

// Generate secure ID
const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const array = new Uint8Array(8);
        crypto.getRandomValues(array);
        return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
    }
    return Math.random().toString(36).substr(2, 9);
};

// --- Initial State ---

const createInitialPlayers = (count: number): Player[] => {
    return Array.from({ length: count }).map((_, i) => ({
        id: generateId(),
        name: `Player ${i + 1}`,
        score: 0,
        isImposter: false,
        isDead: false
    }));
};

const initialState: GameState = {
    players: [], // Start with no players for pass-the-phone registration
    selectedCategories: [],
    randomizeStartingPlayer: true,
    imposterCount: 1,
    imposterWordMode: 'different_word',

    phase: GamePhase.PLAYER_SETUP,
    roundNumber: 1,
    realWord: '',
    imposterWord: '',
    revealPass: 1,
    allHints: [],
    hintWord: null,
    hintGiverIndex: null,
    imposterIndices: [],
    currentPlayerIndex: 0,
    currentVoterIndex: 0,
    startingPlayerIndex: null,
    revealedPlayers: [],
    votes: {},
    playerOrder: [],
    revealOrder: [],
    lastFirstPlayerIndex: null,
};

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<GameState>(initialState);

    // --- Setup Actions ---

    const addPlayer = useCallback((name: string) => {
        setState(prev => ({
            ...prev,
            players: [
                ...prev.players,
                {
                    id: generateId(),
                    name: name || `Player ${prev.players.length + 1}`,
                    score: 0,
                    isImposter: false,
                    isDead: false
                }
            ]
        }));
    }, []);

    const removePlayer = useCallback((id: string) => {
        setState(prev => {
            if (prev.players.length <= 3) return prev; // Min 3 players
            return {
                ...prev,
                players: prev.players.filter(p => p.id !== id)
            };
        });
    }, []);

    const updatePlayerName = useCallback((id: string, name: string) => {
        setState(prev => ({
            ...prev,
            players: prev.players.map(p =>
                p.id === id ? { ...p, name } : p
            )
        }));
    }, []);

    const toggleCategory = useCallback((category: Category) => {
        setState(prev => {
            const isSelected = prev.selectedCategories.some(c => c.id === category.id);
            return {
                ...prev,
                selectedCategories: isSelected
                    ? prev.selectedCategories.filter(c => c.id !== category.id)
                    : [...prev.selectedCategories, category]
            };
        });
    }, []);

    const setRandomizeStartingPlayer = useCallback((value: boolean) => {
        setState(prev => ({ ...prev, randomizeStartingPlayer: value }));
    }, []);

    const setImposterCount = useCallback((count: number) => {
        setState(prev => ({
            ...prev,
            imposterCount: Math.max(1, Math.min(count, Math.floor(prev.players.length / 3) || 1))
        }));
    }, []);

    const setImposterWordMode = useCallback((mode: ImposterWordMode) => {
        setState(prev => ({ ...prev, imposterWordMode: mode }));
    }, []);

    const setHintWord = useCallback((word: string) => {
        setState(prev => ({ ...prev, hintWord: word }));
    }, []);

    const addHint = useCallback((hint: string) => {
        setState(prev => ({
            ...prev,
            allHints: [...prev.allHints, hint]
        }));
    }, []);

    const resetPlayers = useCallback(() => {
        setState(prev => ({
            ...prev,
            players: [],
            phase: GamePhase.PLAYER_SETUP
        }));
    }, []);

    const completePlayerSetup = useCallback(() => {
        setState(prev => ({
            ...prev,
            phase: GamePhase.SETUP
        }));
    }, []);

    // --- Game Logic ---

    const startGame = useCallback(() => {
        if (state.selectedCategories.length === 0) return;
        if (state.players.length < 3) return;

        setState(prev => {
            // 1. Pick Category & Words using secure random
            const categoryIndex = secureRandom(prev.selectedCategories.length);
            const randomCategory = prev.selectedCategories[categoryIndex];
            const { realWord, imposterWord } = getRandomWordPair(randomCategory);

            // 2. Pick Roles (IDENTITY-FIRST)
            const playerIndices = Array.from({ length: prev.players.length }, (_, i) => i);
            const shuffledForRoles = secureShuffle(playerIndices);
            const imposterIndices = shuffledForRoles.slice(0, prev.imposterCount);

            // 3. Create Reveal Order
            let revealOrder = secureShuffle(playerIndices);
            const lastFirstPlayer = prev.lastFirstPlayerIndex;

            // Ensure first player is NOT an imposter and NOT the same as last time if possible
            const nonImposterIndices = playerIndices.filter(i => !imposterIndices.includes(i));

            // If the first person is an imposter, swap with a random non-imposter
            if (imposterIndices.includes(revealOrder[0])) {
                const targetIdx = secureRandom(nonImposterIndices.length);
                const nonImposterToSwap = nonImposterIndices[targetIdx];
                const currentPosInReveal = revealOrder.indexOf(nonImposterToSwap);
                [revealOrder[0], revealOrder[currentPosInReveal]] = [revealOrder[currentPosInReveal], revealOrder[0]];
            }

            // If the first person is still the same as last time, try to swap with another non-imposter
            if (revealOrder[0] === lastFirstPlayer && nonImposterIndices.length > 1) {
                const otherNonImposters = nonImposterIndices.filter(i => i !== lastFirstPlayer);
                const targetIdx = secureRandom(otherNonImposters.length);
                const swapWith = otherNonImposters[targetIdx];
                const currentPosInReveal = revealOrder.indexOf(swapWith);
                [revealOrder[0], revealOrder[currentPosInReveal]] = [revealOrder[currentPosInReveal], revealOrder[0]];
            }

            // 4. Assign Roles
            const playersWithRoles = prev.players.map((p, i) => ({
                ...p,
                isImposter: imposterIndices.includes(i),
                isDead: false
            }));

            // 5. Create randomized player order for discussion
            const playerOrder = secureShuffle(playerIndices);

            // 6. Pick Starting Player for discussion (can be anyone)
            const startingPlayerIndex = prev.randomizeStartingPlayer
                ? secureRandom(prev.players.length)
                : null;

            return {
                ...prev,
                phase: GamePhase.REVEAL,
                players: playersWithRoles,
                realWord,
                imposterWord,
                imposterIndices,
                revealPass: 1, // Start with pass 1
                allHints: [],
                currentPlayerIndex: 0,
                currentVoterIndex: 0,
                startingPlayerIndex,
                revealedPlayers: new Array(prev.players.length).fill(false),
                votes: {},
                playerOrder,
                revealOrder, // Store the specific reveal order
                lastFirstPlayerIndex: revealOrder[0], // Remember who went first
                hintWord: null, // Reset hint
            };
        });
    }, [state.selectedCategories, state.players.length, state.randomizeStartingPlayer]);

    const revealWord = useCallback((playerIndex: number) => {
        setState(prev => {
            const newRevealed = [...prev.revealedPlayers];
            newRevealed[playerIndex] = true;
            return { ...prev, revealedPlayers: newRevealed };
        });
    }, []);

    const nextPlayerReveal = useCallback(() => {
        setState(prev => {
            const nextIndex = prev.currentPlayerIndex + 1;
            if (nextIndex >= prev.players.length) {
                if (prev.revealPass === 1 && prev.imposterWordMode === 'hint_mode') {
                    // Pass 1 finished, go to Pass 2 (Hints)
                    // We shuffle the reveal order for pass 2 to keep things random
                    const playerIndices = Array.from({ length: prev.players.length }, (_, i) => i);
                    const newRevealOrder = secureShuffle(playerIndices);

                    return {
                        ...prev,
                        revealPass: 2,
                        currentPlayerIndex: 0,
                        revealOrder: newRevealOrder,
                        revealedPlayers: new Array(prev.players.length).fill(false),
                    };
                }

                // All revealed, go to discussion
                return {
                    ...prev,
                    phase: GamePhase.DISCUSSION,
                    currentPlayerIndex: 0
                };
            }
            return {
                ...prev,
                currentPlayerIndex: nextIndex
            };
        });
    }, []);

    const startDiscussion = useCallback(() => {
        setState(prev => ({
            ...prev,
            phase: GamePhase.VOTING,
            currentVoterIndex: 0
        }));
    }, []);

    const castVote = useCallback((voterId: string, targetId: string) => {
        setState(prev => ({
            ...prev,
            votes: {
                ...prev.votes,
                [voterId]: targetId
            }
        }));
    }, []);

    const nextVoter = useCallback((): boolean => {
        let hasMoreVoters = false;
        setState(prev => {
            const nextIndex = prev.currentVoterIndex + 1;
            if (nextIndex >= prev.players.length) {
                hasMoreVoters = false;
                return prev; // Don't advance, let submitVotes be called
            }
            hasMoreVoters = true;
            return {
                ...prev,
                currentVoterIndex: nextIndex
            };
        });
        return hasMoreVoters;
    }, []);

    const submitVotes = useCallback(() => {
        setState(prev => {
            // Tally votes
            const voteCounts: Record<string, number> = {};
            Object.values(prev.votes).forEach(targetId => {
                voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
            });

            // Find most voted
            let maxVotes = 0;
            let mostVotedId: string | null = null;
            let isTie = false;

            Object.entries(voteCounts).forEach(([id, count]) => {
                if (count > maxVotes) {
                    maxVotes = count;
                    mostVotedId = id;
                    isTie = false;
                } else if (count === maxVotes) {
                    isTie = true;
                }
            });

            // Get imposter IDs
            const imposterIds = prev.imposterIndices.map(idx => prev.players[idx].id);
            const isImposterCaught = mostVotedId !== null &&
                imposterIds.includes(mostVotedId) && !isTie;

            // Count wrong votes (votes that were not for any imposter)
            const wrongVoteCount = Object.values(prev.votes).filter(
                targetId => !imposterIds.includes(targetId)
            ).length;

            // Update Scores with fair system
            const updatedPlayers = prev.players.map(p => {
                let points = 0;
                if (isImposterCaught) {
                    // Town wins: +2 for everyone who voted for an imposter
                    if (imposterIds.includes(prev.votes[p.id])) {
                        points = 2;
                    }
                    // Imposters get nothing when caught
                } else {
                    // Imposter wins: points based on wrong votes
                    if (p.isImposter) {
                        // Each imposter gets +1 per wrong vote (divided among imposters)
                        points = Math.floor(wrongVoteCount / prev.imposterIndices.length);
                    }
                }
                return { ...p, score: p.score + points };
            });

            return {
                ...prev,
                players: updatedPlayers,
                phase: GamePhase.RESULTS
            };
        });
    }, []);

    const nextRound = useCallback(() => {
        // Just like start game but keep scores
        if (state.selectedCategories.length === 0) return;

        setState(prev => {
            const categoryIndex = secureRandom(prev.selectedCategories.length);
            const randomCategory = prev.selectedCategories[categoryIndex];
            const { realWord, imposterWord } = getRandomWordPair(randomCategory);

            // 1. Pick Roles (IDENTITY-FIRST)
            const playerIndices = Array.from({ length: prev.players.length }, (_, i) => i);
            const shuffledForRoles = secureShuffle(playerIndices);
            const imposterIndices = shuffledForRoles.slice(0, prev.imposterCount);

            // 2. Create Reveal Order
            let revealOrder = secureShuffle(playerIndices);
            const lastFirstPlayer = prev.lastFirstPlayerIndex;

            // Ensure first player is NOT an imposter and NOT the same as last time if possible
            const nonImposterIndices = playerIndices.filter(i => !imposterIndices.includes(i));

            // If the first person is an imposter, swap with a random non-imposter
            if (imposterIndices.includes(revealOrder[0])) {
                const targetIdx = secureRandom(nonImposterIndices.length);
                const nonImposterToSwap = nonImposterIndices[targetIdx];
                const currentPosInReveal = revealOrder.indexOf(nonImposterToSwap);
                [revealOrder[0], revealOrder[currentPosInReveal]] = [revealOrder[currentPosInReveal], revealOrder[0]];
            }

            // If the first person is still the same as last time, try to swap with another non-imposter
            if (revealOrder[0] === lastFirstPlayer && nonImposterIndices.length > 1) {
                const otherNonImposters = nonImposterIndices.filter(i => i !== lastFirstPlayer);
                const targetIdx = secureRandom(otherNonImposters.length);
                const swapWith = otherNonImposters[targetIdx];
                const currentPosInReveal = revealOrder.indexOf(swapWith);
                [revealOrder[0], revealOrder[currentPosInReveal]] = [revealOrder[currentPosInReveal], revealOrder[0]];
            }

            const playersWithNewRoles = prev.players.map((p, i) => ({
                ...p,
                isImposter: imposterIndices.includes(i),
                isDead: false
            }));

            const playerOrder = secureShuffle(playerIndices);

            const startingPlayerIndex = prev.randomizeStartingPlayer
                ? secureRandom(prev.players.length)
                : null;

            return {
                ...prev,
                phase: GamePhase.REVEAL,
                roundNumber: prev.roundNumber + 1,
                players: playersWithNewRoles,
                realWord,
                imposterWord,
                imposterIndices,
                revealPass: 1, // Reset
                allHints: [], // Reset
                currentPlayerIndex: 0,
                currentVoterIndex: 0,
                startingPlayerIndex,
                revealedPlayers: new Array(prev.players.length).fill(false),
                votes: {},
                playerOrder,
                revealOrder,
                lastFirstPlayerIndex: revealOrder[0],
                hintWord: null,
            };
        });
    }, [state.selectedCategories]);

    const endGame = useCallback(() => {
        setState(prev => ({
            ...initialState,
            phase: GamePhase.SETUP, // Go to category selection, keep players
            players: prev.players.map(p => ({ ...p, score: 0, isImposter: false })),
            selectedCategories: prev.selectedCategories,
            randomizeStartingPlayer: prev.randomizeStartingPlayer,
            imposterCount: prev.imposterCount,
            imposterWordMode: prev.imposterWordMode,
        }));
    }, []);

    const startNewGame = useCallback(() => {
        setState({
            ...initialState,
            phase: GamePhase.PLAYER_SETUP,
        });
    }, []);

    const getPlayerWord = useCallback((playerIndex: number): string => {
        const isImposter = state.imposterIndices.includes(playerIndex);
        if (isImposter) {
            switch (state.imposterWordMode) {
                case 'no_word':
                case 'hint_mode':
                    return ''; // Will be handled in UI
                case 'different_word':
                default:
                    return state.imposterWord;
            }
        }
        return state.realWord;
    }, [state.imposterIndices, state.imposterWordMode, state.imposterWord, state.realWord]);

    const isPlayerImposter = useCallback((playerIndex: number): boolean => {
        return state.imposterIndices.includes(playerIndex);
    }, [state.imposterIndices]);

    const getCurrentVoter = useCallback((): Player | null => {
        if (state.currentVoterIndex >= state.players.length) return null;
        return state.players[state.currentVoterIndex];
    }, [state.currentVoterIndex, state.players]);

    const value: GameContextValue = {
        ...state,
        addPlayer,
        removePlayer,
        updatePlayerName,
        toggleCategory,
        setRandomizeStartingPlayer,
        setImposterCount,
        setImposterWordMode,
        setHintWord,
        addHint,
        resetPlayers,
        completePlayerSetup,
        startGame,
        revealWord,
        nextPlayerReveal,
        startDiscussion,
        castVote,
        nextVoter,
        submitVotes,
        nextRound,
        endGame,
        startNewGame,
        getPlayerWord,
        isPlayerImposter,
        getCurrentVoter,
    };

    return (
        <GameContext.Provider value={value}>
            {children}
        </GameContext.Provider>
    );
}

export function useGame() {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
}
