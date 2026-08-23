import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, shadows } from '../../constants/theme';
import Card from '../../components/Card';
import { historyService, GlucoseSummary, AlertItem } from '../../services/history';
import { exportService } from '../../services/export';
import { symptomService, SymptomLog } from '../../services/symptom';

const SLOT_ORDER = ['Fasting', 'Post-Breakfast', 'Pre-Lunch', 'Post-Lunch', 'Pre-Dinner', 'Post-Dinner', 'Bedtime'];

function slotColor(val: number | null) {
  if (val === null) return colors.t4;
  if (val > 180) return colors.red;
  if (val > 140) return colors.amber;
  if (val < 70) return '#D94F3D';
  return colors.green;
}

export default function HistoryScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [summary, setSummary] = useState<GlucoseSummary | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [symptoms, setSymptoms] = useState<SymptomLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [s, a, sy] = await Promise.allSettled([
        historyService.getSummary(30),
        historyService.getAlerts(30),
        symptomService.history(30),
      ]);
      if (s.status === 'fulfilled') setSummary(s.value);
      if (a.status === 'fulfilled') setAlerts(a.value);
      if (sy.status === 'fulfilled') setSymptoms(sy.value);
    } catch (err) {
      console.log('Failed to load history', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const url = await exportService.generatePdf(90);
      router.push({ pathname: '/pdf-preview', params: { url } });
    } catch (err) {
      console.log('Export failed', err);
    } finally {
      setExporting(false);
    }
  };

  const daysLogged = summary?.total_readings ? Math.min(summary.total_readings, 30) : 0;

  const slotEntries = SLOT_ORDER
    .map(name => ({ name, avg: summary?.avg_readings?.[name] ?? null }))
    .filter(s => s.avg !== null);

  const symptomFreq: { name: string; count: number; avgSev: number }[] = [];
  if (symptoms.length > 0) {
    const map = new Map<string, { total: number; sevSum: number; count: number }>();
    for (const s of symptoms) {
      const key = s.name.toLowerCase();
      const existing = map.get(key) || { total: 0, sevSum: 0, count: 0 };
      existing.total++;
      existing.sevSum += s.severity ?? 0;
      existing.count++;
      map.set(key, existing);
    }
    for (const [name, data] of map) {
      symptomFreq.push({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        count: data.total,
        avgSev: data.count > 0 ? Math.round((data.sevSum / data.count) * 10) / 10 : 0,
      });
    }
    symptomFreq.sort((a, b) => b.count - a.count);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 52, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <View>
          <Text style={{ ...typography.title, color: colors.t1 }}>{t('history.title')}</Text>
          <Text style={{ ...typography.small, color: colors.t3, marginTop: 2 }}>{t('history.last30Days')}</Text>
        </View>
        <TouchableOpacity onPress={handleExport} disabled={exporting} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.greenLight, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 9999, opacity: exporting ? 0.6 : 1 }}>
          {exporting ? (
            <ActivityIndicator size="small" color={colors.green} />
          ) : (
            <Feather name="download" size={16} color={colors.green} />
          )}
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.green, marginLeft: 6 }}>{exporting ? t('history.exporting') : t('history.exportReport')}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.green} />
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 96 }}>
          <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 16 }}>
            <Card variant="sm" style={{ flex: 1, alignItems: 'center', ...shadows.sm }}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: colors.green }}>{summary?.days_in_range ?? 0}</Text>
              <Text style={{ fontSize: 10, color: colors.t3, marginTop: 2 }}>{t('history.inRange')}</Text>
              <Text style={{ fontSize: 9, color: colors.t4, marginTop: 1 }}>days</Text>
            </Card>
            <Card variant="sm" style={{ flex: 1, alignItems: 'center', ...shadows.sm }}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: colors.red }}>{summary?.days_high ?? 0}</Text>
              <Text style={{ fontSize: 10, color: colors.t3, marginTop: 2 }}>{t('history.daysHigh')}</Text>
              <Text style={{ fontSize: 9, color: colors.t4, marginTop: 1 }}>days</Text>
            </Card>
            <Card variant="sm" style={{ flex: 1, alignItems: 'center', ...shadows.sm }}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#D94F3D' }}>{summary?.days_low ?? 0}</Text>
              <Text style={{ fontSize: 10, color: colors.t3, marginTop: 2 }}>{t('history.daysLow')}</Text>
              <Text style={{ fontSize: 9, color: colors.t4, marginTop: 1 }}>days</Text>
            </Card>
          </View>

          {slotEntries.length > 0 && (
            <>
              <Text style={{ ...typography.subtitle, color: colors.t1, marginHorizontal: 16, marginBottom: 12 }}>{t('history.glucoseBySlot')}</Text>
              <Card style={{ marginHorizontal: 16, marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {slotEntries.map((slot) => (
                    <View key={slot.name} style={{ width: '30%', minWidth: 90, alignItems: 'center', paddingVertical: 10, backgroundColor: colors.bg2, borderRadius: 12 }}>
                      <Text style={{ fontSize: 18, fontWeight: '800', color: slotColor(slot.avg), fontVariant: ['tabular-nums'] }}>{slot.avg}</Text>
                      <Text style={{ fontSize: 9, color: colors.t3, marginTop: 4, textAlign: 'center' }}>{slot.name}</Text>
                      <Text style={{ fontSize: 8, color: colors.t4 }}>mg/dL</Text>
                    </View>
                  ))}
                </View>
              </Card>
            </>
          )}

          {symptomFreq.length > 0 && (
            <>
              <Text style={{ ...typography.subtitle, color: colors.t1, marginHorizontal: 16, marginBottom: 12 }}>{t('history.symptoms')}</Text>
              <Card style={{ marginHorizontal: 16, marginBottom: 16 }}>
                {symptomFreq.slice(0, 5).map((s, i) => (
                  <View key={s.name} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: i < Math.min(symptomFreq.length, 5) - 1 ? 1 : 0, borderBottomColor: colors.bg2 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.t1 }}>{s.name}</Text>
                      <Text style={{ fontSize: 11, color: colors.t3, marginTop: 2 }}>{s.count} {s.count === 1 ? 'time' : 'times'}</Text>
                    </View>
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: s.avgSev >= 7 ? colors.red : s.avgSev >= 4 ? colors.amber : colors.green }}>{s.avgSev}</Text>
                      <Text style={{ fontSize: 9, color: colors.t4 }}>/10</Text>
                    </View>
                  </View>
                ))}
              </Card>
            </>
          )}

          {alerts.length > 0 && (
            <>
              <Text style={{ ...typography.subtitle, color: colors.t1, marginHorizontal: 16, marginBottom: 12 }}>{t('history.alerts')}</Text>
              {alerts.map((alert) => (
                <TouchableOpacity key={alert.id} onPress={() => router.push(`/alert-detail?id=${alert.id}`)}>
                  <Card style={{ marginHorizontal: 16, marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}>
                      <View style={{ width: 32, alignItems: 'center', justifyContent: 'center' }}>
                        <Feather name={alert.severity === 'urgent' ? 'alert-triangle' : 'alert-circle'} size={20} color={alert.severity === 'urgent' ? colors.red : colors.amber} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.t1 }}>{alert.title}</Text>
                        <Text style={{ fontSize: 11, color: colors.t3, marginTop: 2 }}>{alert.body}</Text>
                      </View>
                      <View style={{ paddingVertical: 3, paddingHorizontal: 10, borderRadius: 50, backgroundColor: alert.severity === 'urgent' ? colors.redLight : colors.amberLight }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: alert.severity === 'urgent' ? colors.red : colors.amber }}>{alert.severity === 'urgent' ? t('history.urgent') : t('history.warning')}</Text>
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}
