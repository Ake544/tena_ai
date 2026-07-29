import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, Alert, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { colors } from '../../constants/theme';
import { authService } from '../../services/auth';

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState('am');

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      await authService.login({ email, password });
      router.replace('/(tabs)/home');
    } catch (err: any) {
      Alert.alert(t('common.error'), err?.response?.data?.detail || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.flex}>
        <LinearGradient colors={['#0B4D3B', '#071F18']} style={styles.header}>
          <View style={styles.iconBoxSm}>
            <View style={styles.crossSmV} />
            <View style={styles.crossSmH} />
          </View>
          <Text style={styles.welcomeTitle}>Welcome back</Text>
          <Text style={styles.welcomeSub}>Sign in to continue</Text>
        </LinearGradient>
        <View style={styles.formScroll}>
          <View style={styles.toggleWrap}>
            <TouchableOpacity
              style={[styles.toggleOpt, lang === 'am' && styles.toggleOptOn]}
              onPress={() => setLang('am')}
            >
              <Text style={[lang === 'am' ? styles.toggleTextOn : styles.toggleTextOff]}>አማርኛ</Text>
              <Text style={[styles.toggleSub, lang === 'am' ? styles.toggleSubOn : styles.toggleSubOff]}>Amharic</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleOpt, lang === 'en' && styles.toggleOptOn]}
              onPress={() => setLang('en')}
            >
              <Text style={[lang === 'en' ? styles.toggleTextOn : styles.toggleTextOff]}>English</Text>
              <Text style={[styles.toggleSub, lang === 'en' ? styles.toggleSubOn : styles.toggleSubOff]}>English</Text>
            </TouchableOpacity>
          </View>
          <Input label={t('auth.email')} placeholder="you@gmail.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Input label={t('auth.password')} placeholder="Enter your password" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} rightIcon={<Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color={colors.t3} />} onRightIconPress={() => setShowPassword(!showPassword)} />
          <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
            <Text style={styles.forgotText}>{t('auth.forgotPassword')}</Text>
          </TouchableOpacity>
          <Button title={t('auth.login')} onPress={handleLogin} loading={loading} size="lg" />
          <Text style={styles.footerText}>
            New to Tena AI?{' '}
            <Text style={styles.linkText} onPress={() => router.push('/(auth)/onboarding')}>Create account</Text>
          </Text>
        </View>
      </View>
      </TouchableWithoutFeedback>
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
  toggleWrap: {
    flexDirection: 'row',
    backgroundColor: colors.bg2,
    borderRadius: 50,
    padding: 4,
    marginBottom: 24,
  },
  toggleOpt: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 50,
    alignItems: 'center',
  },
  toggleOptOn: {
    backgroundColor: colors.green,
    ...Platform.select({
      ios: {
        shadowColor: colors.green,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      default: { elevation: 4 },
    }),
  },
  toggleTextOn: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  toggleTextOff: {
    color: colors.t3,
    fontWeight: '700',
    fontSize: 13,
  },
  toggleSub: {
    fontSize: 9,
    marginTop: 1,
  },
  toggleSubOn: {
    color: 'rgba(255,255,255,0.75)',
  },
  toggleSubOff: {
    color: colors.t4,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.green,
    textAlign: 'right',
    marginBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: colors.t3,
    textAlign: 'center',
    marginTop: 20,
  },
  linkText: {
    color: colors.green,
    fontWeight: '700',
  },
});
