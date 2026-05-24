import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import BottomNav from '../../components/BottomNav';
import Button from '../../components/Button';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';

const symptomList = [
  { emoji: '😵', label: 'Headache' },
  { emoji: '💧', label: 'Thirst' },
  { emoji: '👁️', label: 'Blurred vision' },
  { emoji: '😴', label: 'Fatigue' },
  { emoji: '🦶', label: 'Foot pain' },
  { emoji: '⚡', label: 'Weakness' },
  { emoji: '+', label: 'More' },
];

const readingTypes = [
  { emoji: '🌙', label: 'Pre-dinner' },
  { emoji: '😴', label: 'Bedtime' },
];

export default function LogScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [value, setValue] = useState(118);
  const [selectedType, setSelectedType] = useState('Pre-dinner');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(['Headache']);

  const toggleSymptom = (label: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ backgroundColor: colors.green, paddingTop: 52, paddingHorizontal: 24, paddingBottom: 24, flexShrink: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/home')} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.white }}>{'<'}</Text>
          </TouchableOpacity>
          <View>
            <Text style={{ fontSize: 20, fontWeight: '800', color: colors.white }}>Log glucose</Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Monday, May 19 · All in mg/dL</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#f87171', fontVariant: ['tabular-nums'] }}>234</Text>
            <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Fasting</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#f87171', fontVariant: ['tabular-nums'] }}>267</Text>
            <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Post-B'fast</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#6ee7b7', fontVariant: ['tabular-nums'] }}>142</Text>
            <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Pre-lunch</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#6ee7b7', fontVariant: ['tabular-nums'] }}>158</Text>
            <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Post-lunch</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.25)' }}>—</Text>
            <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Pre-dinner</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.25)' }}>—</Text>
            <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Bedtime</Text>
          </View>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 20, paddingBottom: 96 }}>
        <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: colors.surface, borderRadius: 24, padding: 20, ...shadows.sm, borderWidth: 1, borderColor: 'rgba(11,77,59,0.06)' }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.t1, marginBottom: 14 }}>Add a reading</Text>

          <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: colors.t3, marginBottom: 10 }}>Reading type</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {readingTypes.map((type) => {
              const active = selectedType === type.label;
              return (
                <TouchableOpacity
                  key={type.label}
                  onPress={() => setSelectedType(type.label)}
                  style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 50, backgroundColor: active ? colors.green : colors.bg2 }}
                >
                  <Text style={{ fontSize: 12, fontWeight: active ? '700' : '600', color: active ? colors.white : colors.t3 }}>{type.emoji} {type.label}</Text>
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

          <Button title="Save reading" onPress={() => {}} variant="primary" />
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
                  <Text style={{ fontSize: 12, fontWeight: active ? '700' : '600', color: active ? '#9A6200' : colors.t2 }}>{symptom.emoji} {symptom.label}</Text>
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
              <Text style={{ fontSize: 18 }}>💊</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.t1 }}>Metformin 500mg</Text>
              <Text style={{ fontSize: 12, color: colors.t3, marginTop: 1 }}>Twice daily · 8AM & 8PM</Text>
            </View>
            <View style={{ gap: 6, alignItems: 'flex-end' }}>
              <View style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 50, backgroundColor: colors.greenLight }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.green }}>AM ✓</Text>
              </View>
              <View style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 50, backgroundColor: colors.goldLight }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#9A6200' }}>PM ?</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <BottomNav activeTab="log" onTabPress={(tab) => router.push(`/(tabs)/${tab}`)} />
    </View>
  );
}
