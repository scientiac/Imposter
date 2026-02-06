/**
 * Lobby Screen - Category selection and game setup
 * Now uses React Native Paper with Material You design
 */

import { ScalableButton } from '@/components/animated/ScalableButton';
import { PlayerAvatar } from '@/components/ui/PlayerAvatar';
import { GamePhase, useGame } from '@/contexts/game-context';
import { PREDEFINED_CATEGORIES } from '@/data/game-data';
import * as Haptics from 'expo-haptics';
import { Redirect, router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Avatar,
  Card,
  Chip,
  FAB,
  IconButton,
  Text,
  useTheme
} from 'react-native-paper';
import Animated, { FadeInDown } from 'react-native-reanimated';

// Map category icons to Material icons
const categoryIconMap: Record<string, string> = {
  '🍕': 'pizza',
  '⚽': 'soccer',
  '🎬': 'movie-open',
  '🌍': 'earth',
  '🐾': 'paw',
  '👔': 'briefcase',
  '📦': 'package-variant',
  '🌲': 'tree',
  '🍔': 'food',
  '🎵': 'music',
  '🐕': 'dog',
  '🏛️': 'city',
  '🚗': 'car',
  '📚': 'book',
  '💼': 'briefcase',
  '🎮': 'gamepad-variant',
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
    customCategories,
  } = useGame();

  const isGameActive = phase !== GamePhase.SETUP && phase !== GamePhase.PLAYER_SETUP;

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
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text variant="displaySmall" style={[styles.title, { color: theme.colors.primary }]}>
            Game Lobby
          </Text>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant, opacity: 0.8 }}>
            Select categories for the next round
          </Text>
        </View>

        {/* Players Summary Card */}
        <ScalableButton style={styles.card} onPress={handleManagePlayers}>
          <Card mode="elevated">
            <Card.Content style={styles.playerSummary}>
              <View style={styles.playerSummaryLeft}>
                <View style={styles.avatarStack}>
                  {players.slice(0, 3).map((player, index) => (
                    <PlayerAvatar
                      key={player.id}
                      name={player.name}
                      size={40}
                      style={[
                        styles.stackedAvatar,
                        {
                          marginLeft: index === 0 ? 0 : -16,
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
                      labelStyle={{
                        fontSize: 12,
                        textAlign: 'center',
                        textAlignVertical: 'center',
                        includeFontPadding: false
                      }}
                    />
                  )}
                </View>
                <View style={[styles.playerInfo, { flex: 1 }]}>
                  <Text variant="titleMedium">{players.length} Players</Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Tap to manage
                  </Text>
                </View>
                <IconButton
                  icon="chevron-right"
                  size={24}
                  iconColor={theme.colors.onSurfaceVariant}
                />
              </View>
            </Card.Content>
          </Card>
        </ScalableButton>

        {/* Game Settings Card */}
        <ScalableButton style={styles.card} onPress={handleSettings}>
          <Card mode="contained" style={{ backgroundColor: theme.colors.secondaryContainer, borderRadius: 28, borderWidth: 0 }}>
            <Card.Content style={{ paddingVertical: 12 }}>
              <View style={styles.settingsRow}>
                <Avatar.Icon
                  size={44}
                  icon="cog-outline"
                  style={{ backgroundColor: theme.colors.onSecondaryContainer, alignSelf: 'center' }}
                  color={theme.colors.secondaryContainer}
                />
                <View style={styles.settingsInfo}>
                  <Text variant="titleMedium" style={{ color: theme.colors.onSecondaryContainer, fontWeight: 'bold', marginBottom: 4 }}>
                    Match Configuration
                  </Text>
                  <View style={styles.settingsChips}>
                    <Chip
                      compact
                      icon="account-group"
                      style={[styles.smallChip, { backgroundColor: theme.colors.surface }]}
                      textStyle={{ color: theme.colors.onSurface, fontWeight: '600' }}
                    >
                      {imposterCount} {imposterCount === 1 ? 'Imposter' : 'Imposters'}
                    </Chip>
                    <Chip
                      compact
                      icon="incognito-circle"
                      style={[styles.smallChip, { backgroundColor: theme.colors.surface }]}
                      textStyle={{ color: theme.colors.onSurface, fontWeight: '600' }}
                    >
                      {getModeLabel()}
                    </Chip>
                  </View>
                </View>
                <IconButton
                  icon="tune-variant"
                  size={24}
                  iconColor={theme.colors.onSecondaryContainer}
                />
              </View>
            </Card.Content>
          </Card>
        </ScalableButton>

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
            {allCategories.map((category, index) => {
              const isSelected = selectedCategories.some(c => c.id === category.id);
              return (
                <Animated.View
                  key={category.id}
                  entering={FadeInDown.delay(index * 50).duration(400)}
                  style={styles.categoryCard}
                >
                  <ScalableButton
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      toggleCategory(category);
                    }}
                  >
                    <Card
                      style={[
                        styles.fullWidth,
                        { borderRadius: 24 },
                        isSelected && {
                          borderColor: theme.colors.primary,
                          borderWidth: 2,
                        }
                      ]}
                      mode={isSelected ? 'elevated' : 'contained'}
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
                          <View style={styles.customBadgeContainer}>
                            <View style={[styles.customBadge, { backgroundColor: theme.colors.tertiaryContainer }]}>
                              <Text variant="labelSmall" style={{ color: theme.colors.onTertiaryContainer, fontWeight: '800' }}>CUSTOM</Text>
                            </View>
                          </View>
                        )}
                      </Card.Content>
                    </Card>
                  </ScalableButton>
                </Animated.View>
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
            { backgroundColor: !isGameActive && !canStartGame ? theme.colors.surfaceDisabled : theme.colors.primary }
          ]}
          onPress={handleStartGame}
          color={!isGameActive && !canStartGame ? theme.colors.onSurfaceVariant : theme.colors.onPrimary}
          disabled={!isGameActive && !canStartGame}
        />
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
    marginBottom: 24,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  card: {
    marginBottom: 16,
    borderRadius: 28,
    overflow: 'hidden',
  },
  playerSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  playerSummaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarStack: {
    flexDirection: 'row',
    marginRight: 16,
  },
  stackedAvatar: {
    borderWidth: 2.5,
  },
  playerInfo: {
    marginLeft: 8,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  settingsInfo: {
    marginLeft: 16,
    flex: 1,
    paddingVertical: 4,
  },
  settingsChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    borderRadius: 8,
  },
  smallChip: {
    borderRadius: 16,
    paddingVertical: 4,
  },
  section: {
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
  },
  categoryCard: {
    width: '48%',
  },
  fullWidth: {
    width: '100%',
  },
  categoryContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  categoryName: {
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  customBadgeContainer: {
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  customBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    minHeight: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 88 + 24, // Tab bar top (24+64) + Gap (24)
    alignItems: 'flex-end',
    gap: 8,
  },
  fab: {
    borderRadius: 20,
  },
  smallFab: {
    borderRadius: 16,
  },
});
