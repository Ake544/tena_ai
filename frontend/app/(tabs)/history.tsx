import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Card from '../../components/Card';
import { colors, typography, shadows } from '../../constants/theme';
import { patientService, GlucoseStats } from '../../services/patient';

const barColors = ['#D94F3D', '#FDECEA', '#E3F0EB', '#0B4D3B'];

function getBarColor(value: number) {
  if (value > 180) return barColors[0];
  if (value > 140) return barColors[1];
  if (value > 100) return barColors[2];
  return barColors[3];
}

export default function HistoryScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<GlucoseStats | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [s, h] = await Promise.all([
        patientService.getStats(),
        patientService.getHistory(30),
      ]);
      setStats(s);
      setHistory(h?.logs || []);
    } catch (err) {
      console.log('Failed to load history', err);
    }
  };

  const daysLogged = stats?.days_logged ?? 0;
  const adherence = Math.round((daysLogged / 30) * 100);

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.title}>History</Text>
          <Text style={styles.titleSub}>Last 30 days</Text>
        </View>
        <TouchableOpacity onPress={() => {}} style={styles.exportBtn}>
            <Feather name="download" size={16} color={colors.green} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.green, marginLeft: 6 }}>Export PDF</Text>
          </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.statsGrid}>
          <Card variant="sm" style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.red }]}>{stats?.avg_fasting ?? '—'}</Text>
            <Text style={styles.statLabel}>Avg fasting</Text>
            <Text style={styles.statUnit}>mg/dL</Text>
          </Card>
          <Card variant="sm" style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.green }]}>{adherence}%</Text>
            <Text style={styles.statLabel}>Med adherence</Text>
            <Text style={styles.statUnit}>this month</Text>
          </Card>
          <Card variant="sm" style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.green }]}>{daysLogged}</Text>
            <Text style={styles.statLabel}>Days logged</Text>
            <Text style={styles.statUnit}>of 30</Text>
          </Card>
        </View>

        <Text style={styles.sectionTitle}>30-day glucose trend</Text>
        <Card style={styles.chartCard}>
          <View style={styles.chartBars}>
            {history.length > 0 ? (
              history.slice(0, 30).map((entry: any, i: number) => (
                <View key={i} style={[styles.bar, { height: `${Math.min((entry.value / 300) * 100, 95)}%` as any, backgroundColor: getBarColor(entry.value) }]} />
              ))
            ) : (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: colors.t4 }}>No data yet</Text>
              </View>
            )}
          </View>
          <View style={styles.chartLabels}>
            <Text style={styles.chartLabel}>{new Date(Date.now() - 30*86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
            <Text style={[styles.chartLabel, { flex: 1, textAlign: 'center' }]}>{new Date(Date.now() - 15*86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
            <Text style={styles.chartLabel}>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
          </View>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: colors.green }]} />
              <Text style={styles.legendText}>Normal</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: colors.red }]} />
              <Text style={styles.legendText}>High</Text>
            </View>
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Medication adherence</Text>
        <Card style={styles.medCard}>
          <View style={styles.medHeader}>
            <View>
              <Text style={styles.medName}>Metformin 500mg</Text>
              <Text style={styles.medSchedule}>Twice daily</Text>
            </View>
            <View style={styles.medBadge}>
              <Text style={styles.medBadgeText}>{adherence}%</Text>
            </View>
          </View>
          <View style={styles.medCalendar}>
            {Array.from({ length: 30 }, (_, i) => {
              const day = i + 1;
              const hasLog = history.some((h: any) => {
                const d = new Date(h.timestamp);
                return d.getDate() === day && (d.getMonth() === new Date().getMonth() || d.getMonth() === new Date(Date.now() - 30*86400000).getMonth());
              });
              const isUpcoming = day > daysLogged;
              const isMissed = !hasLog && !isUpcoming;
              let status = 'taken';
              if (isUpcoming) status = 'upcoming';
              else if (isMissed) status = 'missed';
              return (
                <View
                  key={day}
                  style={[
                    styles.medDay,
                    status === 'taken' && styles.medDayTaken,
                    status === 'missed' && styles.medDayMissed,
                    status === 'upcoming' && styles.medDayUpcoming,
                  ]}
                >
                  <Text
                    style={[
                      styles.medDayText,
                      status === 'taken' && styles.medDayTextTaken,
                      status === 'missed' && styles.medDayTextMissed,
                      status === 'upcoming' && styles.medDayTextUpcoming,
                    ]}
                  >
                    {day}
                  </Text>
                </View>
              );
            })}
          </View>
          <View style={styles.medLegend}>
            <View style={styles.medLegendItem}>
              <View style={[styles.medLegendDot, { backgroundColor: colors.green }]} />
              <Text style={styles.medLegendText}>Taken</Text>
            </View>
            <View style={styles.medLegendItem}>
              <View style={[styles.medLegendDot, { backgroundColor: colors.redLight, borderWidth: 1, borderColor: colors.red }]} />
              <Text style={styles.medLegendText}>Missed</Text>
            </View>
            <View style={styles.medLegendItem}>
              <View style={[styles.medLegendDot, { backgroundColor: colors.bg2 }]} />
              <Text style={styles.medLegendText}>Upcoming</Text>
            </View>
          </View>
        </Card>

        {stats && stats.today_high_count > 0 && (
          <>
            <Text style={styles.sectionTitle}>Alerts & episodes</Text>
            <Card>
              <View style={styles.alertRow}>
                <View style={styles.alertIcon}><Feather name="alert-triangle" size={20} color={colors.red} /></View>
                <View style={styles.alertInfo}>
                  <Text style={styles.alertTitle}>High glucose today</Text>
                  <Text style={styles.alertSub}>{stats.today_high_count} readings above 180 mg/dL</Text>
                </View>
                <View style={[styles.alertBadge, { backgroundColor: colors.redLight }]}>
                  <Text style={[styles.alertBadgeText, { color: colors.red }]}>Urgent</Text>
                </View>
              </View>
            </Card>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  titleRow: {
    paddingHorizontal: 24,
    paddingTop: 52,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  title: {
    ...typography.title,
    color: colors.t1,
  },
  titleSub: {
    ...typography.small,
    color: colors.t3,
    marginTop: 2,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.greenLight,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 9999,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 96,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    ...shadows.sm,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 10,
    color: colors.t3,
    marginTop: 2,
  },
  statUnit: {
    fontSize: 9,
    color: colors.t4,
    marginTop: 1,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.t1,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  chartCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 80,
    marginBottom: 8,
  },
  bar: {
    flex: 1,
    borderRadius: 4,
    minHeight: 4,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  chartLabel: {
    fontSize: 10,
    color: colors.t4,
  },
  legend: {
    flexDirection: 'row',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBox: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 11,
    color: colors.t3,
  },
  medCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  medHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  medName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.t1,
  },
  medSchedule: {
    fontSize: 12,
    color: colors.t3,
    marginTop: 2,
  },
  medBadge: {
    backgroundColor: colors.greenLight,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 50,
  },
  medBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.green,
  },
  medCalendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 12,
  },
  medDay: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medDayTaken: {
    backgroundColor: colors.green,
  },
  medDayMissed: {
    backgroundColor: colors.redLight,
    borderWidth: 1,
    borderColor: colors.red,
  },
  medDayUpcoming: {
    backgroundColor: colors.bg2,
  },
  medDayText: {
    fontSize: 11,
    fontWeight: '600',
  },
  medDayTextTaken: {
    color: colors.white,
  },
  medDayTextMissed: {
    color: colors.red,
  },
  medDayTextUpcoming: {
    color: colors.t4,
  },
  medLegend: {
    flexDirection: 'row',
    gap: 16,
  },
  medLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  medLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  medLegendText: {
    fontSize: 11,
    color: colors.t3,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  alertIcon: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertInfo: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.t1,
  },
  alertSub: {
    fontSize: 11,
    color: colors.t3,
    marginTop: 2,
  },
  alertBadge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 50,
  },
  alertBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  alertDivider: {
    height: 1,
    backgroundColor: colors.bg2,
  },
});
