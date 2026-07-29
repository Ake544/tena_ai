import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Alert, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useRouter } from 'expo-router';
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

const headers = [
  { title: 'Welcome!', sub: 'Create your account to get started' },
  { title: 'About your\ncondition', sub: 'Step 2 of 3 \u00B7 All info is private' },
  { title: 'Your lifestyle &\nknowledge', sub: 'Step 3 of 3 \u00B7 Helps us personalize tips' },
];

const exercises = ['Walking', 'Running', 'Gym', 'None'];
const diets = ['Injera', 'Rice', 'Bread', 'Mix'];

const knowledgeLevels = [
  { iconSet: 'material' as const, icon: 'leaf', title: 'Just getting started', desc: 'I want to learn the basics' },
  { iconSet: 'feather' as const, icon: 'book', title: 'I know the basics', desc: 'Managing for 1\u20133 years' },
  { iconSet: 'feather' as const, icon: 'award', title: 'I know it well', desc: 'Managing for many years' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [lang, setLang] = useState('am');
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
  const [selectedExercise, setSelectedExercise] = useState('Walking');
  const [selectedDiet, setSelectedDiet] = useState('Injera');
  const [selectedKnowledge, setSelectedKnowledge] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleStep0Next = () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
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
        exercise_habit: selectedExercise,
        staple_diet: selectedDiet,
      });
      router.push({ pathname: '/(auth)/verify-email', params: { email, password } });
    } catch (err: any) {
      console.log('[signup] error:', err.message, err.code, err.response?.status, JSON.stringify(err.response?.data));
      Alert.alert('Error', err.response?.data?.detail || err.message || 'Signup failed. Please try again.');
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
      <Input label="Full name" placeholder="e.g. Abebe Bekele" value={fullName} onChangeText={setFullName} />
      <Input label="Email address" placeholder="you@gmail.com" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
      <Input label="Password" placeholder="Minimum 8 characters" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} rightIcon={<Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color={colors.t3} />} onRightIconPress={() => setShowPassword(!showPassword)} />
      <Input label="Confirm password" placeholder="Repeat password" secureTextEntry={!showConfirm} value={confirmPassword} onChangeText={setConfirmPassword} rightIcon={<Feather name={showConfirm ? 'eye-off' : 'eye'} size={20} color={colors.t3} />} onRightIconPress={() => setShowConfirm(!showConfirm)} />
      <View style={styles.termsRow}>
        <TouchableOpacity style={styles.checkbox} onPress={() => setTermsAccepted(!termsAccepted)}>
          {termsAccepted && <Feather name="check" size={14} color={colors.green} />}
        </TouchableOpacity>
        <Text style={styles.termsText}>
          I agree to the{' '}
          <Text style={styles.termsLink} onPress={() => setShowTerms(true)}>Terms of Service</Text>
          {' '}and{' '}
          <Text style={styles.termsLink} onPress={() => setShowPrivacy(true)}>Privacy Policy</Text>
        </Text>
      </View>
      <Button title="Continue" variant="primary" size="lg" onPress={handleStep0Next} disabled={!termsAccepted} />
      <Text style={styles.footerText}>
        Already have an account?{' '}
        <Text style={styles.linkText} onPress={() => router.push('/(auth)/login')}>Sign in</Text>
      </Text>
    </>
  );

  const renderStep1 = () => (
    <>
      <View style={styles.gridRow}>
        <View style={styles.gridHalf}>
          <Input label="Age" placeholder="e.g. 47" keyboardType="number-pad" value={age} onChangeText={setAge} />
        </View>
        <View style={styles.gridHalf}>
          <Input label="Sex" placeholder="Male / Female" value={sex} onChangeText={setSex} />
        </View>
      </View>
      <View style={styles.gridRow}>
        <View style={styles.gridHalf}>
          <Input label="Weight (kg)" placeholder="78" keyboardType="number-pad" value={weight} onChangeText={setWeight} />
        </View>
        <View style={styles.gridHalf}>
          <Input label="Height (cm)" placeholder="169" keyboardType="number-pad" value={height} onChangeText={setHeight} />
        </View>
      </View>
      <Text style={styles.sectionLabel}>Family history of diabetes?</Text>
      <View style={styles.familyRow}>
        <TouchableOpacity
          style={[styles.familyCard, familyHistory === 'yes' && styles.familyCardSelected]}
          onPress={() => setFamilyHistory('yes')}
        >
          <View style={styles.familyIcon}><MaterialCommunityIcons name="dna" size={22} color={colors.green} /></View>
          <Text style={[styles.familyTitle, familyHistory === 'yes' && styles.familyTitleSelected]}>Yes</Text>
          <Text style={styles.familySub}>Parent or sibling</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.familyCard, familyHistory === 'no' && styles.familyCardSelected]}
          onPress={() => setFamilyHistory('no')}
        >
          <View style={styles.familyIcon}><Feather name="check-circle" size={22} color={colors.green} /></View>
          <Text style={[styles.familyTitle, familyHistory === 'no' && styles.familyTitleSelected]}>No</Text>
          <Text style={styles.familySub}>Not that I know</Text>
        </TouchableOpacity>
      </View>
      <Input label="Current medication" placeholder="e.g. Metformin 500mg" value={medication} onChangeText={setMedication} />
      <Input label="Other conditions or allergies" placeholder="e.g. Hypertension, none" value={conditions} onChangeText={setConditions} />
      <Button title="Continue" variant="primary" size="lg" onPress={() => setStep(2)} />
      <TouchableOpacity onPress={() => setStep(2)}>
        <Text style={styles.skipText}>Skip for now</Text>
      </TouchableOpacity>
    </>
  );

  const renderStep2 = () => (
    <>
      <Text style={styles.sectionLabel}>Do you exercise?</Text>
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
      <Text style={styles.sectionLabel}>Staple diet</Text>
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
      <Text style={styles.sectionLabel}>How much do you know about diabetes?</Text>
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
      <Button title="Start tracking" variant="primary" size="lg" onPress={handleSubmit} loading={submitting} />
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
        <View style={styles.formScroll}>
          {step === 0 && renderStep0()}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
        </View>
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
              <Text style={styles.modalAcceptText}>I understand</Text>
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
