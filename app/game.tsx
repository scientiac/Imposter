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
import { useEffect, useRef, useState } from 'react';
import { Keyboard, ScrollView, StyleSheet, View } from 'react-native';
import {
    Avatar,
    Button,
    Card,
    Chip,
    Divider,
    List,
    Modal,
    Portal,
    Surface,
    Text,
    TextInput,
    useTheme
} from 'react-native-paper';
import Animated, {
    Extrapolation,
    FadeInDown,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';

export default function GameScreen() {
    const { phase } = useGame();
    const rootNavigationState = useRootNavigationState();

    // Redirect if game not active
    useEffect(() => {
        if (!rootNavigationState?.key) return;

        if (phase === GamePhase.SETUP || phase === GamePhase.PLAYER_SETUP) {
            router.replace('/(tabs)');
        }
    }, [phase, rootNavigationState?.key]);

    return (
        <View style={styles.container}>
            {phase === GamePhase.REVEAL && <RevealView key="reveal" />}
            {phase === GamePhase.DISCUSSION && <DiscussionView key="discussion" />}
            {phase === GamePhase.VOTING && <VotingView key="voting" />}
            {phase === GamePhase.RESULTS && <ResultsView key="results" />}
        </View>
    );
}


// --- Reveal View ---
function RevealView() {
    const theme = useTheme();
    const {
        currentPlayerIndex,
        players,
        getPlayerWord,
        revealWord,
        nextPlayerReveal,
        isPlayerImposter,
        imposterWordMode,
        allHints,
        addHint,
        revealOrder,
        hintWord,
    } = useGame();

    const [isVerificationModalVisible, setVerificationModalVisible] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [hasRotated, setHasRotated] = useState(false);
    const [hintInput, setHintInput] = useState('');
    const [showPassPhone, setShowPassPhone] = useState(true);
    const revealTimeoutRef = useRef<any>(null);

    const rotation = useSharedValue(0);

    const frontAnimatedStyle = useAnimatedStyle(() => {
        const rotateValue = interpolate(rotation.value, [0, 180], [0, 180], Extrapolation.CLAMP);
        const scale = interpolate(rotation.value, [0, 90, 180], [1, 1.1, 1], Extrapolation.CLAMP);
        const opacity = interpolate(rotation.value, [89, 90, 91], [1, 0, 0], Extrapolation.CLAMP);
        return {
            transform: [{ perspective: 1200 }, { rotateY: `${rotateValue}deg` }, { scale }],
            opacity,
            zIndex: rotation.value < 90 ? 2 : 1,
            elevation: rotation.value === 0 ? 4 : 0,
        };
    });

    const backAnimatedStyle = useAnimatedStyle(() => {
        const rotateValue = interpolate(rotation.value, [0, 180], [180, 360], Extrapolation.CLAMP);
        const scale = interpolate(rotation.value, [0, 90, 180], [1, 1.1, 1], Extrapolation.CLAMP);
        const opacity = interpolate(rotation.value, [89, 90, 91], [0, 0, 1], Extrapolation.CLAMP);
        return {
            transform: [{ perspective: 1200 }, { rotateY: `${rotateValue}deg` }, { scale }],
            opacity,
            zIndex: rotation.value >= 90 ? 2 : 1,
            elevation: rotation.value === 180 ? 4 : 0,
        };
    });

    const actualPlayerIndex = revealOrder && revealOrder.length > 0
        ? revealOrder[currentPlayerIndex]
        : currentPlayerIndex;

    const currentPlayer = players[actualPlayerIndex];

    if (!currentPlayer) return null;

    const isLastPlayer = currentPlayerIndex === players.length - 1;
    const isImposter = isPlayerImposter(actualPlayerIndex);
    const playerWord = getPlayerWord(actualPlayerIndex);

    const handlePressIn = () => {
        revealTimeoutRef.current = setTimeout(() => {
            rotation.value = withTiming(180, { duration: 400 });
            revealWord(actualPlayerIndex);
            setHasRotated(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            revealTimeoutRef.current = null;
        }, 500);
    };

    const handlePressOut = () => {
        if (revealTimeoutRef.current) {
            clearTimeout(revealTimeoutRef.current);
            revealTimeoutRef.current = null;
        }
        rotation.value = withTiming(0, { duration: 400 });
        if (!isVerified) {
            if (imposterWordMode === 'user_hint') {
                setTimeout(() => setVerificationModalVisible(true), 300);
            } else {
                setIsVerified(true);
            }
        }
    };

    const handleNext = () => {
        if (!isVerified) {
            setVerificationModalVisible(true);
            return;
        }
        setHintInput('');
        setIsVerified(false);
        setHasRotated(false);
        setVerificationModalVisible(false);
        nextPlayerReveal();
        setShowPassPhone(true);
    };

    const getWordDisplay = () => {
        if (isImposter) {
            if (imposterWordMode === 'hidden') return { title: playerWord, subtitle: null, icon: 'eye' };
            if (imposterWordMode === 'no_hint') return { title: 'Imposter', subtitle: null, icon: 'incognito' };
            if (imposterWordMode === 'category_hint') return { title: 'Imposter', subtitle: hintWord ? `Hint: ${hintWord}` : null, icon: 'incognito' };
            if (imposterWordMode === 'user_hint') {
                const availableHints = allHints.filter(h => h.trim().length > 0);
                const randomHint = availableHints.length > 0 ? availableHints[Math.floor(Math.random() * availableHints.length)] : null;
                return { title: 'Imposter', subtitle: randomHint ? `Hint: ${randomHint}` : null, icon: 'incognito' };
            }
        }
        return { title: playerWord, subtitle: null, icon: 'eye' };
    };

    const wordInfo = getWordDisplay();
    const progress = (currentPlayerIndex + 1) / players.length;

    // Pass-the-Phone Screen - Matching voting UI style
    if (showPassPhone) {
        return (
            <PhaseTransition key="pass-phone-reveal" type="slide" style={styles.phaseContainer}>
                <View style={styles.votingPassPhoneContainer}>
                    {/* Progress Pills */}
                    <View style={styles.progressPills}>
                        {players.map((_, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.progressPill,
                                    {
                                        backgroundColor: i < currentPlayerIndex
                                            ? theme.colors.primary
                                            : i === currentPlayerIndex
                                                ? theme.colors.primaryContainer
                                                : theme.colors.surfaceVariant,
                                        flex: i === currentPlayerIndex ? 2 : 1,
                                    }
                                ]}
                            />
                        ))}
                    </View>

                    {/* Main Card */}
                    <Surface style={[styles.votingPassCard, { backgroundColor: theme.colors.elevation.level2 }]} elevation={3}>
                        <View style={styles.votingIconContainer}>
                            <Avatar.Icon
                                size={56}
                                icon="eye-outline"
                                style={{ backgroundColor: theme.colors.primaryContainer }}
                                color={theme.colors.primary}
                            />
                        </View>

                        <Text
                            variant="headlineLarge"
                            style={[styles.votingPassTitle, { color: theme.colors.onSurface }]}
                        >
                            Secret Reveal
                        </Text>

                        <View style={styles.votingPlayerBadge}>
                            <PlayerAvatar name={currentPlayer.name} size={72} />
                            <Text
                                variant="titleLarge"
                                style={[styles.votingPlayerName, { color: theme.colors.onSurface }]}
                            >
                                {currentPlayer.name}
                            </Text>
                            <Text
                                variant="bodyMedium"
                                style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}
                            >
                                Player {currentPlayerIndex + 1} of {players.length}
                            </Text>
                        </View>

                        <Text
                            variant="bodyLarge"
                            style={[styles.votingPassSubtitle, { color: theme.colors.onSurfaceVariant }]}
                        >
                            Pass the phone securely
                        </Text>

                        <ScalableButton
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setShowPassPhone(false);
                            }}
                            style={styles.votingPassButton}
                        >
                            <Button
                                mode="contained"
                                style={styles.votingButton}
                                contentStyle={styles.buttonContent}
                                labelStyle={styles.actionButtonLabel}
                                icon="account-check"
                                pointerEvents="none"
                                buttonColor={theme.colors.primary}
                                textColor={theme.colors.onPrimary}
                            >
                                I am {currentPlayer.name}
                            </Button>
                        </ScalableButton>
                    </Surface>
                </View>
            </PhaseTransition>
        );
    }

    // Card Reveal Screen - Matching voting UI header style
    return (
        <PhaseTransition key="reveal-main" type="fade" style={styles.phaseContainer}>
            {/* Header with elegant progress - matching voting UI */}
            <View style={styles.votingHeader}>
                <View style={styles.votingHeaderTop}>
                    <PlayerAvatar name={currentPlayer.name} size={48} />
                    <View style={styles.votingHeaderText}>
                        <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, letterSpacing: 0.5 }}>
                            REVEALING CARD
                        </Text>
                        <Text variant="titleLarge" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>
                            {currentPlayer.name}
                        </Text>
                    </View>
                    <Surface style={[styles.votingProgressBadge, { backgroundColor: theme.colors.primaryContainer }]} elevation={0}>
                        <Text variant="labelLarge" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                            {currentPlayerIndex + 1}/{players.length}
                        </Text>
                    </Surface>
                </View>

                {/* Progress Bar */}
                <View style={styles.votingProgressContainer}>
                    <View
                        style={[
                            styles.votingProgressFill,
                            {
                                backgroundColor: theme.colors.primary,
                                width: `${progress * 100}%`,
                            }
                        ]}
                    />
                </View>
            </View>

            {/* Card Container */}
            <View style={styles.revealContent}>
                <ScalableButton onPressIn={handlePressIn} onPressOut={handlePressOut} style={styles.revealCardContainer} activeScale={1.02}>
                    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                        <Animated.View style={[styles.revealCardFace, styles.revealCardFront, frontAnimatedStyle]}>
                            <Card style={[styles.revealCard, { backgroundColor: theme.colors.elevation.level2, borderColor: theme.colors.outlineVariant, borderWidth: 1 }]} mode="outlined">
                                <Card.Content style={styles.revealCardContent}>
                                    <Avatar.Icon size={56} icon="fingerprint" style={{ backgroundColor: theme.colors.surfaceVariant }} color={theme.colors.primary} />
                                    <Text variant="titleMedium" style={[styles.tapText, { color: theme.colors.primary }]}>TAP & HOLD</Text>
                                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, opacity: 0.7, marginTop: 4 }}>to reveal your role</Text>
                                </Card.Content>
                            </Card>
                        </Animated.View>

                        <Animated.View style={[styles.revealCardFace, styles.revealCardBack, backAnimatedStyle]}>
                            <Card style={[styles.revealCard, (isImposter && imposterWordMode !== 'hidden') ? { backgroundColor: theme.colors.errorContainer, borderColor: theme.colors.error } : { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }, { borderWidth: 1.5, borderRadius: 28 }]} mode="outlined">
                                <Card.Content style={styles.revealCardContent}>
                                    <Avatar.Icon size={56} icon={wordInfo.icon} style={{ backgroundColor: (isImposter && imposterWordMode !== 'hidden') ? theme.colors.error : theme.colors.primaryContainer }} color={(isImposter && imposterWordMode !== 'hidden') ? "white" : theme.colors.primary} />
                                    <Text variant="headlineSmall" style={[styles.wordText, (isImposter && imposterWordMode !== 'hidden') ? { color: theme.colors.error } : { color: theme.colors.onSurface }]}>{wordInfo.title}</Text>
                                    {wordInfo.subtitle && <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', fontWeight: '500' }}>{wordInfo.subtitle}</Text>}
                                </Card.Content>
                            </Card>
                        </Animated.View>
                    </View>
                </ScalableButton>
            </View>

            <Portal>
                <Modal visible={isVerificationModalVisible} dismissable={false} contentContainerStyle={styles.modalContent}>
                    <Card>
                        <Card.Title title="Hint Contribution" subtitle="Enter a hint for the word" left={(props) => <Avatar.Icon {...props} icon="lightbulb" />} />
                        <Card.Content>
                            <Text variant="bodyMedium" style={{ marginBottom: 16 }}>{imposterWordMode === 'hidden' ? "Enter a one-word hint that relates to the secret word." : isImposter ? "Pretend to be typing a hint to blend in. You are the Imposter." : "Enter a one-word hint that relates to the secret word."}</Text>
                            <TextInput mode="outlined" label="Hint Word" value={hintInput} onChangeText={setHintInput} autoFocus style={{ marginBottom: 16 }} />
                            <ScalableButton onPress={() => { if (hintInput.trim().length > 0) { Keyboard.dismiss(); if (!isImposter || imposterWordMode === 'hidden') addHint(hintInput.trim()); setIsVerified(true); setVerificationModalVisible(false); } }} disabled={hintInput.trim().length === 0}>
                                <Button mode="contained" disabled={hintInput.trim().length === 0} pointerEvents="none">Confirm Hint</Button>
                            </ScalableButton>
                        </Card.Content>
                    </Card>
                </Modal>
            </Portal>

            <View style={styles.buttonContainer}>
                <ScalableButton onPress={handleNext} disabled={!hasRotated || !isVerified} style={styles.actionButton}>
                    <Button mode="contained" disabled={!hasRotated || !isVerified} style={styles.fullWidth} contentStyle={styles.buttonContent} labelStyle={styles.actionButtonLabel} icon={isLastPlayer ? 'play' : 'arrow-right-circle'} pointerEvents="none" buttonColor={(hasRotated && isVerified) ? theme.colors.primary : theme.colors.surfaceVariant}>
                        {isLastPlayer ? 'Start Discussion' : `Pass to ${players[revealOrder[currentPlayerIndex + 1]]?.name || 'Next'}`}
                    </Button>
                </ScalableButton>
            </View>
        </PhaseTransition>
    );
}

