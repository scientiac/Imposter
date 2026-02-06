/**
 * Custom Categories Screen - Add, edit, and delete custom word categories
 * Uses React Native Paper with Material You design
 */

import { useGame } from '@/contexts/game-context';
import { type Category as CategoryType } from '@/data/game-data';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Avatar,
  Button,
  Card,
  Dialog,
  FAB,
  IconButton,
  Portal,
  Text,
  TextInput,
  useTheme
} from 'react-native-paper';

// Helper to map icons if needed, or import from a shared location.
// Since I defined it locally in index.tsx, I should arguably move it to a shared constant or dup it here.
// For now I will mock a simple icon mapper or just use a default.
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

export default function CategoriesScreen() {
  const theme = useTheme();
  const {
    customCategories,
    addCategory,
    updateCategory,
    removeCategory,
    isLoadingCategories
  } = useGame();

  const [visible, setVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryType | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [wordsText, setWordsText] = useState('');
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryType | null>(null);

  const showModal = (category?: CategoryType) => {
    if (category) {
      setEditingCategory(category);
      setCategoryName(category.name);
      setWordsText(category.words.join('\n'));
    } else {
      setEditingCategory(null);
      setCategoryName('');
      setWordsText('');
    }
    setVisible(true);
  };

  const hideModal = () => {
    setVisible(false);
    setEditingCategory(null);
  };

  const confirmDelete = (category: CategoryType) => {
    setCategoryToDelete(category);
    setDeleteDialogVisible(true);
  };

  const handleDelete = async () => {
    if (categoryToDelete) {
      await removeCategory(categoryToDelete.id);
      setDeleteDialogVisible(false);
      setCategoryToDelete(null);
    }
  };

  const handleSave = async () => {
    const name = categoryName.trim();
    const words = wordsText
      .split('\n')
      .map(w => w.trim())
      .filter(w => w.length > 0);

    if (!name) {
      // Keep it simple for now, generic alert or set error state
      // Using a simple blocking alert is fine, or better use a HelperText if I implemented validation state
      alert('Please enter a category name');
      return;
    }

    if (words.length < 5) {
      alert('Please enter at least 5 words');
      return;
    }

    if (editingCategory) {
      await updateCategory(editingCategory.id, { name, words });
    } else {
      await addCategory(name, words);
    }

    hideModal();
  };

  if (isLoadingCategories) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 16 }}>Loading categories...</Text>
      </View>
    );
  }

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
            Categories
          </Text>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant, opacity: 0.8 }}>
            Manage your custom word lists
          </Text>
        </View>
        {customCategories.length === 0 ? (
          <View style={styles.emptyState}>
            <Avatar.Icon
              size={80}
              icon="playlist-edit"
              style={{ backgroundColor: theme.colors.surfaceVariant }}
            />
            <Text variant="titleLarge" style={styles.emptyTitle}>
              No Custom Categories
            </Text>
            <Text variant="bodyLarge" style={styles.emptyText}>
              Create your own word lists to play with!
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {customCategories.map((category) => (
              <Card key={category.id} style={styles.card} mode="contained">
                <Card.Content style={styles.cardContent}>
                  <Avatar.Icon
                    size={56}
                    icon={getCategoryIcon(category.icon)}
                    style={{ backgroundColor: theme.colors.tertiaryContainer }}
                    color={theme.colors.onTertiaryContainer}
                  />
                  <View style={styles.categoryInfo}>
                    <Text variant="titleLarge" style={styles.categoryName} numberOfLines={1}>
                      {category.name}
                    </Text>
                    <View style={styles.badgeRow}>
                      <View style={[styles.countBadge, { backgroundColor: theme.colors.secondaryContainer }]}>
                        <Text variant="labelSmall" style={{ color: theme.colors.onSecondaryContainer, fontWeight: 'bold' }}>
                          {category.words.length} WORDS
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.cardActions}>
                    <IconButton
                      icon="pencil-outline"
                      mode="contained-tonal"
                      onPress={() => showModal(category)}
                      size={24}
                    />
                    <IconButton
                      icon="delete-outline"
                      mode="contained"
                      containerColor={theme.colors.errorContainer}
                      iconColor={theme.colors.onErrorContainer}
                      onPress={() => confirmDelete(category)}
                      size={24}
                    />
                  </View>
                </Card.Content>
              </Card>
            ))}
          </View>
        )}
        <View style={{ height: 140 }} />
      </ScrollView>

      <FAB
        icon="plus"
        label="Create Category"
        style={styles.fab}
        onPress={() => showModal()}
      />

      {/* Edit/Create Dialog */}
      <Portal>
        <Dialog visible={visible} onDismiss={hideModal} style={{ maxHeight: '80%' }}>
          <Dialog.Title>{editingCategory ? 'Edit Category' : 'New Category'}</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView contentContainerStyle={{ paddingVertical: 10 }}>
              <TextInput
                label="Category Name"
                value={categoryName}
                onChangeText={setCategoryName}
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label="Words (one per line)"
                value={wordsText}
                onChangeText={setWordsText}
                mode="outlined"
                multiline
                numberOfLines={8}
                placeholder="Word 1&#10;Word 2&#10;Word 3&#10;Word 4&#10;Word 5"
                style={styles.textArea}
              />
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Minimum 5 words required.
              </Text>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={hideModal} labelStyle={styles.buttonLabel}>Cancel</Button>
            <Button
              mode="contained"
              onPress={handleSave}
              icon="check"
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              style={{ borderRadius: 28 }}
            >
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>Delete Category?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to delete &quot;{categoryToDelete?.name}&quot;? This action cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)} labelStyle={styles.buttonLabel}>Cancel</Button>
            <Button
              mode="contained"
              buttonColor="#D32F2F"
              textColor="white"
              onPress={handleDelete}
              icon="delete"
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              style={{ borderRadius: 28 }}
            >
              Delete Permanently
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyTitle: {
    marginTop: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.7,
  },
  grid: {
    gap: 16,
  },
  card: {
    marginBottom: 8,
    borderRadius: 28,
    backgroundColor: 'transparent',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  categoryInfo: {
    flex: 1,
    marginLeft: 16,
  },
  categoryName: {
    fontWeight: 'bold',
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 88 + 24, // Tab bar top (24+64) + Gap (24)
    borderRadius: 20,
  },
  input: {
    marginBottom: 16,
    borderRadius: 12,
  },
  textArea: {
    marginBottom: 8,
    minHeight: 120,
    borderRadius: 12,
  },
  buttonContent: {
    height: 48,
    flexDirection: 'row-reverse',
    paddingHorizontal: 16,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
