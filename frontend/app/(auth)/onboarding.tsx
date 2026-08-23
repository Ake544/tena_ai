import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Alert, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { colors, borderRadius } from '../../constants/theme';
import { authService } from '../../services/auth';

const gradientSets = [
  ['#0B4D3B', '#071F18'] as const,
  ['#0B4D3B', '#071F18'] as const,
  ['#0B4D3B', '#071F18'] as const,
];

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [lang, setLang] = useState('en');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [medication, setMedication] = useState('');
  const [conditions, setConditions] = useState('');
  const [familyHistory, setFamilyHistory] = useState<'yes' | 'no' | null>(null);
  const [selectedExercise, setSelectedExercise] = useState(t('onboarding.walking'));
  const [selectedDiet, setSelectedDiet] = useState(t('onboarding.injera'));
  const [selectedKnowledge, setSelectedKnowledge] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const headers = [
    { title: t('onboarding.welcome'), sub: t('onboarding.createAccountSub') },
    { title: t('onboarding.aboutCondition'), sub: t('onboarding.step2of3') },
    { title: t('onboarding.lifestyleKnowledge'), sub: t('onboarding.step3of3') },
  ];

  const exercises = [t('onboarding.walking'), t('onboarding.running'), t('onboarding.gym'), t('onboarding.none')];
  const diets = [t('onboarding.injera'), t('onboarding.rice'), t('onboarding.bread'), t('onboarding.mix')];

  const knowledgeLevels = [
    { iconSet: 'material' as const, icon: 'leaf', title: t('onboarding.knowledgeBeginner'), desc: t('onboarding.knowledgeBeginnerSub') },
    { iconSet: 'feather' as const, icon: 'book', title: t('onboarding.knowledgeIntermediate'), desc: t('onboarding.knowledgeIntermediateSub') },
    { iconSet: 'feather' as const, icon: 'award', title: t('onboarding.knowledgeAdvanced'), desc: t('onboarding.knowledgeAdvancedSub') },
  ];

  const handleStep0Next = () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert(t('common.error'), t('onboarding.errorFields'));
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert(t('common.error'), t('onboarding.errorPasswords'));
      return;
    }
    if (password.length < 8) {
      Alert.alert(t('common.error'), t('onboarding.errorPasswordLength'));
      return;
    }
    setStep(1);
  };

  const handleSubmit = async () => {
    if (!fullName || !email || !password) return;
    setSubmitting(true);
    try {
      await authService.signup({
        full_name: fullName,
        email,
        password,
        language: lang,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Addis_Ababa',
        age: age ? parseInt(age, 10) : undefined,
        sex: sex || undefined,
        family_history: familyHistory === 'yes',
        other_conditions: conditions || undefined,
        exercise_habit: selectedExercise,
        staple_diet: selectedDiet,
      });
      router.push({ pathname: '/(auth)/verify-email', params: { email, password } });
    } catch (err: any) {
      console.log('[signup] error:', err.message, err.code, err.response?.status, JSON.stringify(err.response?.data));
      Alert.alert(t('common.error'), err.response?.data?.detail || err.message || t('onboarding.errorSignup'));
    } finally {
      setSubmitting(false);
    }
  };

  const renderDots = () => (
    <View style={styles.dotsRow}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
      ))}
    </View>
  );

  const renderStep0 = () => (
    <>
      <View style={styles.toggleWrap}>
        <TouchableOpacity
          style={[styles.toggleOpt, lang === 'am' && styles.toggleOptOn]}
          onPress={() => Alert.alert('Coming soon', t('onboarding.amharicComingSoon'))}
        >
          <Text style={[lang === 'am' ? styles.toggleTextOn : styles.toggleTextOff]}>{t('onboarding.amharic')}</Text>
          <Text style={[styles.toggleSub, lang === 'am' ? styles.toggleSubOn : styles.toggleSubOff]}>{t('onboarding.amharic')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleOpt, lang === 'en' && styles.toggleOptOn]}
          onPress={() => setLang('en')}
        >
          <Text style={[lang === 'en' ? styles.toggleTextOn : styles.toggleTextOff]}>{t('onboarding.english')}</Text>
          <Text style={[styles.toggleSub, lang === 'en' ? styles.toggleSubOn : styles.toggleSubOff]}>{t('onboarding.english')}</Text>
        </TouchableOpacity>
      </View>
      <Input label={t('onboarding.fullName')} placeholder={t('onboarding.placeName')} value={fullName} onChangeText={setFullName} />
      <Input label={t('onboarding.email')} placeholder={t('onboarding.placeEmail')} keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
      <Input label={t('onboarding.password')} placeholder={t('onboarding.placePassword')} secureTextEntry={!showPassword} value={password} onChangeText={setPassword} rightIcon={<Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color={colors.t3} />} onRightIconPress={() => setShowPassword(!showPassword)} />
      <Input label={t('onboarding.confirmPassword')} placeholder={t('onboarding.placeConfirmPassword')} secureTextEntry={!showConfirm} value={confirmPassword} onChangeText={setConfirmPassword} rightIcon={<Feather name={showConfirm ? 'eye-off' : 'eye'} size={20} color={colors.t3} />} onRightIconPress={() => setShowConfirm(!showConfirm)} />
      <View style={styles.termsRow}>
        <TouchableOpacity style={styles.checkbox} onPress={() => setTermsAccepted(!termsAccepted)}>
          {termsAccepted && <Feather name="check" size={14} color={colors.green} />}
        </TouchableOpacity>
        <Text style={styles.termsText}>
          {t('onboarding.agree')}{' '}
          <Text style={styles.termsLink} onPress={() => setShowTerms(true)}>Terms of Service</Text>
          {' '}{t('onboarding.and')}{' '}
          <Text style={styles.termsLink} onPress={() => setShowPrivacy(true)}>Privacy Policy</Text>
        </Text>
      </View>
      <Button title={t('onboarding.continue')} variant="primary" size="lg" onPress={handleStep0Next} disabled={!termsAccepted} />
      <Text style={styles.footerText}>
        {t('onboarding.alreadyAccount')}{' '}
        <Text style={styles.linkText} onPress={() => router.push('/(auth)/login')}>{t('onboarding.signIn')}</Text>
      </Text>
    </>
  );

  const renderStep1 = () => (
    <>
      <View style={styles.gridRow}>
        <View style={styles.gridHalf}>
          <Input label={t('onboarding.age')} placeholder={t('onboarding.placeAge')} keyboardType="number-pad" value={age} onChangeText={setAge} />
        </View>
        <View style={styles.gridHalf}>
          <Input label={t('onboarding.sex')} placeholder={t('onboarding.maleFemale')} value={sex} onChangeText={setSex} />
        </View>
      </View>
      <View style={styles.gridRow}>
        <View style={styles.gridHalf}>
          <Input label={t('onboarding.weight')} placeholder={t('onboarding.placeWeight')} keyboardType="number-pad" value={weight} onChangeText={setWeight} />
        </View>
        <View style={styles.gridHalf}>
          <Input label={t('onboarding.height')} placeholder={t('onboarding.placeHeight')} keyboardType="number-pad" value={height} onChangeText={setHeight} />
        </View>
      </View>
      <Text style={styles.sectionLabel}>{t('onboarding.familyHistory')}</Text>
      <View style={styles.familyRow}>
        <TouchableOpacity
          style={[styles.familyCard, familyHistory === 'yes' && styles.familyCardSelected]}
          onPress={() => setFamilyHistory('yes')}
        >
          <View style={styles.familyIcon}><MaterialCommunityIcons name="dna" size={22} color={colors.green} /></View>
          <Text style={[styles.familyTitle, familyHistory === 'yes' && styles.familyTitleSelected]}>Yes</Text>
          <Text style={styles.familySub}>{t('onboarding.yesParentSibling')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.familyCard, familyHistory === 'no' && styles.familyCardSelected]}
          onPress={() => setFamilyHistory('no')}
        >
          <View style={styles.familyIcon}><Feather name="check-circle" size={22} color={colors.green} /></View>
          <Text style={[styles.familyTitle, familyHistory === 'no' && styles.familyTitleSelected]}>No</Text>
          <Text style={styles.familySub}>{t('onboarding.noNotThatIKnow')}</Text>
        </TouchableOpacity>
      </View>
      <Input label={t('onboarding.currentMed')} placeholder={t('onboarding.placeMed')} value={medication} onChangeText={setMedication} />
      <Input label={t('onboarding.otherConditions')} placeholder={t('onboarding.placeOther')} value={conditions} onChangeText={setConditions} />
      <Button title={t('onboarding.continue')} variant="primary" size="lg" onPress={() => setStep(2)} />
      <TouchableOpacity onPress={() => setStep(2)}>
        <Text style={styles.skipText}>{t('onboarding.skipForNow')}</Text>
      </TouchableOpacity>
    </>
  );

  const renderStep2 = () => (
    <>
      <Text style={styles.sectionLabel}>{t('onboarding.doYouExercise')}</Text>
      <View style={styles.pillRow}>
        {exercises.map((e) => (
          <TouchableOpacity
            key={e}
            style={[styles.pill, selectedExercise === e && styles.pillOn]}
            onPress={() => setSelectedExercise(e)}
          >
            <Text style={[styles.pillText, selectedExercise === e && styles.pillTextOn]}>{e}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.sectionLabel}>{t('onboarding.stapleDiet')}</Text>
      <View style={styles.pillRow}>
        {diets.map((d) => (
          <TouchableOpacity
            key={d}
            style={[styles.pill, selectedDiet === d && styles.pillOn]}
            onPress={() => setSelectedDiet(d)}
          >
            <Text style={[styles.pillText, selectedDiet === d && styles.pillTextOn]}>{d}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.sectionLabel}>{t('onboarding.diabetesKnowledge')}</Text>
      {knowledgeLevels.map((k, i) => (
        <TouchableOpacity
          key={i}
          style={[styles.knowCard, selectedKnowledge === i && styles.knowCardOn]}
          onPress={() => setSelectedKnowledge(i)}
        >
          <View style={styles.knowIcon}>
              {k.iconSet === 'feather' ? <Feather name={k.icon as any} size={22} color={colors.green} /> : <MaterialCommunityIcons name={k.icon as any} size={22} color={colors.green} />}
            </View>
          <View style={styles.knowInfo}>
            <Text style={[styles.knowTitle, selectedKnowledge === i && styles.knowTitleOn]}>{k.title}</Text>
            <Text style={styles.knowDesc}>{k.desc}</Text>
          </View>
          {selectedKnowledge === i && (
            <View style={styles.checkCircle}>
              <Feather name="check" size={12} color={colors.white} />
            </View>
          )}
        </TouchableOpacity>
      ))}
      <Button title={t('onboarding.startTracking')} variant="primary" size="lg" onPress={handleSubmit} loading={submitting} />
    </>
  );

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.flex}>
        <LinearGradient colors={gradientSets[step]} style={styles.header}>
          <View style={styles.iconBoxSm}>
            <View style={styles.crossSmV} />
            <View style={styles.crossSmH} />
          </View>
          <Text style={styles.headerTitle}>{headers[step].title}</Text>
          <Text style={styles.headerSub}>{headers[step].sub}</Text>
        </LinearGradient>
        <ScrollView style={styles.formScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {step === 0 && renderStep0()}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
        </ScrollView>
      </View>
      </TouchableWithoutFeedback>

      {(showTerms || showPrivacy) && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{showTerms ? 'Terms of Service' : 'Privacy Policy'}</Text>
              <TouchableOpacity style={styles.modalClose} onPress={() => { setShowTerms(false); setShowPrivacy(false); }}>
                <Feather name="x" size={14} color={colors.t2} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {showTerms ? (
                <>
                  <Text style={styles.modalSectionTitle}>1. Acceptance of Terms</Text>
                  <Text style={styles.modalText}>By creating an account and using Tena AI, you agree to be bound by these Terms of Service. If you do not agree, do not use the service.</Text>
                  <Text style={styles.modalSectionTitle}>2. Health Data</Text>
                  <Text style={styles.modalText}>Tena AI stores your health data securely using encryption. Your glucose readings, medication logs, and personal information are never shared with third parties without your explicit consent. You retain full ownership of your data.</Text>
                  <Text style={styles.modalSectionTitle}>3. Not Medical Advice</Text>
                  <Text style={styles.modalText}>Tena AI is a companion tool for diabetes management. It does not replace professional medical advice, diagnosis, or treatment. Always consult your healthcare provider for medical decisions.</Text>
                  <Text style={styles.modalSectionTitle}>4. User Responsibilities</Text>
                  <Text style={styles.modalText}>You are responsible for the accuracy of the data you enter. You must keep your login credentials secure. Notify us immediately if you suspect unauthorized access.</Text>
                  <Text style={styles.modalSectionTitle}>5. Service Availability</Text>
                  <Text style={styles.modalText}>We strive for high availability but do not guarantee uninterrupted service. We reserve the right to modify or discontinue features with reasonable notice.</Text>
                </>
              ) : (
                <>
                  <Text style={styles.modalSectionTitle}>1. Information We Collect</Text>
                  <Text style={styles.modalText}>We collect personal information you provide: name, email address, password, age, weight, height, medical history, glucose readings, medication logs, symptoms, and lifestyle data.</Text>
                  <Text style={styles.modalSectionTitle}>2. How We Use Your Data</Text>
                  <Text style={styles.modalText}>Your data is used to generate personalized insights, tips, and reports for your diabetes management. We analyze patterns to provide educational content tailored to your condition.</Text>
                  <Text style={styles.modalSectionTitle}>3. Data Storage & Security</Text>
                  <Text style={styles.modalText}>Data is encrypted at rest and in transit. We use industry-standard security practices. Your data is stored on secure servers and is never sold or rented.</Text>
                  <Text style={styles.modalSectionTitle}>4. Data Sharing</Text>
                  <Text style={styles.modalText}>We do not share your personal health information with advertisers, marketers, or third parties. De-identified, aggregated data may be used for research purposes.</Text>
                  <Text style={styles.modalSectionTitle}>5. Your Rights</Text>
                  <Text style={styles.modalText}>You may request access to, correction of, or deletion of your data at any time. You can export your data or delete your account from the profile settings.</Text>
                  <Text style={styles.modalSectionTitle}>6. Contact</Text>
                  <Text style={styles.modalText}>For privacy-related inquiries, contact us at privacy@tenaai.com. We will respond within 30 days.</Text>
                </>
              )}
            </ScrollView>
            <TouchableOpacity style={styles.modalAcceptBtn} onPress={() => { setShowTerms(false); setShowPrivacy(false); }}>
              <Text style={styles.modalAcceptText}>{t('onboarding.iUnderstand')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
    paddingBottom: 48,
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
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 24,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dotActive: {
    width: 24,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.white,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.white,
    lineHeight: 32,
  },
  headerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 4,
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
  formContent: {
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
  footerText: {
    fontSize: 13,
    color: colors.t3,
    textAlign: 'center',
    marginTop: 20,
    paddingBottom: 32,
  },
  linkText: {
    color: colors.green,
    fontWeight: '700',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  termsText: {
    fontSize: 12,
    color: colors.t2,
    lineHeight: 18,
    flex: 1,
  },
  termsLink: {
    color: colors.green,
    fontWeight: '700',
  },
  modalOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    zIndex: 200,
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.t1,
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bg2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.t1,
    marginTop: 16,
    marginBottom: 6,
  },
  modalText: {
    fontSize: 13,
    color: colors.t2,
    lineHeight: 20,
  },
  modalAcceptBtn: {
    backgroundColor: colors.green,
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: 'center',
  },
  modalAcceptText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  gridHalf: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.t3,
    marginBottom: 10,
    marginTop: 4,
  },
  familyRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  familyCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.bg2,
  },
  familyCardSelected: {
    borderColor: colors.green,
    backgroundColor: colors.greenXlight,
  },
  familyIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  familyTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.t2,
  },
  familyTitleSelected: {
    color: colors.green,
    fontWeight: '700',
  },
  familySub: {
    fontSize: 11,
    color: colors.t3,
    marginTop: 2,
  },
  skipText: {
    fontSize: 12,
    color: colors.t3,
    textAlign: 'center',
    paddingVertical: 8,
    marginBottom: 32,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 50,
    backgroundColor: colors.bg2,
  },
  pillOn: {
    backgroundColor: colors.green,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.t2,
  },
  pillTextOn: {
    color: colors.white,
    fontWeight: '700',
  },
  knowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: colors.bg2,
  },
  knowCardOn: {
    borderColor: colors.green,
    backgroundColor: colors.greenXlight,
  },
  knowIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  knowInfo: {
    flex: 1,
  },
  knowTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.t1,
  },
  knowTitleOn: {
    color: colors.green,
    fontWeight: '700',
  },
  knowDesc: {
    fontSize: 12,
    color: colors.t3,
    marginTop: 2,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
