import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Card from '../../components/Card';
import { colors, typography, shadows } from '../../constants/theme';
import { authService } from '../../services/auth';

export default function ProfileScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    await authService.logout();
    router.replace('/(auth)/splash');
  };

  return (
    <View style={styles.container}>
      <View style={styles.greenHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>AB</Text>
        </View>
        <Text style={styles.name}>Abebe Bekele</Text>
        <Text style={styles.subtitle}>Type 2 DM · Since 2021</Text>
        <View style={styles.badgeRow}>
          <View style={styles.badgePill}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <MaterialCommunityIcons name="leaf" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.badgePillText}>Low awareness</Text>
            </View>
          </View>
          <View style={styles.badgePill}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Feather name="flag" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.badgePillText}>Amharic</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.statsGrid}>
          <Card variant="sm" style={styles.statCard}>
            <Text style={styles.statLabel}>Age</Text>
            <Text style={styles.statValue}>47 <Text style={styles.statUnit}>yrs</Text></Text>
          </Card>
          <Card variant="sm" style={styles.statCard}>
            <Text style={styles.statLabel}>BMI</Text>
            <Text style={styles.statValue}>27.4</Text>
          </Card>
          <Card variant="sm" style={styles.statCard}>
            <Text style={styles.statLabel}>Weight</Text>
            <Text style={styles.statValue}>78 <Text style={styles.statUnit}>kg</Text></Text>
          </Card>
          <Card variant="sm" style={styles.statCard}>
            <Text style={styles.statLabel}>Height</Text>
            <Text style={styles.statValue}>169 <Text style={styles.statUnit}>cm</Text></Text>
          </Card>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Medical info</Text>
          <Text style={styles.editLink}>Edit</Text>
        </View>
        <Card style={styles.sectionCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}><MaterialCommunityIcons name="pill" size={20} color={colors.green} /></View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Metformin 500mg</Text>
              <Text style={styles.infoSub}>Twice daily · No side effects</Text>
            </View>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}><MaterialCommunityIcons name="dna" size={20} color={colors.green} /></View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Family history</Text>
              <Text style={styles.infoSub}>Father · Type 2 diabetes</Text>
            </View>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}><Feather name="x-circle" size={20} color={colors.t3} /></View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Allergies</Text>
              <Text style={styles.infoSub}>None reported</Text>
            </View>
          </View>
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Lifestyle</Text>
          <Text style={styles.editLink}>Edit</Text>
        </View>
        <Card style={styles.sectionCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}><MaterialCommunityIcons name="walk" size={20} color={colors.green} /></View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Exercise</Text>
              <Text style={styles.infoSub}>Walking · 3×/week · 30 min</Text>
            </View>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}><MaterialCommunityIcons name="food" size={20} color={colors.green} /></View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Staple diet</Text>
              <Text style={styles.infoSub}>Injera · Light snacking</Text>
            </View>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}><MaterialCommunityIcons name="smoking-off" size={20} color={colors.t3} /></View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Substances</Text>
              <Text style={styles.infoSub}>No alcohol · Non-smoker</Text>
            </View>
          </View>
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Settings</Text>
        </View>
        <Card style={styles.sectionCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingIcon}><Feather name="bell" size={20} color={colors.t1} /></View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Medication reminder</Text>
              <Text style={styles.settingSub}>8:00 AM & 8:00 PM · 2 active</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.settingRow}>
            <View style={styles.settingIcon}><Feather name="globe" size={20} color={colors.t1} /></View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Language</Text>
              <Text style={styles.settingSub}>አማርኛ (Amharic)</Text>
            </View>
            <Text style={styles.changeBtn}>Change</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.settingRow}>
            <View style={styles.settingIcon}><Feather name="calendar" size={20} color={colors.t1} /></View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Appointments</Text>
              <Text style={styles.settingSub}>2 upcoming · Next in 6 days</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.settingRow} onTouchEnd={handleLogout}>
            <View style={styles.settingIcon}><Feather name="log-out" size={20} color={colors.red} /></View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, { color: colors.red }]}>Sign out</Text>
              <Text style={styles.settingSub}>You'll need to sign back in</Text>
            </View>
            <Text style={[styles.chevron, { color: colors.red }]}>›</Text>
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
  greenHeader: {
    backgroundColor: colors.green,
    paddingTop: 52,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.white,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.white,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 12,
  },
  badgePill: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 50,
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
    marginTop: 16,
  },
  statCard: {
    width: '47%',
    flexGrow: 1,
    ...shadows.sm,
  },
  statLabel: {
    fontSize: 11,
    color: colors.t3,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.t1,
  },
  statUnit: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.t3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.t1,
  },
  editLink: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  sectionCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  infoIcon: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.t1,
  },
  infoSub: {
    fontSize: 12,
    color: colors.t3,
    marginTop: 2,
  },
  infoDivider: {
    height: 1,
    backgroundColor: colors.bg2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  settingIcon: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.t1,
  },
  settingSub: {
    fontSize: 12,
    color: colors.t3,
    marginTop: 2,
  },
  chevron: {
    fontSize: 22,
    color: colors.t3,
    fontWeight: '300',
  },
  changeBtn: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
});
