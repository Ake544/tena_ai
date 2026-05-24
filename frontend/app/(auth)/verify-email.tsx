import { useState, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import Button from '../../components/Button';
import { colors } from '../../constants/theme';
import { authService } from '../../services/auth';

export default function VerifyEmailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { email: paramEmail, password: paramPassword } = useLocalSearchParams<{ email?: string; password?: string }>();
  const [email] = useState(paramEmail || '');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleOtpChange = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, '');
    if (!digit && index > 0) {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      inputRefs.current[index - 1]?.focus();
      return;
    }
    if (!digit) return;
    const newOtp = [...otp];
    newOtp[index] = digit.slice(-1);
    setOtp(newOtp);
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6 || !email) return;
    setLoading(true);
    try {
      await authService.verifyEmail(email, code);
      if (paramPassword) {
        await authService.login({ email, password: paramPassword });
      }
      router.replace('/(tabs)/home');
    } catch (err: any) {
      Alert.alert(t('common.error'), err.response?.data?.detail || t('common.error'));
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    try {
      await authService.forgotPassword(email);
      Alert.alert(t('common.confirm'), t('auth.verificationCodeSent'));
    } catch (err: any) {
      Alert.alert(t('common.error'), err.response?.data?.detail || t('common.error'));
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
          <Text style={styles.welcomeTitle}>{t('auth.verifyEmail')}</Text>
          <Text style={styles.welcomeSub}>{t('auth.verificationCodeSent')}</Text>
        </LinearGradient>
        <View style={styles.formScroll}>
          <Text style={styles.instruction}>{t('auth.enterCode')}</Text>
          <View style={styles.otpRow}>
            {otp.map((digit, i) => (
              <TextInput
                key={i}
                ref={(ref) => { inputRefs.current[i] = ref; }}
                style={styles.otpBox}
                value={digit}
                onChangeText={(text) => handleOtpChange(text, i)}
                onKeyPress={({ nativeEvent }) => handleKeyDown(nativeEvent.key, i)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>
          <Button
            title={t('auth.verify')}
            onPress={handleVerify}
            loading={loading}
            size="lg"
            disabled={otp.join('').length !== 6}
          />
          <Text style={styles.footerText}>
            Didn't receive code?{' '}
            <Text style={styles.linkText} onPress={handleResend}>{t('auth.resendCode')}</Text>
          </Text>
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
  instruction: {
    fontSize: 14,
    color: colors.t3,
    textAlign: 'center',
    marginBottom: 24,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.border,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
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
  backText: {
    fontSize: 14,
    color: colors.t3,
    textAlign: 'center',
    marginTop: 12,
    textDecorationLine: 'underline',
  },
});
