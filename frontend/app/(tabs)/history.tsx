import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, shadows, borderRadius, spacing } from '../../constants/theme';
import Card from '../../components/Card';
import { historyService, GlucoseSummary, GlucoseChartPoint, AlertItem } from '../../services/history';
import { exportService } from '../../services/export';
import { medicationService, Medication } from '../../services/medication';

function getBarColor(value: number) {
  if (value > 180) return colors.red;
  if (value > 140) return colors.amber;
  if (value > 100) return colors.greenLight;
  return colors.green;
}

export default function HistoryScreen() {
  const router = useRouter();
  const [summary, setSummary] = useState<GlucoseSummary | null>(null);
  const [chartData, setChartData] = useState<GlucoseChartPoint[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [s, c, a, m] = await Promise.allSettled([
        historyService.getSummary(30),
        historyService.getGlucoseChart(30),
        historyService.getAlerts(30),
        medicationService.list(),
      ]);
      if (s.status === 'fulfilled') setSummary(s.value);
      if (c.status === 'fulfilled') setChartData(c.value);
      if (a.status === 'fulfilled') setAlerts(a.value);
      if (m.status === 'fulfilled') setMedications(m.value);
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

  const maxBarHeight = (val: number | null) => {
    if (val === null) return '10%';
    const pct = (val / 300) * 100;
    return `${Math.min(Math.max(pct, 10), 95)}%`;
  };

  const daysLogged = summary?.total_readings ? Math.min(summary.total_readings, 30) : 0;
  const adherence = Math.round((daysLogged / 30) * 100);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 52, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <View>
          <Text style={{ ...typography.title, color: colors.t1 }}>History</Text>
          <Text style={{ ...typography.small, color: colors.t3, marginTop: 2 }}>Last 30 days</Text>
        </View>
        <TouchableOpacity onPress={handleExport} disabled={exporting} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.greenLight, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 9999, opacity: exporting ? 0.6 : 1 }}>
          {exporting ? (
            <ActivityIndicator size="small" color={colors.green} />
          ) : (
            <Feather name="download" size={16} color={colors.green} />
          )}
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.green, marginLeft: 6 }}>{exporting ? 'Generating...' : 'Export PDF'}</Text>
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
              <Text style={{ fontSize: 22, fontWeight: '800', color: colors.green }}>{summary?.avg_readings?.Fasting ?? '—'}</Text>
              <Text style={{ fontSize: 10, color: colors.t3, marginTop: 2 }}>Avg fasting</Text>
              <Text style={{ fontSize: 9, color: colors.t4, marginTop: 1 }}>mg/dL</Text>
            </Card>
            <Card variant="sm" style={{ flex: 1, alignItems: 'center', ...shadows.sm }}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: colors.t1 }}>{daysLogged}</Text>
              <Text style={{ fontSize: 10, color: colors.t3, marginTop: 2 }}>Days logged</Text>
              <Text style={{ fontSize: 9, color: colors.t4, marginTop: 1 }}>of 30</Text>
            </Card>
            <Card variant="sm" style={{ flex: 1, alignItems: 'center', ...shadows.sm }}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: colors.green }}>{summary?.days_in_range ?? 0}</Text>
              <Text style={{ fontSize: 10, color: colors.t3, marginTop: 2 }}>In range</Text>
              <Text style={{ fontSize: 9, color: colors.t4, marginTop: 1 }}>days</Text>
            </Card>
          </View>

          <Text style={{ ...typography.subtitle, color: colors.t1, marginHorizontal: 16, marginBottom: 12 }}>30-day glucose trend</Text>
          <Card style={{ marginHorizontal: 16, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 80, marginBottom: 8 }}>
              {chartData.length > 0 ? (
                chartData.slice(0, 30).map((point, i) => (
                  <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                    <View style={{ width: '100%', backgroundColor: getBarColor(point.value), borderRadius: 4, height: maxBarHeight(point.value) }} />
                  </View>
                ))
              ) : (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: colors.t4 }}>No data yet</Text>
                </View>
              )}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 10, color: colors.t4 }}>{new Date(Date.now() - 30 * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
              <Text style={{ fontSize: 10, color: colors.t4 }}>{new Date(Date.now() - 15 * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
              <Text style={{ fontSize: 10, color: colors.t4 }}>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: colors.green }} />
                <Text style={{ fontSize: 11, color: colors.t3 }}>Normal</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: colors.red }} />
                <Text style={{ fontSize: 11, color: colors.t3 }}>High</Text>
              </View>
            </View>
          </Card>

          <Text style={{ ...typography.subtitle, color: colors.t1, marginHorizontal: 16, marginBottom: 12 }}>Medication adherence</Text>
          <Card style={{ marginHorizontal: 16, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.t1 }}>{medications.length > 0 ? medications[0].name : 'No medications'}</Text>
                <Text style={{ fontSize: 12, color: colors.t3, marginTop: 2 }}>{medications.length > 0 ? medications[0].frequency : 'Add medications to track'}</Text>
              </View>
              <View style={{ backgroundColor: colors.greenLight, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 50 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.green }}>{adherence}%</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
              {Array.from({ length: 30 }, (_, i) => {
                const day = i + 1;
                const isLogged = day <= daysLogged;
                const isUpcoming = day > daysLogged;
                return (
                  <View
                    key={day}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isLogged ? colors.green : isUpcoming ? colors.bg2 : colors.redLight,
                      borderWidth: !isLogged && !isUpcoming ? 1 : 0,
                      borderColor: colors.red,
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '600', color: isLogged ? colors.white : isUpcoming ? colors.t4 : colors.red }}>{day}</Text>
                  </View>
                );
              })}
            </View>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.green }} />
                <Text style={{ fontSize: 11, color: colors.t3 }}>Taken</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.redLight, borderWidth: 1, borderColor: colors.red }} />
                <Text style={{ fontSize: 11, color: colors.t3 }}>Missed</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.bg2 }} />
                <Text style={{ fontSize: 11, color: colors.t3 }}>Upcoming</Text>
              </View>
            </View>
          </Card>

          {alerts.length > 0 && (
            <>
              <Text style={{ ...typography.subtitle, color: colors.t1, marginHorizontal: 16, marginBottom: 12 }}>Alerts</Text>
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
                        <Text style={{ fontSize: 10, fontWeight: '700', color: alert.severity === 'urgent' ? colors.red : colors.amber }}>{alert.severity}</Text>
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
