import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import Button from '../../components/Button';
import { colors } from '../../constants/theme';

export default function SplashScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <LinearGradient colors={['#0B4D3B', '#0A3D2E', '#071F18']} style={styles.container}>
      <View style={styles.decorCircle} />
      <View style={styles.content}>
        <View style={styles.iconBox}>
          <View style={styles.crossV} />
          <View style={styles.crossH} />
        </View>
        <Text style={styles.title}>
          Tena <Text style={styles.titleGold}>AI</Text>
        </Text>
        <Text style={styles.subEthiopic}>{t('splash.taglineAm')}</Text>
        <Text style={styles.subEnglish}>{t('splash.tagline')}</Text>
      </View>
      <View style={styles.footer}>
        <Button title={t('splash.getStarted')} variant="gold" size="lg" onPress={() => router.push('/(auth)/onboarding')} />
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.secondaryBtnText}>{t('splash.haveAccount')}</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  decorCircle: {
    position: 'absolute',
    top: -40,
    left: -30,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(232,160,32,0.06)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBox: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 10,
  },
  crossV: {
    position: 'absolute',
    width: 16,
    height: 56,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.95)',
    top: 16,
    left: 36,
  },
  crossH: {
    position: 'absolute',
    width: 56,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.95)',
    top: 36,
    left: 16,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.5,
  },
  titleGold: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.gold,
    letterSpacing: -0.5,
  },
  subEthiopic: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 8,
  },
  subEnglish: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 64,
    left: 24,
    right: 24,
    gap: 12,
  },
  secondaryBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 9999,
    borderWidth: 2,
    borderColor: colors.white,
  },
  secondaryBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
