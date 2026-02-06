import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

interface ScalableButtonProps extends PressableProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    activeScale?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const ScalableButton: React.FC<ScalableButtonProps> = ({
    children,
    style,
    activeScale = 0.96,
    ...props
}) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = (e: any) => {
        scale.value = withSpring(activeScale, { damping: 15, stiffness: 200 });
        props.onPressIn?.(e);
    };

    const handlePressOut = (e: any) => {
        scale.value = withSpring(1, { damping: 15, stiffness: 200 });
        props.onPressOut?.(e);
    };

    return (
        <AnimatedPressable
            {...props}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[style, animatedStyle]}
        >
            {children}
        </AnimatedPressable>
    );
};
