/**
 * Active Game Screen - Handles Discussion, Voting, and Results phases
 * Uses React Native Paper with pass-the-phone voting
 */

import { PhaseTransition } from '@/components/animated/PhaseTransition';
import { ScalableButton } from '@/components/animated/ScalableButton';
import { PlayerAvatar } from '@/components/ui/PlayerAvatar';
import { Layout } from '@/constants/theme';
import { GamePhase, useGame } from '@/contexts/game-context';
import * as Haptics from 'expo-haptics';
import { router, useRootNavigationState } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
    Avatar,
    Button,
    Card,
    Chip,
    Divider,
    List,
    ProgressBar,
    Surface,
    Text,
    useTheme
} from 'react-native-paper';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function GameScreen() {
    const { phase } = useGame();
    const rootNavigationState = useRootNavigationState();

    // Redirect based on game phase
    useEffect(() => {
        if (!rootNavigationState?.key) return;

        if (phase === GamePhase.SETUP || phase === GamePhase.PLAYER_SETUP) {
            router.replace('/(tabs)');
        } else if (phase === GamePhase.REVEAL) {
            router.replace('/reveal');
        }
    }, [phase, rootNavigationState?.key]);

    return (
        <View style={styles.container}>
            {phase === GamePhase.DISCUSSION && <DiscussionView key="discussion" />}
            {phase === GamePhase.VOTING && <VotingView key="voting" />}
            {phase === GamePhase.RESULTS && <ResultsView key="results" />}
        </View>
    );
}

// --- Discussion View ---
function DiscussionView() {
    const theme = useTheme();
    const { players, startDiscussion, startingPlayerIndex } = useGame();
    const startingPlayer = startingPlayerIndex !== null ? players[startingPlayerIndex] : null;

    return (
        <PhaseTransition type="fade" style={styles.phaseContainer}>
            <View style={styles.header}>
                <Avatar.Icon
                    size={72}
                    icon="forum-outline"
                    style={{ backgroundColor: theme.colors.primaryContainer }}
                    color={theme.colors.onPrimaryContainer}
                />
                <Text variant="displaySmall" style={[styles.phaseTitle, { color: theme.colors.primary }]}>
                    Discussion
                </Text>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', opacity: 0.8 }}>
                    Find the imposter among {players.length} players!
                </Text>
            </View>

            {startingPlayer && (
                <Card style={[styles.card, { borderRadius: 20 }]} mode="contained">
                    <Card.Content style={styles.startingPlayerCard}>
                        <Avatar.Icon
                            size={44}
                            icon="account-voice"
                            style={{ backgroundColor: theme.colors.secondaryContainer }}
                        />
                        <View style={{ marginLeft: 16 }}>
                            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, letterSpacing: 0.5 }}>
                                STARTING PLAYER
                            </Text>
                            <Text variant="titleLarge" style={{ fontWeight: 'bold' }}>{startingPlayer.name}</Text>
                        </View>
                    </Card.Content>
                </Card>
            )}

            <ScrollView style={styles.playerList} showsVerticalScrollIndicator={false}>
                <Card mode="elevated" style={[styles.card, { borderRadius: 28, overflow: 'hidden' }]}>
                    {players.map((p, index) => (
                        <List.Item
                            key={p.id}
                            title={p.name}
                            titleStyle={{ fontWeight: '600' }}
                            description={`${p.score} points`}
                            left={props => (
                                <View style={{ paddingLeft: 16, justifyContent: 'center' }}>
                                    <PlayerAvatar
                                        name={p.name}
                                        size={48}
                                    />
                                </View>
                            )}
                            right={props =>
                                startingPlayerIndex === index ? (
                                    <View style={{ justifyContent: 'center' }}>
                                        <Chip
                                            {...props}
                                            compact
                                            icon="microphone"
                                            style={{
                                                backgroundColor: theme.colors.tertiaryContainer,
                                            }}
                                            textStyle={{
                                                color: theme.colors.onTertiaryContainer,
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            First
                                        </Chip>
                                    </View>
                                ) : null
                            }
                        />
                    ))}
                </Card>
            </ScrollView>

            <View style={styles.buttonContainer}>
                <ScalableButton onPress={startDiscussion} style={styles.actionButton}>
                    <Button
                        mode="contained"
                        style={styles.fullWidth}
                        contentStyle={styles.buttonContent}
                        labelStyle={styles.actionButtonLabel}
                        icon="vote"
                        pointerEvents="none"
                    >
                        Start Voting
                    </Button>
                </ScalableButton>
            </View>
        </PhaseTransition>
    );
}

