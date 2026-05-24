import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, BackHandler } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, shadows } from '../constants/theme';
import { patientService } from '../services/patient';
import { syncService } from '../services/sync';

const affirmations: Record<string, string> = {
  Fasting: 'Great start to the day! Fasting is the most important reading.',
  'Post-Breakfast': "You're staying on top of your morning levels — nice work.",
  'Pre-Lunch': 'Checking before meals helps you understand your patterns.',
  'Post-Lunch': 'Tracking after lunch builds a complete picture of your day.',
  'Pre-Dinner': 'Consistent evening checks keep you in control.',
  Bedtime: 'Finishing the day with a reading shows real commitment.',
};

export default function LogSuccessScreen() {
  const router = useRouter();
  const { value, reading_type } = useLocalSearchParams<{ value: string; reading_type: string }>();
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    loadStreak();
    syncService.syncPending();
  }, []);

  useEffect(() => {
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      router.replace('/(tabs)/home');
      return true;
    });
    return () => back.remove();
  }, []);

  const loadStreak = async () => {
    try {
      const stats = await patientService.getStats();
      setStreak(stats.days_logged || 0);
    } catch {
      setStreak(0);
    }
  };

  const numValue = parseInt(value || '0', 10);
  const isNormal = numValue >= 70 && numValue <= 180;
  const affirmation = affirmations[reading_type || ''] || 'Every reading brings you closer to understanding your body.';

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: isNormal ? colors.greenLight : colors.goldLight, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          {isNormal ? (
            <Feather name="check" size={40} color={colors.green} />
          ) : (
            <Feather name="alert-triangle" size={36} color="#9A6200" />
          )}
        </View>

        <Text style={{ fontSize: 28, fontWeight: '800', color: colors.t1, textAlign: 'center' }}>Glucose logged!</Text>

        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 16 }}>
          <Text style={{ fontSize: 52, fontWeight: '800', color: isNormal ? colors.green : '#9A6200', fontVariant: ['tabular-nums'] }}>{value}</Text>
          <Text style={{ fontSize: 16, color: colors.t3 }}>mg/dL</Text>
        </View>

        <View style={{ paddingVertical: 6, paddingHorizontal: 16, borderRadius: 50, backgroundColor: colors.bg2, marginTop: 8 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.t2 }}>{reading_type}</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, backgroundColor: colors.surface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(11,77,59,0.06)', ...shadows.sm }}>
          <MaterialCommunityIcons name="fire" size={28} color={colors.gold2} />
          <View>
            <Text style={{ fontSize: 22, fontWeight: '800', color: colors.t1, fontVariant: ['tabular-nums'] }}>{streak}</Text>
            <Text style={{ fontSize: 12, color: colors.t3 }}>Day streak</Text>
          </View>
        </View>

        <View style={{ marginTop: 24, backgroundColor: colors.greenXlight, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(11,77,59,0.08)' }}>
          <Text style={{ fontSize: 13, color: colors.green, lineHeight: 20, textAlign: 'center' }}>{affirmation}</Text>
        </View>

        {!isNormal && (
          <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Feather name="info" size={14} color={colors.t3} />
            <Text style={{ fontSize: 12, color: colors.t3 }}>Talk to your doctor if this pattern continues</Text>
          </View>
        )}

        <TouchableOpacity
          onPress={() => router.replace('/(tabs)/home')}
          style={{ marginTop: 40, width: '100%', paddingVertical: 16, backgroundColor: colors.green, borderRadius: 9999, alignItems: 'center', ...shadows.md }}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.white }}>Back to home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.replace('/(tabs)/log')}
          style={{ marginTop: 12, paddingVertical: 12 }}
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.t3 }}>Log another reading</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
