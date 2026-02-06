import React from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
    FadeIn,
    FadeOut,
    SlideInRight,
    SlideOutLeft,
} from 'react-native-reanimated';

interface PhaseTransitionProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    type?: 'fade' | 'slide';
    index?: number; // For staggered effects
}

export const PhaseTransition: React.FC<PhaseTransitionProps> = ({
    children,
    style,
    type = 'slide',
    index = 0,
}) => {
    const entering = type === 'slide'
        ? SlideInRight.duration(400).delay(index * 50)
        : FadeIn.duration(400).delay(index * 50);

    const exiting = type === 'slide'
        ? SlideOutLeft.duration(300)
        : FadeOut.duration(300);

    return (
        <Animated.View
            entering={entering}
            exiting={exiting}
            style={[styles.container, style]}
        >
            {children}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
