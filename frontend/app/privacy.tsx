import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { colors } from '../constants/theme';

export default function PrivacyScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
            <Feather name="arrow-left" size={22} color={colors.white} />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.white }}>{t('privacy.title')}</Text>
        </View>
      </View>
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <Text style={styles.sectionTitle}>1. Information We Collect</Text>
        <Text style={styles.text}>We collect personal information you provide: name, email address, password, age, weight, height, medical history, glucose readings, medication logs, symptoms, and lifestyle data.</Text>

        <Text style={styles.sectionTitle}>2. How We Use Your Data</Text>
        <Text style={styles.text}>Your data is used to generate personalized insights, tips, and reports for your diabetes management. We analyze patterns to provide educational content tailored to your condition.</Text>

        <Text style={styles.sectionTitle}>3. Data Storage & Security</Text>
        <Text style={styles.text}>Data is encrypted at rest and in transit. We use industry-standard security practices. Your data is stored on secure servers and is never sold or rented.</Text>

        <Text style={styles.sectionTitle}>4. Data Sharing</Text>
        <Text style={styles.text}>We do not share your personal health information with advertisers, marketers, or third parties. De-identified, aggregated data may be used for research purposes.</Text>

        <Text style={styles.sectionTitle}>5. Your Rights</Text>
        <Text style={styles.text}>You may request access to, correction of, or deletion of your data at any time. You can export your data or delete your account from the profile settings.</Text>

        <Text style={styles.sectionTitle}>6. Contact</Text>
        <Text style={styles.text}>For privacy-related inquiries, contact us at privacy@tenaai.com. We will respond within 30 days.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    backgroundColor: colors.green,
    paddingTop: 52,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  body: { flex: 1 },
  bodyContent: { padding: 24, paddingBottom: 48 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.t1,
    marginTop: 24,
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    color: colors.t2,
    lineHeight: 22,
  },
});
