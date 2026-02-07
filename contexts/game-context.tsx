/**
 * Game Context - Manages game state across all screens
 */

import {
    getRandomWordPair,
    type Category
} from '@/data/game-data';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

const CUSTOM_CATEGORIES_KEY = 'imposter_custom_categories';

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
export type ImposterWordMode = 'hidden' | 'no_hint' | 'category_hint' | 'user_hint';

interface GameState {
    // Game config
    players: Player[];
    selectedCategories: Category[];
    randomizeStartingPlayer: boolean;
    imposterCount: number; // Number of imposters (default 1)
    imposterWordMode: ImposterWordMode; // What the imposter sees
    customCategories: Category[];
    isLoadingCategories: boolean;
    isVotingEnabled: boolean;

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
    isHandoverComplete: boolean; // Persistent state for "Pass the Phone" screens
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
    setVotingEnabled: (enabled: boolean) => void;
    setHintWord: (word: string) => void;
    addHint: (hint: string) => void;
    resetPlayers: () => void; // Clear all players for new game
    completePlayerSetup: () => void; // Finish player entry, go to lobby
    addCategory: (name: string, words: string[]) => Promise<Category>;
    updateCategory: (id: string, updates: Partial<Pick<Category, 'name' | 'words'>>) => Promise<void>;
    removeCategory: (id: string) => Promise<void>;

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
    setHandoverComplete: (complete: boolean) => void;

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
    imposterWordMode: 'hidden',
    customCategories: [],
    isLoadingCategories: true,
    isVotingEnabled: true,

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
    isHandoverComplete: false,
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

    const setVotingEnabled = useCallback((enabled: boolean) => {
        setState(prev => ({ ...prev, isVotingEnabled: enabled }));
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
            phase: GamePhase.PLAYER_SETUP,
            isHandoverComplete: false
        }));
    }, []);

    const completePlayerSetup = useCallback(() => {
        setState(prev => ({
            ...prev,
            phase: GamePhase.SETUP,
            isHandoverComplete: false
        }));
    }, []);

    const setHandoverComplete = useCallback((complete: boolean) => {
        setState(prev => ({ ...prev, isHandoverComplete: complete }));
    }, []);

    // --- Category Management ---

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const stored = await AsyncStorage.getItem(CUSTOM_CATEGORIES_KEY);
                if (stored) {
                    setState(prev => ({
                        ...prev,
                        customCategories: JSON.parse(stored),
                        isLoadingCategories: false
                    }));
                } else {
                    setState(prev => ({ ...prev, isLoadingCategories: false }));
                }
            } catch (error) {
                console.error('Failed to load categories:', error);
                setState(prev => ({ ...prev, isLoadingCategories: false }));
            }
        };
        loadCategories();
    }, []);

    const saveCategories = async (categories: Category[]) => {
        try {
            await AsyncStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(categories));
        } catch (error) {
            console.error('Failed to save categories:', error);
        }
    };

    const addCategory = useCallback(async (name: string, words: string[]) => {
        const newCategory: Category = {
            id: `custom_${Date.now()}`,
            name,
            icon: '✨',
            words,
            isCustom: true,
        };

        setState(prev => {
            const updated = [...prev.customCategories, newCategory];
            saveCategories(updated);
            return {
                ...prev,
                customCategories: updated
            };
        });
        return newCategory;
    }, []);

    const updateCategory = useCallback(async (id: string, updates: Partial<Pick<Category, 'name' | 'words'>>) => {
        setState(prev => {
            const updated = prev.customCategories.map(cat =>
                cat.id === id ? { ...cat, ...updates } : cat
            );
            saveCategories(updated);
            return {
                ...prev,
                customCategories: updated
            };
        });
    }, []);

    const removeCategory = useCallback(async (id: string) => {
        setState(prev => {
            const updated = prev.customCategories.filter(cat => cat.id !== id);
            saveCategories(updated);

            // Also deselect if currently selected in a game
            const isSelected = prev.selectedCategories.some(c => c.id === id);
            return {
                ...prev,
                customCategories: updated,
                selectedCategories: isSelected
                    ? prev.selectedCategories.filter(c => c.id !== id)
                    : prev.selectedCategories
            };
        });
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
                hintWord: prev.imposterWordMode === 'category_hint' ? randomCategory.name : null, // Set category as hint if in hint mode
                isHandoverComplete: false,
            };
        });
    }, [state.selectedCategories, state.players.length, state.imposterWordMode, state.imposterCount, state.randomizeStartingPlayer]);

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
                // All revealed, go to discussion
                return {
                    ...prev,
                    phase: GamePhase.DISCUSSION,
                    currentPlayerIndex: 0
                };
            }
            return {
                ...prev,
                isHandoverComplete: false,
                currentPlayerIndex: nextIndex
            };
        });
    }, []);

    const startDiscussion = useCallback(() => {
        setState(prev => {
            if (!prev.isVotingEnabled) {
                return {
                    ...prev,
                    phase: GamePhase.RESULTS,
                };
            }
            return {
                ...prev,
                phase: GamePhase.VOTING,
                currentVoterIndex: 0,
                isHandoverComplete: false,
            };
        });
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
                currentVoterIndex: nextIndex,
                isHandoverComplete: false,
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
                hintWord: prev.imposterWordMode === 'category_hint' ? randomCategory.name : null,
                isHandoverComplete: false,
            };
        });
    }, [state.selectedCategories, state.players.length, state.imposterCount, state.imposterWordMode, state.randomizeStartingPlayer]);

    const endGame = useCallback(() => {
        setState(prev => ({
            ...initialState,
            customCategories: prev.customCategories,
            isLoadingCategories: prev.isLoadingCategories,
            phase: GamePhase.SETUP, // Go to category selection, keep players
            players: prev.players.map(p => ({ ...p, score: 0, isImposter: false })),
            selectedCategories: prev.selectedCategories,
            randomizeStartingPlayer: prev.randomizeStartingPlayer,
            imposterCount: prev.imposterCount,
            imposterWordMode: prev.imposterWordMode,
            isVotingEnabled: prev.isVotingEnabled,
            isHandoverComplete: false,
        }));
    }, []);

    const startNewGame = useCallback(() => {
        setState(prev => ({
            ...initialState,
            customCategories: prev.customCategories,
            isLoadingCategories: prev.isLoadingCategories,
            isVotingEnabled: prev.isVotingEnabled,
            phase: GamePhase.PLAYER_SETUP,
            isHandoverComplete: false,
        }));
    }, []);

    const getPlayerWord = useCallback((playerIndex: number): string => {
        const isImposter = state.imposterIndices.includes(playerIndex);
        if (isImposter) {
            switch (state.imposterWordMode) {
                case 'no_hint':
                case 'category_hint':
                case 'user_hint':
                    return ''; // Handled in UI via hintWord or manual label
                case 'hidden':
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
        addCategory,
        updateCategory,
        removeCategory,
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
        setHandoverComplete,
        setVotingEnabled,
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
