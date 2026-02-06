import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Avatar, useTheme } from 'react-native-paper';

interface PlayerAvatarProps {
    name: string;
    size?: number;
    style?: StyleProp<ViewStyle>;
}

// Curated palette for vibrant, modern look
const AVATAR_COLORS = [
    '#FF5252', // Red
    '#FF4081', // Pink
    '#E040FB', // Purple
    '#7C4DFF', // Deep Purple
    '#536DFE', // Indigo
    '#448AFF', // Blue
    '#40C4FF', // Light Blue
    '#18FFFF', // Cyan
    '#64FFDA', // Teal
    '#69F0AE', // Green
    '#B2FF59', // Light Green
    '#EEFF41', // Lime
    '#FFFF00', // Yellow
    '#FFD740', // Amber
    '#FFAB40', // Orange
    '#FF6E40', // Deep Orange
];

// Curated shapes from MaterialCommunityIcons
const AVATAR_SHAPES = [
    'hexagon',
    'pentagon',
    'octagon',
    'diamond',
    'square',
    'circle',
    'decagram',
    'star',
    'rhombus',
    'triangle',
    'cards-diamond',
    'shield',
    'heart',
    'clover',
    'spade',
    'pine-tree',
];

/**
 * Generates a consistent hash from a string
 */
const getHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
};

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({ name, size = 40, style }) => {
    const theme = useTheme();
    const hash = getHash(name);

    const baseColor = AVATAR_COLORS[hash % AVATAR_COLORS.length];
    const shape = AVATAR_SHAPES[hash % AVATAR_SHAPES.length];

    // Adjust color for dark mode to ensure it's not too piercing/light
    // We use a semi-transparent overlay of the base color on the surface variant
    const avatarBg = theme.dark
        ? `${baseColor}44` // ~27% opacity in dark mode
        : baseColor;

    const iconColor = theme.dark
        ? baseColor // Bright icon on dark semi-transparent background
        : 'rgba(255, 255, 255, 0.9)'; // White icon on bright background

    return (
        <Avatar.Icon
            size={size}
            icon={shape}
            style={[
                {
                    backgroundColor: avatarBg,
                    borderWidth: theme.dark ? 1 : 0,
                    borderColor: `${baseColor}88`
                },
                style
            ]}
            color={iconColor}
        />
    );
};
