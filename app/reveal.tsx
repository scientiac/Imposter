/**
 * Word Reveal Screen - Pass-the-phone word reveal using React Native Paper
 * Uses Reanimated for flash card flip animation
 */

import { PhaseTransition } from '@/components/animated/PhaseTransition';
import { ScalableButton } from '@/components/animated/ScalableButton';
import { PlayerAvatar } from '@/components/ui/PlayerAvatar';
import { Layout } from '@/constants/theme';
import { GamePhase, useGame } from '@/contexts/game-context';
import * as Haptics from 'expo-haptics';
import { Redirect } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
    Avatar,
    Button,
    Card,
    Modal,
    Portal,
    Surface,
    Text,
    TextInput,
    useTheme
} from 'react-native-paper';
import Animated, {
    Extrapolation,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

export default function RevealScreen() {
    const theme = useTheme();
    const {
        currentPlayerIndex,
        players,
        getPlayerWord,
        revealWord,
        nextPlayerReveal,
        isPlayerImposter,
        phase,
        imposterWordMode,
        allHints,
        addHint,
        revealPass,
        revealOrder,
    } = useGame();

    const [verificationInput, setVerificationInput] = useState('');
    const [isVerificationModalVisible, setVerificationModalVisible] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [hintInput, setHintInput] = useState('');
    const [showPassPhone, setShowPassPhone] = useState(true);
    const revealTimeoutRef = useRef<any>(null);

    const rotation = useSharedValue(0);

    // Animated Styles
    const frontAnimatedStyle = useAnimatedStyle(() => {
        const rotateValue = interpolate(
            rotation.value,
            [0, 180],
            [0, 180],
            Extrapolation.CLAMP
        );
        const scale = interpolate(
            rotation.value,
            [0, 90, 180],
            [1, 1.1, 1],
            Extrapolation.CLAMP
        );
        const opacity = interpolate(
            rotation.value,
            [89, 90, 91],
            [1, 0, 0],
            Extrapolation.CLAMP
        );
        return {
            transform: [
                { perspective: 1200 },
                { rotateY: `${rotateValue}deg` },
                { scale }
            ],
            opacity,
            zIndex: rotation.value < 90 ? 2 : 1,
            elevation: rotation.value === 0 ? 4 : 0,
        };
    });

    const backAnimatedStyle = useAnimatedStyle(() => {
        const rotateValue = interpolate(
            rotation.value,
            [0, 180],
            [180, 360],
            Extrapolation.CLAMP
        );
        const scale = interpolate(
            rotation.value,
            [0, 90, 180],
            [1, 1.1, 1],
            Extrapolation.CLAMP
        );
        const opacity = interpolate(
            rotation.value,
            [89, 90, 91],
            [0, 0, 1],
            Extrapolation.CLAMP
        );
        return {
            transform: [
                { perspective: 1200 },
                { rotateY: `${rotateValue}deg` },
                { scale }
            ],
            opacity,
            zIndex: rotation.value >= 90 ? 2 : 1,
            elevation: rotation.value === 180 ? 4 : 0,
        };
    });

    if (phase !== GamePhase.REVEAL) {
        return <Redirect href="/game" />;
    }

    // Determine current player safely
    const actualPlayerIndex = revealOrder && revealOrder.length > 0
        ? revealOrder[currentPlayerIndex]
        : currentPlayerIndex;

    const currentPlayer = players[actualPlayerIndex];

    if (!currentPlayer) {
        return <Redirect href="/(tabs)" />;
    }

    const isLastPlayer = currentPlayerIndex === players.length - 1;
    const isImposter = isPlayerImposter(actualPlayerIndex);
    const playerWord = getPlayerWord(actualPlayerIndex);
    const progress = (currentPlayerIndex + 1) / players.length;

    const availableHints = allHints.filter(h => h.trim().length > 0);
    const randomHint = availableHints.length > 0
        ? availableHints[Math.floor(Math.random() * availableHints.length)]
        : null;

    const handlePressIn = () => {
        // Start a 500ms timer for reveal
        revealTimeoutRef.current = setTimeout(() => {
            rotation.value = withTiming(180, { duration: 400 });
            revealWord(actualPlayerIndex);

            // Trigger haptic feedback
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            revealTimeoutRef.current = null;
        }, 500);
    };

    const handlePressOut = () => {
        // Clear timeout if released before 500ms
        if (revealTimeoutRef.current) {
            clearTimeout(revealTimeoutRef.current);
            revealTimeoutRef.current = null;
        }

        rotation.value = withTiming(0, { duration: 400 });

        // Auto-verify in Pass 1, Modal in Pass 2
        if (revealPass === 1) {
            setIsVerified(true);
        } else {
            // Pass 2: Everyone must provide a hint
            if (!isVerified) {
                setTimeout(() => setVerificationModalVisible(true), 300);
            }
        }
    };

    const handlePassPhone = () => {
        setShowPassPhone(false);
    };

    const handleNext = () => {
        // If in pass 2 and not verified, open modal (safety check)
        if (revealPass === 2 && !isVerified) {
            setVerificationModalVisible(true);
            return;
        }

        // Reset local state for next player
        setVerificationInput('');
        setHintInput('');
        setIsVerified(false);
        setVerificationModalVisible(false);

        nextPlayerReveal();
        setShowPassPhone(true);
    };

    const getWordDisplay = () => {
        if (revealPass === 1) {
            if (isImposter && (imposterWordMode === 'no_word' || imposterWordMode === 'hint_mode')) {
                return {
                    title: 'Imposter',
                    subtitle: 'Role: Imposter',
                    icon: 'incognito',
                };
            }

            return {
                title: playerWord,
                subtitle: isImposter ? 'Role: Imposter' : 'Secret Word',
                icon: isImposter ? 'incognito' : 'eye',
            };
        }

        // Pass 2: Hint Injection
        if (isImposter) {
            return {
                title: 'Hint Phase',
                subtitle: randomHint
                    ? `Hint: ${randomHint}`
                    : 'Provide a hint for the Imposter', // Disguise if first/unlucky
                icon: 'lightbulb-on',
            };
        }

        return {
            title: 'Hint Phase',
            subtitle: 'Provide a hint for the Imposter',
            icon: 'lightbulb',
        };
    };

    if (showPassPhone) {
        return (
            <PhaseTransition key="pass-phone" type="slide">
                <View style={styles.passPhoneContainer}>
                    <Surface style={styles.passPhoneCard} elevation={2}>
                        <PlayerAvatar name={currentPlayer.name} size={80} />
                        <Text variant="displaySmall" style={[styles.phaseTitle, { marginTop: 28, color: theme.colors.primary }]}>
                            Pass the Phone
                        </Text>

                        <Text variant="titleLarge" style={{ color: theme.colors.primary, fontWeight: 'bold', marginTop: 12 }}>
                            To: {currentPlayer.name}
                        </Text>

                        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 16 }}>
                            Please hand the device to the next player securely.
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
                                labelStyle={styles.buttonLabel}
                                icon="account-arrow-right"
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

    const wordInfo = getWordDisplay();
    const isHintPhase = revealPass === 2;

    return (
        <PhaseTransition key="reveal-main" type="fade">
            <View style={styles.container}>
                {/* Progress Header */}
                <View style={[styles.header, { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, alignItems: 'center' }]}>
                    {/* Dots Progress Indicator */}
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                        {players.map((_, i) => (
                            <View
                                key={i}
                                style={{
                                    width: i === currentPlayerIndex ? 24 : 8,
                                    height: 8,
                                    borderRadius: 4,
                                    backgroundColor: i === currentPlayerIndex
                                        ? theme.colors.primary
                                        : theme.colors.surfaceVariant,
                                    opacity: i === currentPlayerIndex ? 1 : 0.6
                                }}
                            />
                        ))}
                    </View>
                    <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>
                        Player {currentPlayerIndex + 1} of {players.length}
                    </Text>
                </View>

                {/* Main Content */}
                <View style={[styles.content, {
                    justifyContent: 'center',
                    paddingTop: 110, // Adjusted to keep card top fixed while it grows
                    paddingBottom: 80
                }]}>
                    <View style={{ alignItems: 'center', marginBottom: 40 }}>
                        <PlayerAvatar name={currentPlayer.name} size={64} style={{ marginBottom: 16 }} />
                        <Text variant="headlineMedium" style={[styles.playerName, { color: theme.colors.onSurface, fontWeight: 'bold' }]}>
                            {currentPlayer.name}
                        </Text>
                    </View>
                    <ScalableButton
                        onPressIn={handlePressIn}
                        onPressOut={handlePressOut}
                        style={[styles.cardContainer, { maxWidth: 320, aspectRatio: 0.8 }]}
                        activeScale={1.02}
                    >
                        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                            {/* Front Face (Cover) */}
                            <Animated.View style={[styles.cardFace, styles.cardFront, frontAnimatedStyle]}>
                                <Card
                                    style={[styles.card, { backgroundColor: theme.colors.elevation.level2, borderColor: theme.colors.outlineVariant, borderWidth: 1 }]}
                                    mode="outlined"
                                >
                                    <Card.Content style={styles.cardContent}>
                                        <Avatar.Icon
                                            size={64}
                                            icon="fingerprint"
                                            style={{ backgroundColor: theme.colors.surfaceVariant }}
                                            color={theme.colors.primary}
                                        />
                                        <Text
                                            variant="titleLarge"
                                            style={[styles.tapText, { color: theme.colors.primary, opacity: 0.9, textAlign: 'center', width: '100%' }]}
                                        >
                                            SECRET CARD
                                        </Text>
                                        <Text
                                            variant="bodyMedium"
                                            style={{ color: theme.colors.onSurfaceVariant, opacity: 0.7, marginTop: 4, textAlign: 'center', width: '100%' }}
                                        >
                                            Tap & Hold
                                        </Text>
                                    </Card.Content>
                                </Card>
                            </Animated.View>

                            {/* Back Face (Word) */}
                            <Animated.View style={[styles.cardFace, styles.cardBack, backAnimatedStyle]}>
                                <Card
                                    style={[
                                        styles.card,
                                        isImposter
                                            ? { backgroundColor: theme.colors.errorContainer, borderColor: theme.colors.error }
                                            : { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant },
                                        { borderWidth: 1.5, borderRadius: 28 }
                                    ]}
                                    mode="outlined"
                                >
                                    <Card.Content style={styles.cardContent}>
                                        <Avatar.Icon
                                            size={72}
                                            icon={wordInfo.icon}
                                            style={{
                                                backgroundColor: isImposter
                                                    ? theme.colors.error
                                                    : theme.colors.primaryContainer
                                            }}
                                            color={isImposter ? "white" : theme.colors.primary}
                                        />
                                        <Text
                                            variant="headlineMedium"
                                            style={[
                                                styles.wordText,
                                                isImposter ? { color: theme.colors.error } : { color: theme.colors.onSurface }
                                            ]}
                                        >
                                            {wordInfo.title}
                                        </Text>
                                        <Text
                                            variant="bodyLarge"
                                            style={{
                                                color: theme.colors.onSurfaceVariant,
                                                textAlign: 'center',
                                                fontWeight: '500'
                                            }}
                                        >
                                            {wordInfo.subtitle}
                                        </Text>
                                    </Card.Content>
                                </Card>
                            </Animated.View>
                        </View>
                    </ScalableButton>

                    {/* Verification / Hint Modal */}
                    <Portal>
                        <Modal
                            visible={isVerificationModalVisible}
                            dismissable={false}
                            contentContainerStyle={styles.modalContent}
                        >
                            <Card>
                                <Card.Title
                                    title={isHintPhase ? "Hint Contribution" : "Quick Verification"}
                                    subtitle={isHintPhase ? "Enter a hint for the Imposter" : "Prove you paid attention"}
                                    left={(props) => <Avatar.Icon {...props} icon={isHintPhase ? "lightbulb" : "lock"} />}
                                />
                                <Card.Content>
                                    <Text variant="bodyMedium" style={{ marginBottom: 16 }}>
                                        {isHintPhase
                                            ? isImposter
                                                ? !randomHint
                                                    ? "You are unlucky this time! You are the first person pretending to type the hint. Pretend to be typing a hint to blend in, you are the Imposter."
                                                    : "Pretend to be typing a hint, you are the Imposter. Type anything to blend in."
                                                : "Enter a one-word hint that relates to the secret word."
                                            : "Type the secret word you just saw to confirm you remember it."
                                        }
                                    </Text>

                                    <TextInput
                                        mode="outlined"
                                        label={isHintPhase ? "Hint Word" : "Secret Word"}
                                        value={isHintPhase ? hintInput : verificationInput}
                                        onChangeText={isHintPhase ? setHintInput : setVerificationInput}
                                        autoFocus
                                        style={{ marginBottom: 16 }}
                                    />

                                    <ScalableButton
                                        onPress={() => {
                                            if (isHintPhase) {
                                                if (hintInput.trim().length > 0) {
                                                    if (!isImposter) {
                                                        addHint(hintInput.trim());
                                                    }
                                                    setIsVerified(true);
                                                    setVerificationModalVisible(false);
                                                }
                                            } else {
                                                if (verificationInput.trim().length > 0) {
                                                    setIsVerified(true);
                                                    setVerificationModalVisible(false);
                                                }
                                            }
                                        }}
                                        disabled={(isHintPhase ? hintInput : verificationInput).trim().length === 0}
                                    >
                                        <Button
                                            mode="contained"
                                            disabled={(isHintPhase ? hintInput : verificationInput).trim().length === 0}
                                            pointerEvents="none"
                                        >
                                            Confirm
                                        </Button>
                                    </ScalableButton>
                                </Card.Content>
                            </Card>
                        </Modal>
                    </Portal>
                </View>

                {/* Next Button */}
                <View style={styles.buttonContainer}>
                    <ScalableButton
                        onPress={handleNext}
                        disabled={!isVerified}
                        style={styles.nextButton}
                    >
                        <Button
                            mode="contained"
                            disabled={!isVerified}
                            style={{ flex: 1, borderRadius: 32, height: '100%', justifyContent: 'center' }}
                            contentStyle={styles.buttonContent}
                            labelStyle={styles.buttonLabel}
                            icon={isLastPlayer ? 'play' : 'cellphone-arrow-down'}
                            pointerEvents="none"
                            buttonColor={isVerified ? theme.colors.primary : theme.colors.surfaceVariant}
                        >
                            {isLastPlayer
                                ? isHintPhase
                                    ? 'Reveal Results'
                                    : imposterWordMode === 'hint_mode'
                                        ? 'Go to Hint Round'
                                        : 'Start Match'
                                : `Pass to ${players[revealOrder[currentPlayerIndex + 1]]?.name || 'Next'}`
                            }
                        </Button>
                    </ScalableButton>
                </View>
            </View>
        </PhaseTransition>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 16,
    },
    progressBar: {
        marginTop: 12,
        height: 6,
        borderRadius: 3,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        padding: 20,
        paddingTop: 40,
    },
    playerName: {
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    instruction: {
        marginBottom: 60,
        textAlign: 'center',
    },
    cardContainer: {
        width: '100%',
        aspectRatio: 0.8,
        maxWidth: 320,
        marginVertical: 20,
    },
    cardFace: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        backfaceVisibility: 'hidden',
    },
    cardFront: {
        zIndex: 2,
    },
    cardBack: {
        zIndex: 1,
    },
    card: {
        flex: 1,
        justifyContent: 'center',
        borderRadius: 28,
    },
    cardContent: {
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
    nextButton: {
        flex: 1,
        borderRadius: Layout.floatingBar.borderRadius,
        height: '100%',
        justifyContent: 'center',
    },
    buttonContent: {
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row-reverse', // Icon on the right
    },
    buttonLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
        textAlign: 'center',
    },
    modalContent: {
        padding: 20,
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
        borderRadius: 28,
    },
    phaseTitle: {
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
});
