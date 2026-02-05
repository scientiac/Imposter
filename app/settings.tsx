/**
 * Game Settings Screen - Configure imposter modes and game options
 */

import { ImposterWordMode, useGame } from '@/contexts/game-context';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
    Button,
    Divider,
    IconButton,
    List,
    RadioButton,
    Surface,
    Switch,
    Text,
    useTheme,
} from 'react-native-paper';

export default function SettingsScreen() {
    const theme = useTheme();
    const {
        imposterCount,
        imposterWordMode,
        randomizeStartingPlayer,
        players,
        setImposterCount,
        setImposterWordMode,
        setRandomizeStartingPlayer,
    } = useGame();

    const maxImposters = Math.max(1, Math.floor(players.length / 3));

    const handleWordModeChange = (value: string) => {
        setImposterWordMode(value as ImposterWordMode);
    };

    return (
        <Surface style={styles.container}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Imposter Word Mode Section */}
                <List.Section>
                    <List.Subheader>Imposter Word Display</List.Subheader>
                    <RadioButton.Group
                        onValueChange={handleWordModeChange}
                        value={imposterWordMode}
                    >
                        <List.Item
                            title="Show Different Word"
                            description="Imposter sees a related but different word"
                            left={props => <List.Icon {...props} icon="eye" />}
                            right={() => (
                                <RadioButton value="different_word" />
                            )}
                            onPress={() => handleWordModeChange('different_word')}
                        />
                        <Divider />
                        <List.Item
                            title="Show No Word"
                            description="Imposter only knows they are the imposter"
                            left={props => <List.Icon {...props} icon="eye-off" />}
                            right={() => (
                                <RadioButton value="no_word" />
                            )}
                            onPress={() => handleWordModeChange('no_word')}
                        />
                        <List.Item
                            title="Show with Hint"
                            description="Imposter sees title with a hint from a Townie"
                            left={props => <List.Icon {...props} icon="lightbulb" />}
                            right={() => (
                                <RadioButton value="hint_mode" />
                            )}
                            onPress={() => handleWordModeChange('hint_mode')}
                        />
                    </RadioButton.Group>


                </List.Section>

                <Divider style={styles.sectionDivider} />

                {/* Number of Imposters */}
                <List.Section>
                    <List.Subheader>Number of Imposters</List.Subheader>
                    <View style={styles.imposterCountRow}>
                        <IconButton
                            icon="minus"
                            mode="contained-tonal"
                            onPress={() => setImposterCount(imposterCount - 1)}
                            disabled={imposterCount <= 1}
                        />
                        <View style={styles.countDisplay}>
                            <Text variant="displaySmall">{imposterCount}</Text>
                            <Text
                                variant="bodySmall"
                                style={{ color: theme.colors.onSurfaceVariant }}
                            >
                                {imposterCount === 1 ? 'Imposter' : 'Imposters'}
                            </Text>
                        </View>
                        <IconButton
                            icon="plus"
                            mode="contained-tonal"
                            onPress={() => setImposterCount(imposterCount + 1)}
                            disabled={imposterCount >= maxImposters}
                        />
                    </View>
                    <Text
                        variant="bodySmall"
                        style={[styles.helperText, { color: theme.colors.onSurfaceVariant }]}
                    >
                        Maximum {maxImposters} for {players.length} players
                    </Text>
                </List.Section>

                <Divider style={styles.sectionDivider} />

                {/* Other Settings */}
                <List.Section>
                    <List.Subheader>Game Options</List.Subheader>
                    <List.Item
                        title="Randomize Starting Player"
                        description="Randomly pick who speaks first each round"
                        left={props => <List.Icon {...props} icon="shuffle" />}
                        right={() => (
                            <Switch
                                value={randomizeStartingPlayer}
                                onValueChange={setRandomizeStartingPlayer}
                            />
                        )}
                    />
                </List.Section>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Done Button */}
            <Surface style={styles.buttonContainer} elevation={4}>
                <Button
                    mode="contained"
                    onPress={() => router.back()}
                    style={styles.doneButton}
                    contentStyle={styles.doneButtonContent}
                    icon="check"
                >
                    Done
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
        paddingTop: 16,
    },
    sectionDivider: {
        marginVertical: 8,
    },
    imposterCountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
    },
    countDisplay: {
        alignItems: 'center',
        marginHorizontal: 32,
    },
    helperText: {
        textAlign: 'center',
        marginTop: 8,
    },
    buttonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingBottom: 34,
    },
    doneButton: {
        borderRadius: 12,
    },
    doneButtonContent: {
        paddingVertical: 8,
    },
});