// --- Voting View (Pass-the-Phone) ---
function VotingView() {
    const theme = useTheme();
    const {
        players,
        currentVoterIndex,
        castVote,
        nextVoter,
        submitVotes,
        getCurrentVoter,
    } = useGame();

    const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
    const [showPassPhone, setShowPassPhone] = useState(true);

    const currentVoter = getCurrentVoter();
    const progress = (currentVoterIndex + 1) / players.length;
    const isLastVoter = currentVoterIndex === players.length - 1;

    // Determine next voter name for button label
    const nextVoterIndex = currentVoterIndex + 1;
    const nextVoterName = nextVoterIndex < players.length ? players[nextVoterIndex].name : 'Results';

    const handleVote = () => {
        if (!currentVoter || !selectedTarget) return;
        castVote(currentVoter.id, selectedTarget);
        setSelectedTarget(null);

        if (isLastVoter) {
            submitVotes();
        } else {
            nextVoter();
            setShowPassPhone(true);
        }
    };

    const handlePassPhone = () => {
        setShowPassPhone(false);
    };

    if (!currentVoter) {
        return null;
    }

    if (showPassPhone) {
        return (
            <PhaseTransition key="pass-phone" type="slide" style={styles.phaseContainer}>
                <View style={styles.passPhoneContainer}>
                    <Surface style={styles.passPhoneCard} elevation={2}>
                        <PlayerAvatar name={currentVoter.name} size={100} />
                        <Text variant="displaySmall" style={[styles.phaseTitle, { marginTop: 28, color: theme.colors.primary }]}>
                            Voting Phase
                        </Text>
                        <Text variant="headlineSmall" style={{ fontWeight: 'bold', marginTop: 8 }}>
                            To: {currentVoter.name}
                        </Text>
                        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 16, opacity: 0.8 }}>
                            Pass the phone to {currentVoter.name} to cast their secret vote.
                        </Text>

                        <ScalableButton
                            onPress={handlePassPhone}
                            style={{
                                marginTop: 32,
                                width: '100%',
                            }}
                        >
                            <Button
                                mode="contained"
                                style={{
                                    width: '100%',
                                    height: Layout.floatingBar.height,
                                    borderRadius: Layout.floatingBar.borderRadius,
                                }}
                                contentStyle={styles.buttonContent}
                                labelStyle={styles.actionButtonLabel}
                                icon="account-arrow-right"
                                pointerEvents="none"
                            >
                                I am {currentVoter.name}
                            </Button>
                        </ScalableButton>
                    </Surface>
                </View>
            </PhaseTransition>
        );
    }

    return (
        <PhaseTransition type="fade" style={styles.phaseContainer}>
            {/* Progress Header */}
            <View style={styles.progressHeader}>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    Voter {currentVoterIndex + 1} of {players.length}
                </Text>
                <ProgressBar
                    progress={progress}
                    color={theme.colors.primary}
                    style={styles.progressBar}
                />
            </View>

            {/* Current Voter */}
            <Card style={[styles.voterCard, { borderRadius: 24 }]} mode="elevated">
                <Card.Content style={styles.voterContent}>
                    <PlayerAvatar
                        size={64}
                        name={currentVoter.name}
                    />
                    <View style={{ marginLeft: 20, flex: 1 }}>
                        <Text variant="labelLarge" style={{ color: theme.colors.primary, fontWeight: 'bold', letterSpacing: 1 }}>
                            CURRENT VOTER
                        </Text>
                        <Text variant="headlineMedium" style={{ fontWeight: 'bold' }}>{currentVoter.name}</Text>
                    </View>
                </Card.Content>
            </Card>

            <Text variant="titleMedium" style={styles.votePrompt}>
                Who is the imposter?
            </Text>

            {/* Vote Targets */}
            <ScrollView style={styles.voteList} showsVerticalScrollIndicator={false}>
                <View style={styles.voteGrid}>
                    {players
                        .filter(p => p.id !== currentVoter.id)
                        .map((p, index) => {
                            const isSelected = selectedTarget === p.id;
                            return (
                                <Animated.View
                                    key={p.id}
                                    entering={FadeInDown.delay(index * 50).duration(400)}
                                    style={styles.voteTargetCard}
                                >
                                    <ScalableButton
                                        onPress={() => {
                                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                            setSelectedTarget(p.id);
                                        }}
                                    >
                                        <Card
                                            style={[
                                                styles.fullWidth,
                                                { borderRadius: 24 },
                                                isSelected && { borderColor: theme.colors.primary, borderWidth: 3 }
                                            ]}
                                            mode={isSelected ? 'elevated' : 'contained'}
                                        >
                                            <Card.Content style={styles.voteTargetContent}>
                                                <PlayerAvatar
                                                    name={p.name}
                                                    size={56}
                                                />
                                                <Text
                                                    variant="titleMedium"
                                                    style={[
                                                        styles.voteTargetName,
                                                        isSelected && { color: theme.colors.primary, fontWeight: 'bold' }
                                                    ]}
                                                >
                                                    {p.name}
                                                </Text>
                                            </Card.Content>
                                        </Card>
                                    </ScalableButton>
                                </Animated.View>
                            );
                        })}
                </View>
            </ScrollView>

            {/* Submit Vote Button */}
            <View style={styles.buttonContainer}>
                <ScalableButton
                    onPress={handleVote}
                    disabled={!selectedTarget}
                    style={styles.actionButton}
                >
                    <Button
                        mode="contained"
                        disabled={!selectedTarget}
                        style={styles.fullWidth}
                        contentStyle={styles.buttonContent}
                        labelStyle={styles.actionButtonLabel}
                        icon="check-circle"
                        pointerEvents="none"
                    >
                        {isLastVoter
                            ? 'Submit Final Vote'
                            : `Confirm & Pass to ${nextVoterName}`
                        }
                    </Button>
                </ScalableButton>
            </View>
        </PhaseTransition>
    );
}

