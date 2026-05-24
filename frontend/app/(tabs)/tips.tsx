import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Card from '../../components/Card';
import { colors, typography } from '../../constants/theme';

const { width } = Dimensions.get('window');

const barData = [65, 72, 58, 85, 78, 62, 90, 75, 68, 82, 55, 70, 88, 60];

export default function TipsScreen() {
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
          <Text style={styles.title}>Daily tips</Text>
          <Text style={styles.titleSub}>3 tips today · Low awareness</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>3 new</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <LinearGradient colors={['#0B4D3B', '#1A6B52']} style={styles.tipCard}>
          <View style={[styles.decorCircle, { bottom: -20, right: -20 }]} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 }}>
            <MaterialCommunityIcons name="pill" size={14} color="rgba(255,255,255,0.5)" />
            <Text style={styles.tipLabel}>Medication · Streak reinforcement</Text>
          </View>
          <Text style={styles.tipBody}>Taking your medication consistently is the single most important habit for managing diabetes. Every dose you take on time builds a streak that keeps your blood sugar stable and reduces long-term complications.</Text>
          <View style={styles.factBox}>
            <Text style={styles.factText}>Fact: Patients who maintain a 7-day medication streak are 3× more likely to reach their target HbA1c within 3 months.</Text>
          </View>
        </LinearGradient>

        <LinearGradient colors={['#8B5A00', '#C47A20']} style={styles.tipCard}>
          <View style={[styles.decorCircle, { top: -20, left: -20 }]} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 }}>
            <Feather name="bar-chart-2" size={14} color="rgba(255,255,255,0.5)" />
            <Text style={styles.tipLabel}>Glucose · Consequence story</Text>
          </View>
          <Text style={styles.tipBody}>When blood sugar stays high for extended periods, it damages blood vessels and nerves. Over time, this can lead to serious complications affecting your eyes, kidneys, and feet.</Text>
          <View style={styles.factBox}>
            <Text style={styles.factText}>Fact: Uncontrolled glucose above 240 mg/dL for 3+ days increases infection risk by 40%. Consistent tracking helps you spot trends early.</Text>
          </View>
        </LinearGradient>

        <LinearGradient colors={['#1A3D6B', '#2A6DB5']} style={styles.tipCard}>
          <View style={[styles.decorCircle, { bottom: -20, right: -20 }]} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 }}>
            <MaterialCommunityIcons name="food" size={14} color="rgba(255,255,255,0.5)" />
            <Text style={styles.tipLabel}>Diet · Ethiopian context</Text>
          </View>
          <Text style={styles.tipBody}>Injera is a staple in Ethiopian cuisine, but its high carbohydrate content can spike blood sugar. Pairing it with protein-rich stews and fibrous vegetables helps slow glucose absorption.</Text>
          <View style={styles.factBox}>
            <Text style={styles.factText}>Fact: A single piece of injera (100g) contains ~48g of carbs. Balancing your plate with shiro, gomen, or lean meat can reduce the glycemic impact by up to 30%.</Text>
          </View>
        </LinearGradient>

        <Text style={styles.sectionTitle}>Previous tips</Text>

        <Card>
          <View style={styles.prevTipRow}>
            <View style={[styles.prevTipIcon, { backgroundColor: colors.greenLight }]}>
              <MaterialCommunityIcons name="walk" size={20} color={colors.green} />
            </View>
            <View style={styles.prevTipInfo}>
              <Text style={styles.prevTipName}>Walking lowers blood sugar</Text>
              <Text style={styles.prevTipSub}>Yesterday · Reinforcement</Text>
            </View>
          </View>
          <View style={styles.prevTipDivider} />
          <View style={styles.prevTipRow}>
            <View style={[styles.prevTipIcon, { backgroundColor: colors.amberLight }]}>
              <Feather name="zap" size={20} color={'#9A6200'} />
            </View>
            <View style={styles.prevTipInfo}>
              <Text style={styles.prevTipName}>Missing one dose — what really happens</Text>
              <Text style={styles.prevTipSub}>2 days ago · Consequence</Text>
            </View>
          </View>
          <View style={styles.prevTipDivider} />
          <View style={styles.prevTipRow}>
            <View style={[styles.prevTipIcon, { backgroundColor: colors.blueLight }]}>
              <MaterialCommunityIcons name="water" size={20} color="#3B82F6" />
            </View>
            <View style={styles.prevTipInfo}>
              <Text style={styles.prevTipName}>Why thirst is your body's signal</Text>
              <Text style={styles.prevTipSub}>3 days ago · Educational</Text>
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
  badge: {
    backgroundColor: colors.goldLight,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 50,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9A6200',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  tipCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 20,
    position: 'relative',
  },
  decorCircle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  tipLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 8,
  },
  tipBody: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.92)',
    lineHeight: 23,
    marginBottom: 12,
  },
  factBox: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 12,
  },
  factText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.78)',
    lineHeight: 18,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.t1,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  prevTipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  prevTipIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prevTipInfo: {
    flex: 1,
  },
  prevTipName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.t1,
  },
  prevTipSub: {
    fontSize: 12,
    color: colors.t3,
    marginTop: 2,
  },
  prevTipDivider: {
    height: 1,
    backgroundColor: colors.bg2,
  },
});
