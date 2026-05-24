import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import Button from '../../components/Button';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';
import { patientService, GlucoseTodaySlot } from '../../services/patient';

const symptomList = [
  { iconSet: 'feather' as const, icon: 'activity', label: 'Headache' },
  { iconSet: 'material' as const, icon: 'water', label: 'Thirst' },
  { iconSet: 'feather' as const, icon: 'eye', label: 'Blurred vision' },
  { iconSet: 'material' as const, icon: 'sleep', label: 'Fatigue' },
  { iconSet: 'material' as const, icon: 'foot-print', label: 'Foot pain' },
  { iconSet: 'feather' as const, icon: 'zap', label: 'Weakness' },
  { iconSet: 'feather' as const, icon: 'plus', label: 'More' },
];

const readingTypes = [
  { iconSet: 'feather' as const, icon: 'moon', label: 'Pre-dinner' },
  { iconSet: 'material' as const, icon: 'sleep', label: 'Bedtime' },
];

function IconRender({ item, size, color }: { item: typeof symptomList[0] | typeof readingTypes[0]; size: number; color: string }) {
  if (item.iconSet === 'feather') return <Feather name={item.icon as any} size={size} color={color} />;
  return <MaterialCommunityIcons name={item.icon as any} size={size} color={color} />;
}

export default function LogScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [value, setValue] = useState(118);
  const [selectedType, setSelectedType] = useState('Pre-dinner');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(['Headache']);
  const [submitting, setSubmitting] = useState(false);
  const [todaySlots, setTodaySlots] = useState<GlucoseTodaySlot[]>([]);

  useEffect(() => {
    loadToday();
  }, []);

  const loadToday = async () => {
    try {
      const res = await patientService.getTodayReadings();
      setTodaySlots(res.slots);
    } catch (err) {
      console.log('Failed to load today readings', err);
    }
  };

  const toggleSymptom = (label: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label]
    );
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      await patientService.logReading({
        value,
        reading_type: selectedType,
        timestamp: new Date().toISOString(),
        symptoms: selectedSymptoms.join(', ') || undefined,
      });
      router.push('/(tabs)/home');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Failed to save reading');
    } finally {
      setSubmitting(false);
    }
  };

  const allReadingTypes = [...readingTypes];
  const fastingTypes = ['Fasting', 'Post-Breakfast', 'Pre-Lunch', 'Post-Lunch'];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ backgroundColor: colors.green, paddingTop: 52, paddingHorizontal: 24, paddingBottom: 24, flexShrink: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/home')} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.white }}>{'<'}</Text>
          </TouchableOpacity>
          <View>
            <Text style={{ fontSize: 20, fontWeight: '800', color: colors.white }}>Log glucose</Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · All in mg/dL</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {allReadingTypes.map((type, i) => {
            const slot = todaySlots.find(s => s.reading_type === type.label);
            const val = slot?.value;
            const color = val ? (val > 180 ? '#f87171' : '#6ee7b7') : 'rgba(255,255,255,0.25)';
            return (
              <View key={i} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color, fontVariant: ['tabular-nums'] }}>{val ?? '—'}</Text>
                <Text style={{ fontSize: 9, color: val ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.3)', marginTop: 2 }}>{type.label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 20, paddingBottom: 24 }}>
        <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: colors.surface, borderRadius: 24, padding: 20, ...shadows.sm, borderWidth: 1, borderColor: 'rgba(11,77,59,0.06)' }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.t1, marginBottom: 14 }}>Add a reading</Text>

          <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: colors.t3, marginBottom: 10 }}>Reading type</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {['Fasting', 'Post-Breakfast', 'Pre-Lunch', 'Post-Lunch', 'Pre-Dinner', 'Bedtime'].map((type) => {
              const active = selectedType === type;
              return (
                <TouchableOpacity
                  key={type}
                  onPress={() => setSelectedType(type)}
                  style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 50, backgroundColor: active ? colors.green : colors.bg2 }}
                >
                  <Text style={{ fontSize: 12, fontWeight: active ? '700' : '600', color: active ? colors.white : colors.t3 }}>{type}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: colors.t3, marginBottom: 12 }}>Value (mg/dL)</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <View style={{ flex: 1, backgroundColor: colors.greenXlight, borderRadius: 20, padding: 20, alignItems: 'center', borderWidth: 2, borderColor: colors.greenLight }}>
              <Text style={{ fontSize: 48, fontWeight: '800', color: colors.green, fontVariant: ['tabular-nums'] }}>{value}</Text>
              <Text style={{ fontSize: 12, color: colors.t3, marginTop: 4 }}>Normal range</Text>
            </View>
            <View style={{ gap: 10 }}>
              <TouchableOpacity onPress={() => setValue((v) => v + 1)} style={{ width: 48, height: 48, backgroundColor: colors.green, borderRadius: 12, alignItems: 'center', justifyContent: 'center', ...shadows.md }}>
                <Text style={{ fontSize: 24, color: colors.white }}>+</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setValue((v) => Math.max(0, v - 1))} style={{ width: 48, height: 48, backgroundColor: colors.bg2, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 24, color: colors.t2 }}>-</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Button title="Save reading" onPress={handleSave} loading={submitting} variant="primary" />
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 12 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', color: colors.t3 }}>Any symptoms today?</Text>
        </View>
        <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: colors.surface, borderRadius: 24, padding: 20, ...shadows.sm, borderWidth: 1, borderColor: 'rgba(11,77,59,0.06)' }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {symptomList.map((symptom) => {
              const active = selectedSymptoms.includes(symptom.label);
              return (
                <TouchableOpacity
                  key={symptom.label}
                  onPress={() => toggleSymptom(symptom.label)}
                  style={{ paddingVertical: 10, paddingHorizontal: 14, borderRadius: 50, backgroundColor: active ? colors.goldLight : colors.bg2 }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <IconRender item={symptom} size={16} color={active ? '#9A6200' : colors.t2} />
                    <Text style={{ fontSize: 12, fontWeight: active ? '700' : '600', color: active ? '#9A6200' : colors.t2 }}>{symptom.label}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 12 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', color: colors.t3 }}>Medication today</Text>
        </View>
        <View style={{ marginHorizontal: 16, backgroundColor: colors.surface, borderRadius: 24, padding: 20, ...shadows.sm, borderWidth: 1, borderColor: 'rgba(11,77,59,0.06)' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <MaterialCommunityIcons name="pill" size={20} color={colors.green} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.t1 }}>Metformin 500mg</Text>
              <Text style={{ fontSize: 12, color: colors.t3, marginTop: 1 }}>Twice daily · 8AM & 8PM</Text>
            </View>
            <View style={{ gap: 6, alignItems: 'flex-end' }}>
              <View style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 50, backgroundColor: colors.greenLight, flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <Feather name="check" size={12} color={colors.green} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.green }}>AM</Text>
              </View>
              <View style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 50, backgroundColor: colors.goldLight }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#9A6200' }}>PM ?</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