// --- Discussion View ---
function DiscussionView() {
    const theme = useTheme();
    const { players, startDiscussion, startingPlayerIndex, isVotingEnabled } = useGame();
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
                        icon={isVotingEnabled ? "vote" : "eye-check"}
                        pointerEvents="none"
                    >
                        {isVotingEnabled ? "Start Voting" : "Reveal Imposter"}
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
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setShowPassPhone(false);
    };

    if (!currentVoter) {
        return null;
    }

    // Pass-the-Phone Screen - Elegant handoff design
    if (showPassPhone) {
        return (
            <PhaseTransition key="pass-phone-voting" type="slide" style={styles.phaseContainer}>
                <View style={styles.votingPassPhoneContainer}>
                    {/* Progress Pills */}
                    <View style={styles.progressPills}>
                        {players.map((_, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.progressPill,
                                    {
                                        backgroundColor: i < currentVoterIndex
                                            ? theme.colors.primary
                                            : i === currentVoterIndex
                                                ? theme.colors.primaryContainer
                                                : theme.colors.surfaceVariant,
                                        flex: i === currentVoterIndex ? 2 : 1,
                                    }
                                ]}
                            />
                        ))}
                    </View>

                    {/* Main Card */}
                    <Surface style={[styles.votingPassCard, { backgroundColor: theme.colors.elevation.level2 }]} elevation={3}>
                        <View style={styles.votingIconContainer}>
                            <Avatar.Icon
                                size={56}
                                icon="vote"
                                style={{ backgroundColor: theme.colors.primaryContainer }}
                                color={theme.colors.primary}
                            />
                        </View>

                        <Text
                            variant="headlineLarge"
                            style={[styles.votingPassTitle, { color: theme.colors.onSurface }]}
                        >
                            Time to Vote
                        </Text>

                        <View style={styles.votingPlayerBadge}>
                            <PlayerAvatar name={currentVoter.name} size={72} />
                            <Text
                                variant="titleLarge"
                                style={[styles.votingPlayerName, { color: theme.colors.onSurface }]}
                            >
                                {currentVoter.name}
                            </Text>
                            <Text
                                variant="bodyMedium"
                                style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}
                            >
                                Voter {currentVoterIndex + 1} of {players.length}
                            </Text>
                        </View>

                        <Text
                            variant="bodyLarge"
                            style={[styles.votingPassSubtitle, { color: theme.colors.onSurfaceVariant }]}
                        >
                            Pass the phone securely
                        </Text>

                        <ScalableButton
                            onPress={handlePassPhone}
                            style={styles.votingPassButton}
                        >
                            <Button
                                mode="contained"
                                style={styles.votingButton}
                                contentStyle={styles.buttonContent}
                                labelStyle={styles.actionButtonLabel}
                                icon="account-check"
                                pointerEvents="none"
                                buttonColor={theme.colors.primary}
                                textColor={theme.colors.onPrimary}
                            >
                                I am {currentVoter.name}
                            </Button>
                        </ScalableButton>
                    </Surface>
                </View>
            </PhaseTransition>
        );
    }

    // Vote Selection Screen - Premium vertical list
    return (
        <PhaseTransition type="fade" style={styles.phaseContainer}>
            {/* Header with elegant progress */}
            <View style={styles.votingHeader}>
                <View style={styles.votingHeaderTop}>
                    <PlayerAvatar name={currentVoter.name} size={48} />
                    <View style={styles.votingHeaderText}>
                        <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, letterSpacing: 0.5 }}>
                            CASTING VOTE
                        </Text>
                        <Text variant="titleLarge" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>
                            {currentVoter.name}
                        </Text>
                    </View>
                    <Surface style={[styles.votingProgressBadge, { backgroundColor: theme.colors.primaryContainer }]} elevation={0}>
                        <Text variant="labelLarge" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                            {currentVoterIndex + 1}/{players.length}
                        </Text>
                    </Surface>
                </View>

                {/* Progress Bar */}
                <View style={styles.votingProgressContainer}>
                    <View
                        style={[
                            styles.votingProgressFill,
                            {
                                backgroundColor: theme.colors.primary,
                                width: `${progress * 100}%`,
                            }
                        ]}
                    />
                </View>
            </View>

            {/* Question Prompt */}
            <View style={styles.votingPromptContainer}>
                <Avatar.Icon
                    size={40}
                    icon="help-circle"
                    style={{ backgroundColor: theme.colors.tertiaryContainer }}
                    color={theme.colors.tertiary}
                />
                <Text variant="headlineSmall" style={[styles.votingPromptText, { color: theme.colors.onSurface }]}>
                    Who is the Imposter?
                </Text>
            </View>

            {/* Vote Targets - Premium Vertical List */}
            <ScrollView
                style={styles.votingList}
                contentContainerStyle={styles.votingListContent}
                showsVerticalScrollIndicator={false}
            >
                {players
                    .filter(p => p.id !== currentVoter.id)
                    .map((p, index) => {
                        const isSelected = selectedTarget === p.id;
                        return (
                            <Animated.View
                                key={p.id}
                                entering={FadeInDown.delay(index * 80).duration(400).springify()}
                            >
                                <ScalableButton
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        setSelectedTarget(p.id);
                                    }}
                                    activeScale={0.98}
                                >
                                    <Surface
                                        style={[
                                            styles.votingTargetCard,
                                            {
                                                backgroundColor: isSelected
                                                    ? theme.colors.primaryContainer
                                                    : theme.colors.elevation.level1,
                                                borderColor: isSelected
                                                    ? theme.colors.primary
                                                    : 'transparent',
                                                borderWidth: isSelected ? 2 : 0,
                                            }
                                        ]}
                                        elevation={isSelected ? 3 : 1}
                                    >
                                        <PlayerAvatar
                                            name={p.name}
                                            size={52}
                                        />
                                        <View style={styles.votingTargetInfo}>
                                            <Text
                                                variant="titleMedium"
                                                style={{
                                                    fontWeight: isSelected ? 'bold' : '600',
                                                    color: isSelected ? theme.colors.primary : theme.colors.onSurface,
                                                }}
                                            >
                                                {p.name}
                                            </Text>
                                            <Text
                                                variant="bodySmall"
                                                style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}
                                            >
                                                {p.score} points
                                            </Text>
                                        </View>
                                        <Avatar.Icon
                                            size={32}
                                            icon={isSelected ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                                            style={{ backgroundColor: 'transparent' }}
                                            color={isSelected ? theme.colors.primary : theme.colors.outline}
                                        />
                                    </Surface>
                                </ScalableButton>
                            </Animated.View>
                        );
                    })}
                <View style={{ height: 100 }} />
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
                        icon={isLastVoter ? 'gavel' : 'arrow-right-circle'}
                        pointerEvents="none"
                        buttonColor={selectedTarget ? theme.colors.primary : theme.colors.surfaceVariant}
                    >
                        {isLastVoter
                            ? 'Submit Final Vote'
                            : `Vote & Pass to ${nextVoterName}`
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
        isVotingEnabled,
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
                {isVotingEnabled && (
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
                )}

                {!isVotingEnabled && (
                    <Card
                        style={[styles.resultBanner, {
                            backgroundColor: theme.colors.secondaryContainer,
                            borderRadius: 28
                        }]}
                        mode="contained"
                    >
                        <Card.Content style={styles.resultBannerContent}>
                            <Avatar.Icon
                                size={80}
                                icon="eye-outline"
                                style={{
                                    backgroundColor: theme.colors.secondary
                                }}
                                color={theme.colors.onSecondary}
                            />
                            <Text
                                variant="displaySmall"
                                style={{
                                    marginTop: 20,
                                    fontWeight: 'bold',
                                    color: theme.colors.secondary
                                }}
                            >
                                Imposter Revealed!
                            </Text>
                        </Card.Content>
                    </Card>
                )}

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
                                    {imposterWordMode === 'no_hint' ? 'IMPOSTER WORD' : 'FALSE WORD'}
                                </Text>
                                <Text variant="headlineSmall" style={{ color: theme.colors.error, fontWeight: 'bold' }}>
                                    {imposterWordMode === 'no_hint' ? '???' : imposterWord}
                                </Text>
                            </View>
                        </View>
                    </Card.Content>
                </Card>

                {/* Leaderboard */}
                {isVotingEnabled && (
                    <>
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
                    </>
                )}

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
        textAlign: 'center',
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
    // Reveal Styles
    revealHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    revealContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingBottom: 90, // Account for floating button (54px) + bottom margin (24px) + extra spacing
    },
    revealCardContainer: {
        width: '100%',
        aspectRatio: 0.72,
        maxWidth: 300,
    },
    revealCardFace: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        backfaceVisibility: 'hidden',
    },
    revealCardFront: {
        zIndex: 2,
    },
    revealCardBack: {
        zIndex: 1,
    },
    revealCard: {
        flex: 1,
        justifyContent: 'center',
        borderRadius: 28,
    },
    revealCardContent: {
        alignItems: 'center',
        padding: 24,
    },
    tapText: {
        marginTop: 16,
        fontWeight: 'bold',
        letterSpacing: 1.5,
        textAlign: 'center',
    },
    wordText: {
        marginTop: 20,
        marginBottom: 8,
        fontWeight: 'bold',
        textAlign: 'center',
        textTransform: 'uppercase',
    },
    modalContent: {
        padding: 20,
    },
    // New Voting UI Styles
    votingPassPhoneContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    progressPills: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 24,
        paddingHorizontal: 40,
    },
    progressPill: {
        height: 6,
        borderRadius: 3,
    },
    votingPassCard: {
        width: '100%',
        padding: 32,
        alignItems: 'center',
        borderRadius: 32,
    },
    votingIconContainer: {
        marginBottom: 16,
    },
    votingPassTitle: {
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 24,
    },
    votingPlayerBadge: {
        alignItems: 'center',
        marginBottom: 24,
    },
    votingPlayerName: {
        fontWeight: 'bold',
        marginTop: 12,
    },
    votingPassSubtitle: {
        textAlign: 'center',
        marginBottom: 8,
    },
    votingPassButton: {
        marginTop: 24,
        width: '100%',
    },
    votingButton: {
        width: '100%',
        height: 54,
        borderRadius: 16,
    },
    votingHeader: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    votingHeaderTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    votingHeaderText: {
        flex: 1,
        marginLeft: 16,
    },
    votingProgressBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    votingProgressContainer: {
        height: 4,
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    votingProgressFill: {
        height: '100%',
        borderRadius: 2,
    },
    votingPromptContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 16,
        gap: 12,
    },
    votingPromptText: {
        fontWeight: 'bold',
    },
    votingList: {
        flex: 1,
    },
    votingListContent: {
        paddingHorizontal: 20,
        gap: 12,
    },
    votingTargetCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        gap: 16,
    },
    votingTargetInfo: {
        flex: 1,
    },
});
