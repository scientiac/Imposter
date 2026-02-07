import { Accelerometer } from 'expo-sensors';
import React, { useEffect, useState } from 'react';

interface ShakeDetectorProps {
    onShake: () => void;
    threshold?: number;
    interval?: number;
}

/**
 * Component that detects shake gestures using the Accelerometer
 */
export const ShakeDetector: React.FC<ShakeDetectorProps> = ({
    onShake,
    threshold = 1.8, // Sensitivity threshold
    interval = 100
}) => {
    const [data, setData] = useState({ x: 0, y: 0, z: 0 });
    const [subscription, setSubscription] = useState<any>(null);

    const _subscribe = () => {
        Accelerometer.setUpdateInterval(interval);
        setSubscription(
            Accelerometer.addListener(accelerometerData => {
                setData(accelerometerData);

                const { x, y, z } = accelerometerData;
                const totalAcceleration = Math.sqrt(x * x + y * y + z * z);

                if (totalAcceleration > threshold) {
                    onShake();
                }
            })
        );
    };

    const _unsubscribe = () => {
        subscription && subscription.remove();
        setSubscription(null);
    };

    useEffect(() => {
        _subscribe();
        return () => _unsubscribe();
    }, []);

    return null; // This component doesn't render anything
};
