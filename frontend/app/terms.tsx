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
        <Text style={styles.text}>By creating an account and using Tena AI, you agree to be bound by these Terms of Service. If you do not agree, do not use the service.</Text>

        <Text style={styles.sectionTitle}>2. Health Data</Text>
        <Text style={styles.text}>Tena AI stores your health data securely using encryption. Your glucose readings, medication logs, and personal information are never shared with third parties without your explicit consent. You retain full ownership of your data.</Text>

        <Text style={styles.sectionTitle}>3. Not Medical Advice</Text>
        <Text style={styles.text}>Tena AI is a companion tool for diabetes management. It does not replace professional medical advice, diagnosis, or treatment. Always consult your healthcare provider for medical decisions.</Text>

        <Text style={styles.sectionTitle}>4. User Responsibilities</Text>
        <Text style={styles.text}>You are responsible for the accuracy of the data you enter. You must keep your login credentials secure. Notify us immediately if you suspect unauthorized access.</Text>

        <Text style={styles.sectionTitle}>5. Service Availability</Text>
        <Text style={styles.text}>We strive for high availability but do not guarantee uninterrupted service. We reserve the right to modify or discontinue features with reasonable notice.</Text>
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