// --- Results View ---
function ResultsView() {
    const theme = useTheme();
    const {
        players,
        imposterIndices,
        realWord,
        imposterWord,
        imposterWordMode,
        votes,
        nextRound,
        endGame,
    } = useGame();

    // Get imposters
    const imposters = imposterIndices.map(idx => players[idx]).filter(Boolean);

    // Calculate vote counts for display
    const voteCounts: Record<string, number> = {};
    Object.values(votes).forEach(targetId => {
        voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
    });

    // Check if any imposter was caught
    const caughtImposters = imposters.filter(imp => {
        const voteCount = voteCounts[imp.id] || 0;
        const maxVotes = Math.max(...Object.values(voteCounts), 0);
        return voteCount === maxVotes && voteCount > 0;
    });

    const imposterWins = caughtImposters.length === 0;

    // Sort players by score
    const leaderboard = [...players].sort((a, b) => b.score - a.score);

    return (
        <PhaseTransition type="fade" style={styles.phaseContainer}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.resultsContent}>
                {/* Result Banner */}
                <Card
                    style={[styles.resultBanner, {
                        backgroundColor: imposterWins ? theme.colors.errorContainer : theme.colors.primaryContainer,
                        borderRadius: 28
                    }]}
                    mode="contained"
                >
                    <Card.Content style={styles.resultBannerContent}>
                        <Avatar.Icon
                            size={80}
                            icon={imposterWins ? 'incognito' : 'trophy'}
                            style={{
                                backgroundColor: imposterWins ? theme.colors.error : theme.colors.primary
                            }}
                            color={imposterWins ? theme.colors.onError : theme.colors.onPrimary}
                        />
                        <Text
                            variant="displaySmall"
                            style={{
                                marginTop: 20,
                                fontWeight: 'bold',
                                color: imposterWins ? theme.colors.error : theme.colors.primary
                            }}
                        >
                            {imposterWins ? 'Imposter Wins!' : 'Town Wins!'}
                        </Text>
                    </Card.Content>
                </Card>

                {/* Imposter Reveal */}
                <Card style={{ marginBottom: 24, borderRadius: 24 }} mode="elevated">
                    <Card.Content>
                        <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant, letterSpacing: 1 }}>
                            {imposters.length === 1 ? 'THE IMPOSTER' : 'THE IMPOSTERS'}
                        </Text>
                        <View style={styles.imposterList}>
                            {imposters.map(imp => (
                                <Chip
                                    key={imp.id}
                                    icon="incognito"
                                    style={[styles.imposterChip, { backgroundColor: theme.colors.errorContainer }]}
                                    textStyle={{ fontWeight: 'bold', color: theme.colors.onErrorContainer }}
                                >
                                    {imp.name}
                                </Chip>
                            ))}
                        </View>
                        <Divider style={{ marginVertical: 20 }} />
                        <View style={styles.wordReveal}>
                            <View style={styles.wordColumn}>
                                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}>
                                    REAL WORD
                                </Text>
                                <Text variant="headlineSmall" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                                    {realWord}
                                </Text>
                            </View>
                            <Divider style={{ height: 40, width: 1 }} />
                            <View style={styles.wordColumn}>
                                <Text variant="labelSmall" style={{ color: theme.colors.error, marginBottom: 4 }}>
                                    {imposterWordMode === 'no_word' ? 'IMPOSTER WORD' : 'FALSE WORD'}
                                </Text>
                                <Text variant="headlineSmall" style={{ color: theme.colors.error, fontWeight: 'bold' }}>
                                    {imposterWordMode === 'no_word' ? '???' : imposterWord}
                                </Text>
                            </View>
                        </View>
                    </Card.Content>
                </Card>

                {/* Leaderboard */}
                <View style={styles.sectionHeader}>
                    <Text variant="titleLarge" style={styles.sectionTitle}>
                        Leaderboard
                    </Text>
                    <Avatar.Icon size={32} icon="medal" style={{ backgroundColor: 'transparent' }} />
                </View>

                <Card mode="contained" style={styles.leaderboardCard}>
                    {leaderboard.map((p, index) => {
                        const isImposter = imposterIndices.includes(players.findIndex(player => player.id === p.id));
                        const isWinner = index === 0;
                        const rankColor = index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : theme.colors.outline;

                        return (
                            <View key={p.id}>
                                <List.Item
                                    title={p.name}
                                    titleStyle={[isWinner && { fontWeight: 'bold', color: theme.colors.primary }]}
                                    description={isImposter ? (caughtImposters.some(c => c.id === p.id) ? 'Caught Imposter' : 'Escaped Imposter') : 'Townsperson'}
                                    left={props => (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 30 }}>
                                            <Text
                                                variant="headlineSmall"
                                                style={[styles.rankText, { color: rankColor, width: 32, textAlign: 'center' }]}
                                            >
                                                {index + 1}
                                            </Text>
                                            <PlayerAvatar name={p.name} size={44} style={{ marginLeft: 16 }} />
                                        </View>
                                    )}
                                    right={props => (
                                        <View style={styles.scoreContainer}>
                                            <Text variant="titleLarge" style={styles.scoreText}>
                                                {p.score}
                                            </Text>
                                            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, fontWeight: 'bold' }}>PTS</Text>
                                        </View>
                                    )}
                                    style={styles.leaderboardItem}
                                />
                                {index < leaderboard.length - 1 && <Divider horizontalInset />}
                            </View>
                        );
                    })}
                </Card>

                <View style={{ height: 120 }} />
            </ScrollView>
            {/* Action Buttons */}
            <View style={styles.buttonRow}>
                <ScalableButton
                    onPress={endGame}
                    style={styles.halfButton}
                >
                    <Button
                        mode="outlined"
                        textColor={theme.colors.error}
                        style={[styles.fullWidth, { borderColor: theme.colors.error }]}
                        contentStyle={styles.buttonContent}
                        labelStyle={styles.halfButtonLabel}
                        icon="pause"
                    >
                        End Game
                    </Button>
                </ScalableButton>
                <ScalableButton
                    onPress={() => {
                        nextRound();
                        router.replace('/reveal');
                    }}
                    style={styles.halfButton}
                >
                    <Button
                        mode="contained"
                        style={styles.fullWidth}
                        contentStyle={styles.buttonContent}
                        labelStyle={styles.halfButtonLabel}
                        icon="arrow-right"
                        pointerEvents="none"
                    >
                        Next Round
                    </Button>
                </ScalableButton>
            </View>
        </PhaseTransition>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    phaseContainer: {
        flex: 1,
        paddingTop: 60,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
        paddingHorizontal: 20,
    },
    phaseTitle: {
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
    },
    progressHeader: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    progressBar: {
        marginTop: 8,
        height: 6,
        borderRadius: 3,
    },
    card: {
        marginHorizontal: 20,
        marginBottom: 16,
    },
    startingPlayerCard: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    playerList: {
        flex: 1,
    },
    voterCard: {
        marginHorizontal: 20,
        marginBottom: 16,
    },
    voterContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    votePrompt: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    voteList: {
        flex: 1,
        paddingHorizontal: 20,
    },
    voteGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingBottom: 20,
    },
    voteTargetCard: {
        width: '48%',
        marginBottom: 12,
    },
    voteTargetContent: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    voteTargetName: {
        marginTop: 8,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    passPhoneContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    passPhoneCard: {
        width: '100%',
        padding: 32,
        alignItems: 'center',
        borderRadius: 24,
    },
    resultsContent: {
        padding: 20,
    },
    resultBanner: {
        marginBottom: 16,
    },
    resultBannerContent: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    imposterList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
        marginTop: 8,
    },
    imposterChip: {
        backgroundColor: 'rgba(255,59,48,0.1)',
    },
    wordReveal: {
        flexDirection: 'row',
    },
    wordColumn: {
        flex: 1,
        alignItems: 'center',
    },
    sectionTitle: {
        fontWeight: 'bold',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 24,
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    leaderboardCard: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    leaderboardItem: {
        paddingVertical: 8,
    },
    rankContainer: {
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 20,
    },
    rankText: {
        fontWeight: '900',
    },
    scoreContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        minWidth: 50,
    },
    scoreText: {
        fontWeight: 'bold',
    },
    rankBadge: {
        width: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonContainer: {
        position: 'absolute',
        bottom: Layout.floatingBar.bottom,
        left: 0,
        right: 0,
        marginHorizontal: Layout.floatingBar.marginHorizontal,
        height: Layout.floatingBar.height,
        borderRadius: Layout.floatingBar.borderRadius,
        backgroundColor: 'transparent',
        shadowColor: '#000',
        shadowOffset: Layout.floatingBar.shadowOffset,
        shadowOpacity: Layout.floatingBar.shadowOpacity,
        shadowRadius: Layout.floatingBar.shadowRadius,
    },
    buttonRow: {
        position: 'absolute',
        bottom: Layout.floatingBar.bottom,
        left: 0,
        right: 0,
        marginHorizontal: Layout.floatingBar.marginHorizontal,
        height: Layout.floatingBar.height,
        flexDirection: 'row',
        gap: 12,
        backgroundColor: 'transparent',
        shadowColor: '#000',
        shadowOffset: Layout.floatingBar.shadowOffset,
        shadowOpacity: Layout.floatingBar.shadowOpacity,
        shadowRadius: Layout.floatingBar.shadowRadius,
    },
    actionButton: {
        flex: 1,
        borderRadius: 32,
        height: '100%',
    },
    fullWidth: {
        width: '100%',
        height: '100%',
        borderRadius: 32,
        justifyContent: 'center',
    },
    halfButton: {
        flex: 1,
        borderRadius: 32,
        height: '100%',
        justifyContent: 'center',
    },
    actionButtonLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    halfButtonLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    buttonContent: {
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row-reverse',
    },
});
