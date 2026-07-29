import { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StatusBar, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { syncService } from '../services/sync';
import { colors } from '../constants/theme';

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    syncService.isOnline().then((online) => setOffline(!online));
    const unsubscribe = syncService.listen((online) => {
      setOffline(!online);
      if (online) {
        setExpanded(false);
        if (dismissTimer.current) clearTimeout(dismissTimer.current);
      }
    });
    return () => {
      unsubscribe();
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!offline) return;
    Animated.timing(fadeAnim, {
      toValue: expanded ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();

    if (expanded) {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
      dismissTimer.current = setTimeout(() => {
        setExpanded(false);
      }, 5000);
    }
    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [expanded, offline, fadeAnim]);

  if (!offline) return null;

  return (
    <>
      <StatusBar backgroundColor="#F07A30" barStyle="light-content" />

      {expanded && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 100,
            left: 16,
            right: 16,
            backgroundColor: colors.amber,
            borderRadius: 16,
            padding: 16,
            zIndex: 200,
            opacity: fadeAnim,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Feather name="wifi-off" size={18} color={colors.white} />
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.white, flex: 1 }}>
            You're offline — data will sync when connected
          </Text>
          <TouchableOpacity onPress={() => setExpanded(false)}>
            <Feather name="x" size={18} color={colors.white} />
          </TouchableOpacity>
        </Animated.View>
      )}

      {!expanded && (
        <View style={{ position: 'absolute', top: 54, left: 0, right: 0, alignItems: 'center', zIndex: 200, pointerEvents: 'box-none' }}>
          <TouchableOpacity
            onPress={() => setExpanded(true)}
            activeOpacity={0.8}
            style={{
              backgroundColor: colors.amber,
              borderRadius: 50,
              paddingVertical: 8,
              paddingHorizontal: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Feather name="wifi-off" size={14} color={colors.white} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.white }}>Offline</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}
