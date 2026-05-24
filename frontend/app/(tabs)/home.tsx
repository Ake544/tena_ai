import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ backgroundColor: colors.green, paddingTop: 52, paddingHorizontal: 24, paddingBottom: 20, flexShrink: 0 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{t('home.greeting', 'ሰላም')}</Text>
            <Feather name="smile" size={16} color="rgba(255,255,255,0.55)" />
          </View>
            <Text style={{ fontSize: 24, fontWeight: '800', color: colors.white }}>Abebe Bekele</Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Day 23 of tracking · Monday, May 19</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.white }}>AB</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 12, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: colors.white, fontVariant: ['tabular-nums'] }}>198</Text>
            <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>Last glucose</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 12, alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: colors.gold2, fontVariant: ['tabular-nums'] }}>12</Text>
              <MaterialCommunityIcons name="fire" size={20} color={colors.gold2} />
            </View>
            <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>Day streak</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 12, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: colors.white }}>86%</Text>
            <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>Med adherence</Text>
          </View>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 16, paddingBottom: 96 }}>
        <TouchableOpacity style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: colors.redLight, borderRadius: 20, padding: 14, paddingHorizontal: 16, flexDirection: 'row', gap: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(217,79,61,0.15)' }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Feather name="alert-triangle" size={20} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.red }}>High glucose streak detected</Text>
            <Text style={{ fontSize: 12, color: colors.t3, marginTop: 2, lineHeight: 16 }}>Fasting above 230 mg/dL for 3 days</Text>
          </View>
          <Text style={{ color: colors.t3, fontSize: 16 }}>›</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 12 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', color: colors.t3 }}>Today's glucose</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/log')}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.green }}>Log reading</Text>
          </TouchableOpacity>
        </View>
        <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: colors.surface, borderRadius: 24, padding: 20, ...shadows.sm, borderWidth: 1, borderColor: 'rgba(11,77,59,0.06)' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <View>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.t1 }}>Today's readings</Text>
              <Text style={{ fontSize: 12, color: colors.t3, marginTop: 2 }}>mg/dL</Text>
            </View>
            <View style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 50, backgroundColor: colors.redLight }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.red }}>3 high</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 72 }}>
            <View style={{ flex: 1, backgroundColor: colors.red, borderRadius: 4, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, height: '80%' }} />
            <View style={{ flex: 1, backgroundColor: colors.red, borderRadius: 4, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, height: '92%' }} />
            <View style={{ flex: 1, backgroundColor: colors.greenLight, borderRadius: 4, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, height: '60%' }} />
            <View style={{ flex: 1, backgroundColor: colors.greenLight, borderRadius: 4, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, height: '68%' }} />
            <View style={{ flex: 1, backgroundColor: colors.bg2, borderRadius: 4, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, height: '20%' }} />
            <View style={{ flex: 1, backgroundColor: colors.bg2, borderRadius: 4, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, height: '20%' }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <Text style={{ fontSize: 9, color: colors.t4 }}>Fasting</Text>
            <Text style={{ fontSize: 9, color: colors.t4 }}>Post-B'fast</Text>
            <Text style={{ fontSize: 9, color: colors.t4 }}>Pre-lunch</Text>
            <Text style={{ fontSize: 9, color: colors.t4 }}>Post-lunch</Text>
            <Text style={{ fontSize: 9, color: colors.t4 }}>Pre-dinner</Text>
            <Text style={{ fontSize: 9, color: colors.t4 }}>Bedtime</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 12 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', color: colors.t3 }}>Today's tip</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/tips')}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.green }}>See all 3</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/tips')} style={{ marginHorizontal: 16, marginBottom: 16, borderRadius: 24, overflow: 'hidden' }}>
          <LinearGradient colors={['#0B4D3B', '#1A6B52']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 20, position: 'relative', overflow: 'hidden' }}>
            <View style={{ position: 'absolute', top: -24, right: -24, width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(255,255,255,0.06)' }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 }}>
            <MaterialCommunityIcons name="pill" size={14} color="rgba(255,255,255,0.55)" />
            <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>Medication · Streak boost</Text>
          </View>
            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.92)', lineHeight: 22, marginBottom: 12 }}>Your 12-day streak is doing more than you think. Every consistent dose of Metformin quietly reduces how hard your liver works to release glucose at night.</Text>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 12 }}>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 18 }}>Metformin reduces hepatic glucose production by up to 30% when taken consistently for 2+ weeks.</Text>
            </View>
            <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>2 more tips today</Text>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>›</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 12 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', color: colors.t3 }}>Reminders</Text>
        </View>
        <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: colors.surface, borderRadius: 24, padding: 20, ...shadows.sm, borderWidth: 1, borderColor: 'rgba(11,77,59,0.06)' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.bg2 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <MaterialCommunityIcons name="pill" size={20} color={colors.green} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.t1 }}>Evening Metformin</Text>
              <Text style={{ fontSize: 12, color: colors.t3, marginTop: 1 }}>Due at 8:00 PM · Not yet taken</Text>
            </View>
            <View style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 50, backgroundColor: colors.goldLight }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#9A6200' }}>Pending</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.bg2 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.blueLight, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <MaterialCommunityIcons name="hospital-building" size={20} color="#3B82F6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.t1 }}>Follow-up appointment</Text>
              <Text style={{ fontSize: 12, color: colors.t3, marginTop: 1 }}>In 6 days · Black Lion Hospital</Text>
            </View>
            <View style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 50, backgroundColor: colors.greenLight }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.green }}>6 days</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.bg2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <MaterialCommunityIcons name="water" size={20} color={colors.t3} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.t1 }}>Bedtime glucose log</Text>
              <Text style={{ fontSize: 12, color: colors.t3, marginTop: 1 }}>Not yet logged today</Text>
            </View>
            <View style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 50, backgroundColor: colors.amberLight }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.amber }}>Tonight</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity onPress={() => router.push('/(tabs)/log')} style={{ position: 'absolute', right: 24, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', ...shadows.gold }}>
        <Text style={{ fontSize: 28, color: colors.t1, fontWeight: '200', lineHeight: 30 }}>+</Text>
      </TouchableOpacity>
    </View>
  );
}
