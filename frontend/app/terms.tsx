import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { colors } from '../constants/theme';

export default function TermsScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
            <Feather name="arrow-left" size={22} color={colors.white} />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.white }}>{t('terms.title')}</Text>
        </View>
      </View>
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.text}>By downloading, installing, or using Tenachin AI, you agree to these Terms of Service. If you do not agree, do not use the service.</Text>

        <Text style={styles.sectionTitle}>2. Eligibility</Text>
        <Text style={styles.text}>The app is intended for adults aged 18 and older. By using it you confirm that you are at least 18 years old.</Text>

        <Text style={styles.sectionTitle}>3. What the App Does</Text>
        <Text style={styles.text}>Tenachin AI helps you log glucose readings, track medications, set appointment reminders, monitor symptoms, and generate a PDF report for your doctor. It provides daily AI-generated tips based on the data you enter.</Text>

        <Text style={styles.sectionTitle}>4. Not a Medical Device</Text>
        <Text style={styles.text}>Tenachin AI is a tracking and educational tool. It does not diagnose any medical condition, does not prescribe or change medication doses, and is not a replacement for a qualified clinician. Always follow the treatment plan given by your doctor. In a medical emergency, contact your health facility or emergency services immediately.</Text>

        <Text style={styles.sectionTitle}>5. Your Responsibilities</Text>
        <Text style={styles.text}>Enter your readings and health information as accurately as you can. Keep your login details safe and do not share your account. Use the app lawfully and do not attempt to disrupt, reverse-engineer, or abuse the service.</Text>

        <Text style={styles.sectionTitle}>6. Your Data Belongs to You</Text>
        <Text style={styles.text}>You retain ownership of the health data you enter. We use it only to provide and improve the service, as described in our Privacy Policy, and we never sell it.</Text>

        <Text style={styles.sectionTitle}>7. Intellectual Property</Text>
        <Text style={styles.text}>The app, its design, and its software are owned by Tenachin AI. Nothing in these terms transfers any ownership of the app to you. Your data remains yours.</Text>

        <Text style={styles.sectionTitle}>8. Availability and Changes</Text>
        <Text style={styles.text}>The app is free and provided "as is". We may update features, fix bugs, or change the service over time, and we make no guarantee that the service will be uninterrupted or error-free. We may suspend or close accounts that violate these terms.</Text>

        <Text style={styles.sectionTitle}>9. Disclaimer of Warranties</Text>
        <Text style={styles.text}>To the maximum extent permitted by law, Tenachin AI is provided without warranties of any kind. Health decisions are made by you and your clinician, not by us.</Text>

        <Text style={styles.sectionTitle}>10. Limitation of Liability</Text>
        <Text style={styles.text}>To the maximum extent permitted by law, Tenachin AI is not liable for any indirect, incidental, or consequential damages arising from your use of the app, including decisions made based on the information it provides.</Text>

        <Text style={styles.sectionTitle}>11. Governing Law</Text>
        <Text style={styles.text}>These terms are governed by the laws of the Federal Democratic Republic of Ethiopia, without regard to conflict-of-laws rules. Any disputes shall be subject to the jurisdiction of the courts of Addis Ababa.</Text>

        <Text style={styles.sectionTitle}>12. Changes to These Terms</Text>
        <Text style={styles.text}>We may update these terms from time to time. The latest version will always be available in the app and on our website.</Text>

        <Text style={styles.sectionTitle}>13. Contact</Text>
        <Text style={styles.text}>Questions about these terms? Email hello@tenachinai.site.</Text>
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
