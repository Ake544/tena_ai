import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, shadows, borderRadius } from '../constants/theme';
import { patientService, PatientProfile, GlucoseStats } from '../services/patient';
import { medicationService, Medication } from '../services/medication';

export default function PdfPreviewScreen() {
  const { t } = useTranslation();
  const { url } = useLocalSearchParams<{ url: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [stats, setStats] = useState<GlucoseStats | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [p, s, m] = await Promise.allSettled([
        patientService.getProfile(),
        patientService.getStats(),
        medicationService.list(),
      ]);
      if (p.status === 'fulfilled') setProfile(p.value);
      if (s.status === 'fulfilled') setStats(s.value);
      if (m.status === 'fulfilled') setMedications(m.value);
    } catch {}
  };

  const handleDownload = async () => {
    if (!url) return;
    setDownloading(true);
try {
        const FileSystem = await import('expo-file-system/legacy');
        const fileUri = FileSystem.documentDirectory + 'tena-report.pdf';
        await FileSystem.downloadAsync(url, fileUri);
      Alert.alert(t('export.downloaded'), `${t('export.downloadedTo')} ${fileUri}`);
    } catch (err) {
      Alert.alert(t('common.error'), t('export.errorDownload'));
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!url) return;
    try {
      const Sharing = await import('expo-sharing');
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(t('export.shareUnavailable'), t('export.shareUnavailableMsg'));
        return;
      }
      const FileSystem = await import('expo-file-system/legacy');
      const fileUri = FileSystem.documentDirectory + 'tena-report.pdf';
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        setDownloading(true);
        await FileSystem.downloadAsync(url, fileUri);
        setDownloading(false);
      }
      await Sharing.shareAsync(fileUri);
    } catch (err) {
      Alert.alert(t('common.error'), t('export.errorShare'));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <LinearGradient colors={[colors.green, '#071F18']} style={{ paddingTop: 52, paddingHorizontal: 24, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="arrow-left" size={18} color={colors.white} />
          </TouchableOpacity>
          <Text style={{ fontSize: 17, fontWeight: '700', color: colors.white }}>{t('export.title')}</Text>
        </View>
        <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{t('export.subtitle')}</Text>
      </LinearGradient>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View style={{ backgroundColor: colors.surface, borderRadius: 24, padding: 20, marginBottom: 16, ...shadows.sm, borderWidth: 1, borderColor: 'rgba(11,77,59,0.06)' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="file-pdf-box" size={24} color={colors.green} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.t1 }}>{t('export.reportTitle')}</Text>
              <Text style={{ fontSize: 12, color: colors.t3, marginTop: 2 }}>{t('export.summary')}</Text>
            </View>
          </View>

          {profile && (
            <View style={{ backgroundColor: colors.bg2, borderRadius: 16, padding: 14, marginBottom: 16 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.t3, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>{t('export.patientInfo')}</Text>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.t1 }}>{profile.full_name}</Text>
              {profile.age && <Text style={{ fontSize: 13, color: colors.t2, marginTop: 2 }}>{t('export.age')} {profile.age}</Text>}
              {profile.sex && <Text style={{ fontSize: 13, color: colors.t2, marginTop: 2 }}>{t('export.sex')} {profile.sex}</Text>}
            </View>
          )}

          {stats && (
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.t3, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>{t('export.glucoseStats')}</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1, backgroundColor: colors.greenLight, borderRadius: 12, padding: 12, alignItems: 'center' }}>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: colors.green }}>{stats.avg_fasting ?? '—'}</Text>
                  <Text style={{ fontSize: 10, color: colors.t3, marginTop: 2 }}>{t('export.avgFasting')}</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: colors.bg2, borderRadius: 12, padding: 12, alignItems: 'center' }}>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: colors.t1 }}>{stats.days_logged ?? 0}</Text>
                  <Text style={{ fontSize: 10, color: colors.t3, marginTop: 2 }}>{t('export.daysLogged')}</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: colors.goldLight, borderRadius: 12, padding: 12, alignItems: 'center' }}>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: colors.gold }}>{stats.last_glucose ?? '—'}</Text>
                  <Text style={{ fontSize: 10, color: colors.t3, marginTop: 2 }}>{t('export.lastReading')}</Text>
                </View>
              </View>
            </View>
          )}

          {medications.length > 0 && (
            <View>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.t3, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>{t('medications.title')}</Text>
              {medications.map((med) => (
                <View key={med.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.bg2 }}>
                  <MaterialCommunityIcons name="pill" size={16} color={colors.green} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: colors.t1 }}>{med.name} {med.dose}</Text>
                    <Text style={{ fontSize: 11, color: colors.t3 }}>{med.frequency}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={{ backgroundColor: colors.surface, borderRadius: 24, padding: 20, marginBottom: 16, ...shadows.sm, borderWidth: 1, borderColor: 'rgba(11,77,59,0.06)' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Feather name="info" size={16} color={colors.green} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.t1 }}>{t('export.reportIncludes')}</Text>
          </View>
          <Text style={{ fontSize: 12, color: colors.t3, lineHeight: 20 }}>{t('export.bulletChart')}{'\n'}{t('export.bulletReadings')}{'\n'}{t('export.bulletMeds')}{'\n'}{t('export.bulletSymptoms')}</Text>
        </View>

        <TouchableOpacity
          onPress={handleDownload}
          disabled={downloading || !url}
          style={{ backgroundColor: colors.green, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12, ...shadows.green, opacity: downloading || !url ? 0.6 : 1 }}
        >
          {downloading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Feather name="download" size={18} color={colors.white} />
          )}
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.white }}>{downloading ? t('export.downloading') : t('export.download')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleShare}
          disabled={!url}
          style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: colors.green, opacity: !url ? 0.6 : 1 }}
        >
          <Feather name="share" size={18} color={colors.green} />
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.green }}>{t('export.share')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
