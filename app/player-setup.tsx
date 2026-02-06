/**
 * Player Setup Screen - Pass-the-phone player registration
 */

import { PlayerAvatar } from '@/components/ui/PlayerAvatar';
import { GamePhase, useGame } from '@/contexts/game-context';
import * as Haptics from 'expo-haptics';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
    Avatar,
    Button,
    Card,
    Chip,
    IconButton,
    List,
    Text,
    TextInput,
    useTheme
} from 'react-native-paper';

export default function PlayerSetupScreen() {
    const theme = useTheme();
    const {
        players,
        addPlayer,
        removePlayer,
        phase,
        completePlayerSetup,
        startGame,
    } = useGame();

    const [currentName, setCurrentName] = useState('');
    const [isEntering, setIsEntering] = useState(true);

    const handleAddPlayer = () => {
        if (currentName.trim()) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            addPlayer(currentName.trim());
            setCurrentName('');
            setIsEntering(false);
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    const handleNextPlayer = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsEntering(true);
    };

    const handleStartGame = () => {
        if (players.length >= 3) {
            startGame();
            router.replace('/reveal');
        }
    };

    const canStartGame = players.length >= 3;
    const isInitialSetup = phase === GamePhase.PLAYER_SETUP;

    // Redirect if not in player setup or lobby setup phase
    if (phase !== GamePhase.PLAYER_SETUP && phase !== GamePhase.SETUP && phase !== GamePhase.REVEAL) {
        return <Redirect href="/(tabs)" />;
    }

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text variant="displaySmall" style={[styles.title, { color: theme.colors.primary }]}>
                        Player Setup
                    </Text>
                    <Text variant="titleMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant, opacity: 0.8 }]}>
                        Add everyone to get started
                    </Text>
                </View>

                {/* Current Player Input */}
                {isEntering ? (
                    <Card style={styles.inputCard} mode="elevated">
                        <Card.Content style={{ padding: 8 }}>
                            <View style={{ alignItems: 'center', marginBottom: 20 }}>
                                <Avatar.Icon
                                    size={56}
                                    icon="account-plus"
                                    style={{ backgroundColor: theme.colors.primaryContainer }}
                                    color={theme.colors.onPrimaryContainer}
                                />
                                <Text variant="headlineSmall" style={{ marginTop: 12, fontWeight: 'bold' }}>
                                    Player {players.length + 1}
                                </Text>
                            </View>

                            <TextInput
                                mode="outlined"
                                label="Enter Name"
                                placeholder="e.g. Charlie"
                                value={currentName}
                                onChangeText={setCurrentName}
                                autoFocus
                                onSubmitEditing={handleAddPlayer}
                                style={styles.input}
                                outlineStyle={{ borderRadius: 16 }}
                            />
                            <Button
                                mode="contained"
                                onPress={handleAddPlayer}
                                disabled={!currentName.trim()}
                                style={styles.addButton}
                                contentStyle={{ height: 56 }}
                                labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
                                icon="check"
                            >
                                Confirm & Pass
                            </Button>
                        </Card.Content>
                    </Card>
                ) : (
                    <Card style={styles.inputCard} mode="elevated">
                        <Card.Content style={styles.passPhoneCard}>
                            <Avatar.Icon
                                size={80}
                                icon="cellphone-arrow-down"
                                style={{ backgroundColor: theme.colors.primaryContainer }}
                            />
                            <Text variant="headlineSmall" style={{ marginTop: 24, textAlign: 'center', fontWeight: 'bold' }}>
                                Pass the phone
                            </Text>
                            <Text
                                variant="bodyLarge"
                                style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 12 }}
                            >
                                Hand the device to the next player
                            </Text>
                            <Button
                                mode="contained"
                                onPress={handleNextPlayer}
                                style={{ marginTop: 32, width: '100%' }}
                                contentStyle={{ height: 56 }}
                                labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
                                icon="account-arrow-right"
                            >
                                I have the phone
                            </Button>
                        </Card.Content>
                    </Card>
                )}

                {/* Enrolled Players */}
                {players.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text variant="titleMedium">
                                Enrolled Players
                            </Text>
                            <Chip icon="account-group" mode="flat">
                                {players.length}
                            </Chip>
                        </View>
                        <Card mode="contained" style={{ borderRadius: 28 }}>
                            {players.map((player, index) => (
                                <List.Item
                                    key={player.id}
                                    title={player.name}
                                    titleStyle={{ fontWeight: '600' }}
                                    description={`Player ${index + 1}`}
                                    left={props => (
                                        <View style={{ justifyContent: 'center', paddingLeft: 25 }}>
                                            <PlayerAvatar
                                                name={player.name}
                                                size={44}
                                            />
                                        </View>
                                    )}
                                    right={props => (
                                        <IconButton
                                            {...props}
                                            icon="delete-outline"
                                            iconColor={theme.colors.error}
                                            onPress={() => {
                                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                                removePlayer(player.id);
                                            }}
                                        />
                                    )}
                                />
                            ))}
                        </Card>
                    </View>
                )}

                {/* Minimum Players Notice */}
                {players.length < 3 && players.length > 0 && (
                    <Card style={styles.noticeCard} mode="outlined">
                        <Card.Content style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Avatar.Icon
                                size={40}
                                icon="information"
                                style={{ backgroundColor: theme.colors.secondaryContainer }}
                            />
                            <Text
                                variant="bodyMedium"
                                style={{ marginLeft: 12, flex: 1, color: theme.colors.onSurfaceVariant }}
                            >
                                Need at least {3 - players.length} more player{3 - players.length > 1 ? 's' : ''} to start
                            </Text>
                        </Card.Content>
                    </Card>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Start Game / Actions Button */}
            <View style={styles.buttonContainer}>
                <Button
                    mode="contained"
                    onPress={isInitialSetup ? handleStartGame : () => router.back()}
                    disabled={isInitialSetup && !canStartGame}
                    style={styles.startButton}
                    contentStyle={styles.startButtonContent}
                    labelStyle={styles.startButtonLabel}
                    icon={isInitialSetup ? "play" : "check"}
                    buttonColor={canStartGame ? theme.colors.primary : theme.colors.surfaceVariant}
                    textColor={canStartGame ? theme.colors.onPrimary : theme.colors.onSurfaceVariant}
                >
                    {isInitialSetup
                        ? `Start Match • ${players.length} Players`
                        : "Done"
                    }
                </Button>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingTop: 60,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        textAlign: 'center',
    },
    inputCard: {
        marginBottom: 24,
        borderRadius: 28,
        padding: 8,
    },
    cardTitle: {
        marginBottom: 8,
    },
    input: {
        marginBottom: 20,
        backgroundColor: 'transparent',
    },
    addButton: {
        borderRadius: 16,
    },
    passPhoneCard: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 8,
    },
    noticeCard: {
        marginBottom: 24,
        borderRadius: 20,
    },
    buttonContainer: {
        position: 'absolute',
        bottom: 32,
        left: 0,
        right: 0,
        marginHorizontal: 20,
        height: 64,
    },
    startButton: {
        flex: 1,
        borderRadius: 32,
        elevation: 4,
    },
    startButtonContent: {
        height: '100%',
        flexDirection: 'row-reverse',
    },
    startButtonLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
});
