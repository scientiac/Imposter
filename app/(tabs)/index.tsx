/**
 * Lobby Screen - Category selection and game setup
 * Now uses React Native Paper with Material You design
 */

import { GamePhase, useGame } from '@/contexts/game-context';
import { PREDEFINED_CATEGORIES } from '@/data/game-data';
import { useCustomCategories } from '@/hooks/use-custom-categories';
import { Redirect, router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Avatar,
  Card,
  Chip,
  FAB,
  IconButton,
  Surface,
  Text,
  useTheme
} from 'react-native-paper';

// Map category icons to Material icons
const categoryIconMap: Record<string, string> = {
  '🍔': 'food',
  '⚽': 'soccer',
  '🎬': 'movie-open',
  '🎵': 'music',
  '🐕': 'dog',
  '🏛️': 'city',
  '🚗': 'car',
  '📚': 'book',
  '💼': 'briefcase',
  '🎮': 'gamepad-variant',
  '🌍': 'earth',
  '🧪': 'flask',
};

function getCategoryIcon(emoji: string): string {
  return categoryIconMap[emoji] || 'tag';
}

export default function LobbyScreen() {
  const theme = useTheme();
  const {
    players,
    selectedCategories,
    toggleCategory,
    startGame,
    phase,
    imposterCount,
    imposterWordMode,
    endGame,
  } = useGame();

  const isGameActive = phase !== GamePhase.SETUP && phase !== GamePhase.PLAYER_SETUP;

  const { customCategories } = useCustomCategories();
  const allCategories = [...PREDEFINED_CATEGORIES, ...customCategories];

  // Redirect to player setup if no players
  if (phase === GamePhase.PLAYER_SETUP || players.length === 0) {
    return <Redirect href="/player-setup" />;
  }

  const handleStartGame = () => {
    if (isGameActive) {
      if (phase === GamePhase.REVEAL) {
        router.push('/reveal');
      } else {
        router.push('/game');
      }
      return;
    }

    if (selectedCategories.length === 0 || players.length < 3) return;
    startGame();
    router.push('/reveal');
  };

  const handleManagePlayers = () => {
    if (isGameActive) endGame();
    router.push('/player-setup');
  };

  const handleSettings = () => {
    if (isGameActive) endGame();
    router.push('/settings');
  };

  const canStartGame = selectedCategories.length > 0 && players.length >= 3;

  const getModeLabel = () => {
    switch (imposterWordMode) {
      case 'different_word': return 'Different word';
      case 'no_word': return 'No word shown';
      case 'hint_mode': return 'Hint Round';
      default: return 'Standard';
    }
  };

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
            Game Lobby
          </Text>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
            Select categories to play
          </Text>
        </View>

        {/* Players Summary Card */}
        <Card style={styles.card} mode="elevated" onPress={handleManagePlayers}>
          <Card.Content style={styles.playerSummary}>
            <View style={styles.playerSummaryLeft}>
              <View style={styles.avatarStack}>
                {players.slice(0, 3).map((player, index) => (
                  <Avatar.Text
                    key={player.id}
                    size={36}
                    label={player.name.charAt(0).toUpperCase()}
                    style={[
                      styles.stackedAvatar,
                      {
                        marginLeft: index === 0 ? 0 : -12,
                        borderColor: theme.colors.surface,
                        zIndex: 10 - index
                      }
                    ]}
                  />
                ))}
                {players.length > 3 && (
                  <Avatar.Text
                    size={36}
                    label={`+${players.length - 3}`}
                    style={[
                      styles.stackedAvatar,
                      {
                        marginLeft: -12,
                        borderColor: theme.colors.surface
                      }
                    ]}
                    labelStyle={{ fontSize: 12 }}
                  />
                )}
              </View>
              <View style={styles.playerInfo}>
                <Text variant="titleMedium">{players.length} Players</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Tap to manage
                </Text>
              </View>
            </View>
            <IconButton icon="chevron-right" />
          </Card.Content>
        </Card>

        {/* Game Settings Card */}
        <Card style={styles.card} mode="outlined" onPress={handleSettings}>
          <Card.Content>
            <View style={styles.settingsRow}>
              <Avatar.Icon
                size={40}
                icon="cog"
                style={{ backgroundColor: theme.colors.secondaryContainer }}
              />
              <View style={styles.settingsInfo}>
                <Text variant="titleMedium">Game Settings</Text>
                <View style={styles.settingsChips}>
                  <Chip compact icon="account-eye" style={styles.chip}>
                    {imposterCount} {imposterCount === 1 ? 'Imposter' : 'Imposters'}
                  </Chip>
                  <Chip compact icon="eye" style={styles.chip}>
                    {getModeLabel()}
                  </Chip>
                </View>
              </View>
              <IconButton icon="chevron-right" />
            </View>
          </Card.Content>
        </Card>

        {/* Category Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium">Categories</Text>
            {selectedCategories.length > 0 && (
              <Chip icon="check-circle" mode="flat">
                {selectedCategories.length} selected
              </Chip>
            )}
          </View>

          <View style={styles.categoryGrid}>
            {allCategories.map((category) => {
              const isSelected = selectedCategories.some(c => c.id === category.id);
              return (
                <Card
                  key={category.id}
                  style={[
                    styles.categoryCard,
                    isSelected && {
                      borderColor: theme.colors.primary,
                      borderWidth: 2,
                    }
                  ]}
                  mode={isSelected ? 'elevated' : 'outlined'}
                  onPress={() => toggleCategory(category)}
                >
                  <Card.Content style={styles.categoryContent}>
                    <Avatar.Icon
                      size={48}
                      icon={getCategoryIcon(category.icon)}
                      style={{
                        backgroundColor: isSelected
                          ? theme.colors.primaryContainer
                          : theme.colors.surfaceVariant
                      }}
                    />
                    <Text
                      variant="labelLarge"
                      style={[
                        styles.categoryName,
                        isSelected && { color: theme.colors.primary }
                      ]}
                      numberOfLines={1}
                    >
                      {category.name}
                    </Text>
                    <Text
                      variant="bodySmall"
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      {category.words.length} words
                    </Text>
                    {category.isCustom && (
                      <Chip compact style={styles.customBadge}>
                        Custom
                      </Chip>
                    )}
                  </Card.Content>
                </Card>
              );
            })}
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Start Game / Resume FAB */}
      <View style={styles.fabContainer}>
        {isGameActive && (
          <FAB
            icon="close"
            label="Exit Game"
            onPress={endGame}
            style={[styles.smallFab, { backgroundColor: theme.colors.errorContainer }]}
            color={theme.colors.onErrorContainer}
            size="small"
          />
        )}
        <FAB
          icon={isGameActive ? "play-pause" : "play"}
          label={isGameActive ? "Resume Game" : "Start Game"}
          style={[
            styles.fab,
            !isGameActive && !canStartGame && { backgroundColor: theme.colors.surfaceDisabled }
          ]}
          onPress={handleStartGame}
          disabled={!isGameActive && !canStartGame}
        />
      </View>
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
    marginBottom: 24,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  card: {
    marginBottom: 16,
  },
  playerSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerSummaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarStack: {
    flexDirection: 'row',
    marginRight: 12,
  },
  stackedAvatar: {
    borderWidth: 2,
  },
  playerInfo: {
    marginLeft: 8,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsInfo: {
    marginLeft: 12,
    flex: 1,
  },
  settingsChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
    gap: 6,
    alignItems: 'center',
  },
  chip: {
    // Removed fixed height to prevent text cropping
  },
  section: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  categoryCard: {
    width: '48%',
  },
  categoryContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  categoryName: {
    marginTop: 8,
    textAlign: 'center',
  },
  customBadge: {
    marginTop: 8,
  },
  fabContainer: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    alignItems: 'flex-end',
    gap: 12,
  },
  fab: {
    // Standard FAB style
  },
  smallFab: {
    // Smaller FAB for secondary actions
  },
});
