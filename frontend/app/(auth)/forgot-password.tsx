import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { colors } from '../../constants/theme';
import { authService } from '../../services/auth';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!email) return;
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      router.push({ pathname: '/(auth)/reset-password', params: { email } });
    } catch (err: any) {
      Alert.alert(t('common.error'), err.response?.data?.detail || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.flex}>
        <LinearGradient colors={['#0B4D3B', '#071F18']} style={styles.header}>
          <View style={styles.iconBoxSm}>
            <View style={styles.crossSmV} />
            <View style={styles.crossSmH} />
          </View>
          <Text style={styles.welcomeTitle}>{t('auth.forgotPassword')}</Text>
          <Text style={styles.welcomeSub}>{t('auth.passwordResetSent')}</Text>
        </LinearGradient>
        <View style={styles.formScroll}>
          <Input label={t('auth.email')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Button title={t('auth.sendResetLink')} onPress={handleSend} loading={loading} size="lg" />
          <Text style={styles.backText} onPress={() => router.back()}>{t('common.back')}</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingTop: 52,
    paddingHorizontal: 32,
    paddingBottom: 24,
  },
  iconBoxSm: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(232,160,32,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  crossSmV: {
    position: 'absolute',
    width: 12,
    height: 40,
    borderRadius: 6,
    backgroundColor: colors.gold,
    top: 12,
    left: 26,
  },
  crossSmH: {
    position: 'absolute',
    width: 40,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.gold,
    top: 26,
    left: 12,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.white,
  },
  welcomeSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
    marginBottom: 17,
  },
  formScroll: {
    flex: 1,
    backgroundColor: colors.bg,
    marginTop: -32,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 28,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  backText: {
    fontSize: 14,
    color: colors.t3,
    textAlign: 'center',
    marginTop: 20,
    textDecorationLine: 'underline',
  },
});
