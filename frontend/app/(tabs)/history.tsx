import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { colors, typography, shadows } from '../../constants/theme';

const barData = [65, 72, 58, 85, 78, 62, 90, 75, 68, 82, 55, 70, 88, 60];
const barColors = ['#D94F3D', '#FDECEA', '#E3F0EB', '#0B4D3B'];

function getBarColor(height: number) {
  if (height >= 80) return barColors[0];
  if (height >= 70) return barColors[1];
  if (height >= 60) return barColors[2];
  return barColors[3];
}

const medicationDays = Array.from({ length: 30 }, (_, i) => {
  const day = i + 1;
  if (day > 22) return { label: String(day), status: 'upcoming' };
  if (day === 5 || day === 10 || day === 15) return { label: String(day), status: 'missed' };
  return { label: String(day), status: 'taken' };
});

export default function HistoryScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.statusBar}>
        <Text style={styles.statusTime}>9:41</Text>
        <View style={styles.statusIcons}>
          <Text style={styles.statusIcon}>●●●●○</Text>
        </View>
      </View>

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
            <Text style={[styles.statValue, { color: colors.red }]}>198</Text>
            <Text style={styles.statLabel}>Avg fasting</Text>
            <Text style={styles.statUnit}>mg/dL</Text>
          </Card>
          <Card variant="sm" style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.green }]}>86%</Text>
            <Text style={styles.statLabel}>Med adherence</Text>
            <Text style={styles.statUnit}>this month</Text>
          </Card>
          <Card variant="sm" style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.green }]}>23</Text>
            <Text style={styles.statLabel}>Days logged</Text>
            <Text style={styles.statUnit}>of 30</Text>
          </Card>
        </View>

        <Text style={styles.sectionTitle}>30-day fasting trend</Text>
        <Card style={styles.chartCard}>
          <View style={styles.chartBars}>
            {barData.map((h, i) => (
              <View key={i} style={[styles.bar, { height: `${h}%` as any, backgroundColor: getBarColor(h) }]} />
            ))}
          </View>
          <View style={styles.chartLabels}>
            <Text style={styles.chartLabel}>Apr 19</Text>
            <Text style={[styles.chartLabel, { flex: 1, textAlign: 'center' }]}>May 4</Text>
            <Text style={styles.chartLabel}>May 19</Text>
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
              <Text style={styles.medBadgeText}>86%</Text>
            </View>
          </View>
          <View style={styles.medCalendar}>
            {medicationDays.map((day) => (
              <View
                key={day.label}
                style={[
                  styles.medDay,
                  day.status === 'taken' && styles.medDayTaken,
                  day.status === 'missed' && styles.medDayMissed,
                  day.status === 'upcoming' && styles.medDayUpcoming,
                ]}
              >
                <Text
                  style={[
                    styles.medDayText,
                    day.status === 'taken' && styles.medDayTextTaken,
                    day.status === 'missed' && styles.medDayTextMissed,
                    day.status === 'upcoming' && styles.medDayTextUpcoming,
                  ]}
                >
                  {day.label}
                </Text>
              </View>
            ))}
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

        <Text style={styles.sectionTitle}>Alerts & episodes</Text>
        <Card>
          <View style={styles.alertRow}>
            <View style={styles.alertIcon}><Feather name="alert-triangle" size={20} color={colors.red} /></View>
            <View style={styles.alertInfo}>
              <Text style={styles.alertTitle}>High glucose streak</Text>
              <Text style={styles.alertSub}>May 17-19 · Fasting &gt; 230 mg/dL</Text>
            </View>
            <View style={[styles.alertBadge, { backgroundColor: colors.redLight }]}>
              <Text style={[styles.alertBadgeText, { color: colors.red }]}>Urgent</Text>
            </View>
          </View>
          <View style={styles.alertDivider} />
          <View style={styles.alertRow}>
            <View style={styles.alertIcon}><MaterialCommunityIcons name="pill" size={20} color={colors.t3} /></View>
            <View style={styles.alertInfo}>
              <Text style={styles.alertTitle}>Missed medication</Text>
              <Text style={styles.alertSub}>May 14 · Evening dose</Text>
            </View>
            <View style={[styles.alertBadge, { backgroundColor: colors.amberLight }]}>
              <Text style={[styles.alertBadgeText, { color: colors.amber }]}>Warning</Text>
            </View>
          </View>
          <View style={styles.alertDivider} />
          <View style={styles.alertRow}>
            <View style={styles.alertIcon}><Feather name="info" size={20} color={colors.blue} /></View>
            <View style={styles.alertInfo}>
              <Text style={styles.alertTitle}>3 days without logging</Text>
              <Text style={styles.alertSub}>May 9-11</Text>
            </View>
            <View style={[styles.alertBadge, { backgroundColor: colors.blueLight }]}>
              <Text style={[styles.alertBadgeText, { color: colors.blue }]}>Info</Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 4,
  },
  statusTime: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.t1,
  },
  statusIcons: {
    flexDirection: 'row',
    gap: 2,
  },
  statusIcon: {
    fontSize: 10,
    color: colors.t1,
    letterSpacing: 1,
  },
  titleRow: {
    paddingHorizontal: 24,
    paddingTop: 8,
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
    paddingBottom: 24,
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
