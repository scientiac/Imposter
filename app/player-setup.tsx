/**
 * Player Setup Screen - Pass-the-phone player registration
 */

import { GamePhase, useGame } from '@/contexts/game-context';
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
    Surface,
    Text,
    TextInput,
    useTheme,
} from 'react-native-paper';

export default function PlayerSetupScreen() {
    const theme = useTheme();
    const {
        players,
        addPlayer,
        removePlayer,
        phase,
        completePlayerSetup,
    } = useGame();

    const [currentName, setCurrentName] = useState('');
    const [isEntering, setIsEntering] = useState(true);

    const handleAddPlayer = () => {
        if (currentName.trim()) {
            addPlayer(currentName.trim());
            setCurrentName('');
            setIsEntering(false);
        }
    };

    const handleNextPlayer = () => {
        setIsEntering(true);
    };

    const handleStartGame = () => {
        if (players.length >= 3) {
            completePlayerSetup();
            router.replace('/(tabs)');
        }
    };

    const canStartGame = players.length >= 3;
    const isInitialSetup = phase === GamePhase.PLAYER_SETUP;

    // Redirect if not in player setup or lobby setup phase
    if (phase !== GamePhase.PLAYER_SETUP && phase !== GamePhase.SETUP) {
        return <Redirect href="/(tabs)" />;
    }

    return (
        <Surface style={styles.container}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text variant="headlineLarge" style={styles.title}>
                        Player Setup
                    </Text>
                    <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                        Pass the phone to each player to enter their name
                    </Text>
                </View>

                {/* Current Player Input */}
                {isEntering ? (
                    <Card style={styles.inputCard} mode="elevated">
                        <Card.Content>
                            <Text variant="titleMedium" style={styles.cardTitle}>
                                Player {players.length + 1}
                            </Text>
                            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 16 }}>
                                Enter your name and pass the phone to the next player
                            </Text>
                            <TextInput
                                mode="outlined"
                                label="Your Name"
                                value={currentName}
                                onChangeText={setCurrentName}
                                autoFocus
                                onSubmitEditing={handleAddPlayer}
                                style={styles.input}
                                left={<TextInput.Icon icon="account" />}
                            />
                            <Button
                                mode="contained"
                                onPress={handleAddPlayer}
                                disabled={!currentName.trim()}
                                style={styles.addButton}
                                icon="check"
                            >
                                Confirm Name
                            </Button>
                        </Card.Content>
                    </Card>
                ) : (
                    <Card style={styles.inputCard} mode="elevated">
                        <Card.Content style={styles.passPhoneCard}>
                            <Avatar.Icon
                                size={64}
                                icon="cellphone-arrow-down"
                                style={{ backgroundColor: theme.colors.primaryContainer }}
                            />
                            <Text variant="titleLarge" style={{ marginTop: 16, textAlign: 'center' }}>
                                Pass the phone
                            </Text>
                            <Text
                                variant="bodyMedium"
                                style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 8 }}
                            >
                                Hand the phone to the next player
                            </Text>
                            <Button
                                mode="contained"
                                onPress={handleNextPlayer}
                                style={{ marginTop: 24 }}
                                icon="account-plus"
                            >
                                Next Player
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
                        <Card mode="outlined">
                            {players.map((player, index) => (
                                <List.Item
                                    key={player.id}
                                    title={player.name}
                                    description={`Player ${index + 1}`}
                                    left={props => (
                                        <Avatar.Text
                                            {...props}
                                            size={40}
                                            label={player.name.charAt(0).toUpperCase()}
                                        />
                                    )}
                                    right={props =>
                                        players.length > 3 && (
                                            <IconButton
                                                {...props}
                                                icon="close-circle-outline"
                                                iconColor={theme.colors.error}
                                                onPress={() => removePlayer(player.id)}
                                            />
                                        )
                                    }
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
            <Surface style={styles.buttonContainer} elevation={4}>
                <Button
                    mode="contained"
                    onPress={isInitialSetup ? handleStartGame : () => router.back()}
                    disabled={isInitialSetup && !canStartGame}
                    style={styles.startButton}
                    contentStyle={styles.startButtonContent}
                    icon={isInitialSetup ? "play" : "check"}
                >
                    {isInitialSetup
                        ? `Start Game with ${players.length} Players`
                        : "Return to Lobby"
                    }
                </Button>
            </Surface>
        </Surface>
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
    },
    cardTitle: {
        marginBottom: 8,
    },
    input: {
        marginBottom: 16,
    },
    addButton: {
        marginTop: 8,
    },
    passPhoneCard: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    noticeCard: {
        marginBottom: 24,
    },
    buttonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingBottom: 34,
    },
    startButton: {
        borderRadius: 12,
    },
    startButtonContent: {
        paddingVertical: 8,
    },
});
