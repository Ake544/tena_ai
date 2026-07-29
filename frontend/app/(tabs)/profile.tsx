import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, KeyboardAvoidingView, Platform, Alert, TouchableWithoutFeedback } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Card from '../../components/Card';
import { colors, typography, shadows } from '../../constants/theme';
import { authService } from '../../services/auth';
import { patientService, PatientProfile } from '../../services/patient';

const RELATIONS = ['Mother', 'Father', 'Sibling', 'Grandparent', 'Aunt', 'Uncle', 'Child', 'Other'];
const CONDITIONS = ['Type 2 Diabetes', 'Type 1 Diabetes', 'Gestational Diabetes', 'Prediabetes', 'Other'];

type FamilyEntry = { relation: string; condition: string };

function parseFamilyDetails(raw: string | null | undefined): FamilyEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((e: any) => e.relation && e.condition);
    return [];
  } catch {
    return raw.split(';').map(s => {
      const [relation, condition] = s.split(':').map(t => t.trim());
      return relation && condition ? { relation, condition } : null;
    }).filter(Boolean) as FamilyEntry[];
  }
}

function formatFamilyDetails(entries: FamilyEntry[]): string {
  return JSON.stringify(entries);
}

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [showEdit, setShowEdit] = useState<'medical' | 'exercise' | 'diet' | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [familyEntries, setFamilyEntries] = useState<FamilyEntry[]>([]);
  const [exerciseEntries, setExerciseEntries] = useState<{ name: string; frequency: string }[]>([]);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const p = await patientService.getProfile();
      setProfile(p);
    } catch (err) {
      console.log('Failed to load profile', err);
    }
  };

  const initials = profile?.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || 'AB';

  const memberYear = profile?.created_at
    ? new Date(profile.created_at).getFullYear()
    : null;

  const handleLogout = async () => {
    await authService.logout();
    router.replace('/(auth)/splash');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account?',
      'This will permanently delete all your data including glucose logs, medications, appointments, and history. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you sure?',
              'Your glucose readings, medications, appointments, symptoms, alerts, and all personal data will be permanently removed. You will not be able to recover any of this information.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete everything',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await patientService.deleteAccount();
                      await authService.logout();
                      router.replace('/(auth)/splash');
                    } catch (err) {
                      Alert.alert('Error', 'Failed to delete account. Please try again.');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const openEdit = (section: 'medical' | 'exercise' | 'diet') => {
    if (!profile) return;
    if (section === 'medical') {
      const entries = parseFamilyDetails(profile.family_history_details);
      setFamilyEntries(entries);
      setEditForm({
        age: profile.age ?? '',
        sex: profile.sex ?? '',
        bmi: profile.bmi ?? '',
        family_history: profile.family_history,
        family_history_details: profile.family_history_details ?? '',
      });
    } else if (section === 'exercise') {
      setExerciseEntries(parseExercises(profile.exercise_habit));
      setEditForm({ exercise_habit: profile.exercise_habit ?? '' });
    } else {
      setEditForm({ staple_diet: profile.staple_diet ?? '' });
    }
    setShowEdit(section);
  };

  const handleSave = async () => {
    if (!showEdit) return;
    setSaving(true);
    try {
      const payload: Record<string, any> = {};
      for (const [key, value] of Object.entries(editForm)) {
        if (key === 'family_history') {
          payload[key] = value;
        } else if (key === 'family_history_details') {
          continue;
        } else if (value === '' || value === null) {
          payload[key] = null;
        } else if (key === 'age' || key === 'bmi') {
          payload[key] = Number(value);
        } else {
          payload[key] = value;
        }
      }

      if (showEdit === 'medical') {
        payload.family_history = editForm.family_history;
        payload.family_history_details = editForm.family_history
          ? formatFamilyDetails(familyEntries)
          : null;
      }

      if (showEdit === 'exercise') {
        const formatted = formatExercises(exerciseEntries);
        payload.exercise_habit = formatted || null;
      }

      const editedFamilyHistory = payload.family_history !== profile?.family_history;

      await patientService.updateProfile(payload);
      await loadProfile();
      setShowEdit(null);

      if (editedFamilyHistory) {
        setTimeout(() => {
          Alert.alert(
            'Family history updated',
            'Your family history information has been saved. This helps your care team provide better recommendations.',
            [{ text: 'OK' }]
          );
        }, 300);
      }
    } catch (err) {
      console.log('Failed to update profile', err);
    } finally {
      setSaving(false);
    }
  };

  const addFamilyEntry = () => {
    setFamilyEntries(prev => [...prev, { relation: '', condition: '' }]);
  };

  const updateFamilyEntry = (index: number, field: keyof FamilyEntry, value: string) => {
    setFamilyEntries(prev => prev.map((e, i) => i === index ? { ...e, [field]: value } : e));
  };

  const removeFamilyEntry = (index: number) => {
    setFamilyEntries(prev => prev.filter((_, i) => i !== index));
  };

  const familyHistorySummary = () => {
    if (!profile?.family_history) return 'None reported';
    const entries = parseFamilyDetails(profile.family_history_details);
    if (entries.length === 0) return 'Yes';
    return entries.map(e => `${e.relation}: ${e.condition}`).join(', ');
  };

  const parseExercises = (raw: string | null | undefined): { name: string; frequency: string }[] => {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter((e: any) => e.name);
      return [];
    } catch {
      return raw ? [{ name: raw, frequency: '' }] : [];
    }
  };

  const formatExercises = (entries: { name: string; frequency: string }[]): string => {
    if (entries.length === 0) return '';
    return JSON.stringify(entries);
  };

  const exerciseSummary = () => {
    if (!profile?.exercise_habit) return 'Not specified';
    const entries = parseExercises(profile.exercise_habit);
    if (entries.length === 0) return 'Not specified';
    return entries.map(e => e.frequency ? `${e.name} · ${e.frequency}` : e.name).join(', ');
  };

  return (
    <View style={styles.container}>
      <View style={styles.greenHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{profile?.full_name || 'Loading...'}</Text>
        <Text style={styles.subtitle}>{memberYear ? `Member since ${memberYear}` : 'Managing diabetes'}</Text>
        <View style={styles.badgeRow}>
          <View style={styles.badgePill}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Feather name="flag" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.badgePillText}>{profile?.language === 'am' ? 'Amharic' : 'English'}</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.statsGrid}>
          <Card variant="sm" style={styles.statCard}>
            <Text style={styles.statLabel}>Age</Text>
            <Text style={styles.statValue}>{profile?.age ?? '—'} <Text style={styles.statUnit}>yrs</Text></Text>
          </Card>
          <Card variant="sm" style={styles.statCard}>
            <Text style={styles.statLabel}>BMI</Text>
            <Text style={styles.statValue}>{profile?.bmi ?? '—'}</Text>
          </Card>
          <Card variant="sm" style={styles.statCard}>
            <Text style={styles.statLabel}>Sex</Text>
            <Text style={styles.statValue}>{profile?.sex ?? '—'}</Text>
          </Card>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Medical info</Text>
        </View>
        <Card style={styles.sectionCard}>
          <TouchableOpacity onPress={() => openEdit('medical')}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}><MaterialCommunityIcons name="account" size={20} color={colors.green} /></View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Profile</Text>
                <Text style={styles.infoSub}>Manage your personal and family health information</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.infoDivider} />
          <TouchableOpacity onPress={() => router.push('/medications')}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}><MaterialCommunityIcons name="pill" size={20} color={colors.green} /></View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Medications</Text>
                <Text style={styles.infoSub}>Manage prescriptions and track adherence</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.infoDivider} />
          <TouchableOpacity onPress={() => router.push('/appointments')}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}><MaterialCommunityIcons name="hospital-building" size={20} color={colors.green} /></View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Appointments</Text>
                <Text style={styles.infoSub}>Upcoming visits and past records</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Lifestyle</Text>
        </View>
        <Card style={styles.sectionCard}>
          <TouchableOpacity onPress={() => openEdit('exercise')}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}><MaterialCommunityIcons name="walk" size={20} color={colors.green} /></View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Exercise</Text>
                <Text style={styles.infoSub}>{exerciseSummary()}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.infoDivider} />
          <TouchableOpacity onPress={() => openEdit('diet')}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}><MaterialCommunityIcons name="food" size={20} color={colors.green} /></View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Staple diet</Text>
                <Text style={styles.infoSub}>{profile?.staple_diet || 'Not specified'}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Settings</Text>
        </View>
        <Card style={styles.sectionCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingIcon}><Feather name="globe" size={20} color={colors.t1} /></View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Language</Text>
              <Text style={styles.settingSub}>{profile?.language === 'am' ? 'አማርኛ (Amharic)' : 'English'}</Text>
            </View>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.settingRow}>
            <View style={styles.settingIcon}><Feather name="clock" size={20} color={colors.t1} /></View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Timezone</Text>
              <Text style={styles.settingSub}>{profile?.timezone || 'Africa/Addis_Ababa'}</Text>
            </View>
          </View>
          <View style={styles.infoDivider} />
          <TouchableOpacity onPress={() => router.push('/privacy')}>
            <View style={styles.settingRow}>
              <View style={styles.settingIcon}><Feather name="shield" size={20} color={colors.t1} /></View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Privacy Policy</Text>
                <Text style={styles.settingSub}>How we handle your data</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.infoDivider} />
          <TouchableOpacity onPress={() => router.push('/terms')}>
            <View style={styles.settingRow}>
              <View style={styles.settingIcon}><Feather name="file-text" size={20} color={colors.t1} /></View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Terms of Service</Text>
                <Text style={styles.settingSub}>Rules and guidelines</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.infoDivider} />
          <TouchableOpacity onPress={handleLogout}>
            <View style={styles.settingRow}>
              <View style={styles.settingIcon}><Feather name="log-out" size={20} color={colors.t1} /></View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: colors.t1 }]}>Sign out</Text>
                <Text style={styles.settingSub}>You'll need to sign back in</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.infoDivider} />
          <TouchableOpacity onPress={handleDeleteAccount}>
            <View style={styles.settingRow}>
              <View style={styles.settingIcon}><Feather name="trash-2" size={20} color={colors.red} /></View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: colors.red }]}>Delete account</Text>
                <Text style={styles.settingSub}>Permanently remove all data</Text>
              </View>
              <Text style={[styles.chevron, { color: colors.red }]}>›</Text>
            </View>
          </TouchableOpacity>
        </Card>
      </ScrollView>

      <Modal visible={showEdit !== null} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <TouchableWithoutFeedback onPress={() => setShowEdit(null)}>
          <View style={{ flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingTop: 24, paddingHorizontal: 24, paddingBottom: 40, maxHeight: '85%', ...shadows.md }} onStartShouldSetResponder={() => true}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.bg2, alignSelf: 'center', marginBottom: 20 }} />
              <Text style={{ fontSize: 18, fontWeight: '800', color: colors.t1, marginBottom: 20 }}>
                {showEdit === 'medical' ? 'Medical info' : showEdit === 'exercise' ? 'Exercise' : 'Staple diet'}
              </Text>
              <ScrollView>
                {showEdit === 'medical' && (
                  <View style={{ gap: 16 }}>
                    <View>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.t3, marginBottom: 6 }}>Age</Text>
                      <TextInput
                        value={String(editForm.age ?? '')}
                        onChangeText={(t) => setEditForm(f => ({ ...f, age: t }))}
                        placeholder="Enter age"
                        placeholderTextColor={colors.t4}
                        keyboardType="numeric"
                        style={{ backgroundColor: colors.bg2, borderRadius: 14, padding: 14, fontSize: 15, color: colors.t1 }}
                      />
                    </View>
                    <View>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.t3, marginBottom: 6 }}>Sex</Text>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        {['Male', 'Female', 'Other'].map(opt => (
                          <TouchableOpacity
                            key={opt}
                            onPress={() => setEditForm(f => ({ ...f, sex: f.sex === opt ? '' : opt }))}
                            style={{ paddingVertical: 10, paddingHorizontal: 20, borderRadius: 50, backgroundColor: editForm.sex === opt ? colors.green : colors.bg2 }}
                          >
                            <Text style={{ fontSize: 13, fontWeight: '700', color: editForm.sex === opt ? colors.white : colors.t2 }}>{opt}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                    <View>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.t3, marginBottom: 6 }}>BMI</Text>
                      <TextInput
                        value={String(editForm.bmi ?? '')}
                        onChangeText={(t) => setEditForm(f => ({ ...f, bmi: t }))}
                        placeholder="Enter BMI"
                        placeholderTextColor={colors.t4}
                        keyboardType="decimal-pad"
                        style={{ backgroundColor: colors.bg2, borderRadius: 14, padding: 14, fontSize: 15, color: colors.t1 }}
                      />
                    </View>
                    <View style={{ borderTopWidth: 1, borderTopColor: colors.bg2, paddingTop: 16 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <TouchableOpacity
                          onPress={() => {
                            const next = !editForm.family_history;
                            setEditForm(f => ({ ...f, family_history: next }));
                            if (!next) setFamilyEntries([]);
                          }}
                          style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: editForm.family_history ? colors.green : colors.t4, backgroundColor: editForm.family_history ? colors.green : 'transparent', alignItems: 'center', justifyContent: 'center' }}
                        >
                          {editForm.family_history && <Feather name="check" size={14} color={colors.white} />}
                        </TouchableOpacity>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.t1, flex: 1 }}>Family history of diabetes</Text>
                      </View>

                      {editForm.family_history && (
                        <View style={{ gap: 10 }}>
                          {familyEntries.map((entry, i) => (
                            <View key={i} style={{ backgroundColor: colors.bg2, borderRadius: 14, padding: 12, gap: 8 }}>
                              <View style={{ flexDirection: 'row', gap: 8 }}>
                                <View style={{ flex: 1 }}>
                                  <Text style={{ fontSize: 10, fontWeight: '700', color: colors.t3, marginBottom: 4 }}>Relation</Text>
                                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                                    {RELATIONS.map(r => (
                                      <TouchableOpacity
                                        key={r}
                                        onPress={() => updateFamilyEntry(i, 'relation', entry.relation === r ? '' : r)}
                                        style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 50, backgroundColor: entry.relation === r ? colors.green : colors.surface }}
                                      >
                                        <Text style={{ fontSize: 11, fontWeight: '700', color: entry.relation === r ? colors.white : colors.t2 }}>{r}</Text>
                                      </TouchableOpacity>
                                    ))}
                                  </View>
                                </View>
                                <TouchableOpacity onPress={() => removeFamilyEntry(i)} style={{ padding: 4 }}>
                                  <Feather name="trash-2" size={18} color={colors.red} />
                                </TouchableOpacity>
                              </View>
                              <View>
                                <Text style={{ fontSize: 10, fontWeight: '700', color: colors.t3, marginBottom: 4 }}>Condition</Text>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                                  {CONDITIONS.map(c => (
                                    <TouchableOpacity
                                      key={c}
                                      onPress={() => updateFamilyEntry(i, 'condition', entry.condition === c ? '' : c)}
                                      style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 50, backgroundColor: entry.condition === c ? colors.green : colors.surface }}
                                    >
                                      <Text style={{ fontSize: 11, fontWeight: '700', color: entry.condition === c ? colors.white : colors.t2 }}>{c}</Text>
                                    </TouchableOpacity>
                                  ))}
                                </View>
                              </View>
                            </View>
                          ))}
                          <TouchableOpacity onPress={addFamilyEntry} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 }}>
                            <Feather name="plus-circle" size={18} color={colors.green} />
                            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.green }}>Add family member</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                )}
                {showEdit === 'exercise' && (
                  <View style={{ gap: 12 }}>
                    {exerciseEntries.map((entry, i) => (
                      <View key={i} style={{ backgroundColor: colors.bg2, borderRadius: 14, padding: 12, gap: 8 }}>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <View style={{ flex: 1 }}>
                            <TextInput
                              value={entry.name}
                              onChangeText={(t) => setExerciseEntries(prev => prev.map((e, idx) => idx === i ? { ...e, name: t } : e))}
                              placeholder="Exercise name"
                              placeholderTextColor={colors.t4}
                              style={{ backgroundColor: colors.surface, borderRadius: 10, padding: 10, fontSize: 14, color: colors.t1 }}
                            />
                          </View>
                          <TouchableOpacity onPress={() => setExerciseEntries(prev => prev.filter((_, idx) => idx !== i))} style={{ padding: 4 }}>
                            <Feather name="trash-2" size={18} color={colors.red} />
                          </TouchableOpacity>
                        </View>
                        <TextInput
                          value={entry.frequency}
                          onChangeText={(t) => setExerciseEntries(prev => prev.map((e, idx) => idx === i ? { ...e, frequency: t } : e))}
                          placeholder="e.g. 3 days/week, daily"
                          placeholderTextColor={colors.t4}
                          style={{ backgroundColor: colors.surface, borderRadius: 10, padding: 10, fontSize: 14, color: colors.t1 }}
                        />
                      </View>
                    ))}
                    <TouchableOpacity onPress={() => setExerciseEntries(prev => [...prev, { name: '', frequency: '' }])} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 }}>
                      <Feather name="plus-circle" size={18} color={colors.green} />
                      <Text style={{ fontSize: 13, fontWeight: '700', color: colors.green }}>Add exercise</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {showEdit === 'diet' && (
                  <View style={{ gap: 16 }}>
                    <TextInput
                      value={editForm.staple_diet ?? ''}
                      onChangeText={(t) => setEditForm(f => ({ ...f, staple_diet: t }))}
                      placeholder="e.g. Enjera, bread, rice"
                      placeholderTextColor={colors.t4}
                      multiline
                      style={{ backgroundColor: colors.bg2, borderRadius: 14, padding: 14, fontSize: 15, color: colors.t1, minHeight: 80 }}
                    />
                    {editForm.staple_diet ? (
                      <TouchableOpacity onPress={() => setEditForm(f => ({ ...f, staple_diet: '' }))} style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Feather name="x-circle" size={16} color={colors.red} />
                        <Text style={{ fontSize: 13, color: colors.red }}>Clear</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                )}
              </ScrollView>
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                <TouchableOpacity onPress={() => setShowEdit(null)} style={{ flex: 1, paddingVertical: 14, borderRadius: 9999, backgroundColor: colors.bg2, alignItems: 'center' }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: colors.t2 }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave} style={{ flex: 2, paddingVertical: 14, borderRadius: 9999, backgroundColor: colors.green, alignItems: 'center' }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: colors.white }}>{saving ? 'Saving...' : 'Save changes'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  greenHeader: {
    backgroundColor: colors.green,
    paddingTop: 52,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.white,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.white,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 12,
  },
  badgePill: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 50,
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 96,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
    marginTop: 16,
  },
  statCard: {
    width: '47%',
    ...shadows.sm,
  },
  statLabel: {
    fontSize: 11,
    color: colors.t3,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.t1,
  },
  statUnit: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.t3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.t1,
  },
  editLink: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  sectionCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  infoIcon: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.t1,
  },
  infoSub: {
    fontSize: 12,
    color: colors.t3,
    marginTop: 2,
  },
  infoDivider: {
    height: 1,
    backgroundColor: colors.bg2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  settingIcon: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.t1,
  },
  settingSub: {
    fontSize: 12,
    color: colors.t3,
    marginTop: 2,
  },
  chevron: {
    fontSize: 22,
    color: colors.t3,
    fontWeight: '300',
  },
});
