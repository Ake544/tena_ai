import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Alert, KeyboardAvoidingView, Platform, TouchableWithoutFeedback } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import Button from '../../components/Button';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';
import Spinner from '../../components/Spinner';
import { patientService, GlucoseTodaySlot } from '../../services/patient';
import { dbService } from '../../services/db';
import { syncService } from '../../services/sync';
import { medicationService, Medication } from '../../services/medication';
import { symptomService } from '../../services/symptom';

const symptomIcons: { iconSet: 'feather' | 'material'; icon: string; labelKey: string }[] = [
  { iconSet: 'feather', icon: 'activity', labelKey: 'symptomHeadache' },
  { iconSet: 'material', icon: 'water', labelKey: 'symptomThirst' },
  { iconSet: 'feather', icon: 'eye', labelKey: 'symptomBlurredVision' },
  { iconSet: 'material', icon: 'sleep', labelKey: 'symptomFatigue' },
  { iconSet: 'material', icon: 'foot-print', labelKey: 'symptomFootPain' },
  { iconSet: 'feather', icon: 'zap', labelKey: 'symptomWeakness' },
];

function IconRender({ item, size, color }: { item: typeof symptomIcons[0]; size: number; color: string }) {
  if (item.iconSet === 'feather') return <Feather name={item.icon as any} size={size} color={color} />;
  return <MaterialCommunityIcons name={item.icon as any} size={size} color={color} />;
}

type SymptomEntry = { name: string; severity: number };

export default function LogScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [value, setValue] = useState(118);
  const [selectedType, setSelectedType] = useState('Pre-Dinner');
  const [selectedSymptoms, setSelectedSymptoms] = useState<SymptomEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [todaySlots, setTodaySlots] = useState<GlucoseTodaySlot[]>([]);
  const [customSymptoms, setCustomSymptoms] = useState<SymptomEntry[]>([]);
  const [showSymptomInput, setShowSymptomInput] = useState(false);
  const [symptomInput, setSymptomInput] = useState('');
  const [severityTarget, setSeverityTarget] = useState<string | null>(null);
  const [severityTempValue, setSeverityTempValue] = useState(5);

  const [medications, setMedications] = useState<Medication[]>([]);
  const [selectedMed, setSelectedMed] = useState<Medication | null>(null);
  const [showMedModal, setShowMedModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([loadToday(), loadMedications()]).finally(() => setLoading(false));
    syncService.syncPending();
  }, []);

  const loadToday = async () => {
    try {
      const res = await patientService.getTodayReadings();
      setTodaySlots(res.slots);
      const firstUnlogged = res.slots.find(s => s.value == null);
      if (firstUnlogged) setSelectedType(firstUnlogged.reading_type);
    } catch (err) {
      console.log('Failed to load today readings', err);
    }
  };

  const loadMedications = async () => {
    try {
      const data = await medicationService.list();
      setMedications(data);
    } catch (err) {
      console.log('Failed to load medications', err);
    }
  };

  const splitList = (s: string | null) => s ? s.split(',').map(t => t.trim()).filter(Boolean) : [];

  const parseTime = (t: string) => {
    t = t.trim();
    const isPM = t.toUpperCase().includes('PM');
    const isAM = t.toUpperCase().includes('AM');
    const clean = t.replace(/\s*[APap][Mm]\s*/g, '').trim();
    const [hStr, mStr] = clean.split(':');
    let h = parseInt(hStr, 10) || 0;
    const m = parseInt(mStr, 10) || 0;
    if (isPM && h !== 12) h += 12;
    if (isAM && h === 12) h = 0;
    return { h, m };
  };

  const formatTime = (t: string) => {
    const { h, m } = parseTime(t);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  const getNearestPending = useCallback((med: Medication): { time: string; status: 'pending' | 'overdue' } | null => {
    const times = splitList(med.times);
    if (times.length === 0) return null;
    const taken = splitList(med.taken_times);
    const skipped = splitList(med.skipped_times);
    const done = new Set([...taken, ...skipped]);
    const pending = times.filter(t => !done.has(t));
    if (pending.length === 0) return null;
    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();
    pending.sort((a, b) => {
      const { h: ah, m: am } = parseTime(a);
      const { h: bh, m: bm } = parseTime(b);
      return (ah * 60 + am) - (bh * 60 + bm);
    });
    const nearest = pending[0];
    const { h: nh, m: nm } = parseTime(nearest);
    return { time: nearest, status: (nh * 60 + nm) <= currentMin ? 'overdue' : 'pending' };
  }, []);

  const handleMedAction = async (med: Medication, time: string, action: 'taken' | 'skip') => {
    try {
      const updated = action === 'taken'
        ? await medicationService.markTaken(med.id, time)
        : await medicationService.markSkip(med.id, time);
      setMedications(prev => prev.map(m => m.id === updated.id ? updated : m));
    } catch (err) {
      console.log(`Failed to mark ${action}`, err);
    }
    setShowMedModal(false);
    setSelectedMed(null);
  };

  const toggleSymptom = (label: string) => {
    setSelectedSymptoms((prev) => {
      const exists = prev.find(s => s.name === label);
      if (exists) return prev.filter(s => s.name !== label);
      return [...prev, { name: label, severity: 5 }];
    });
  };

  const openSeverityModal = (name: string) => {
    const entry = [...selectedSymptoms, ...customSymptoms].find(s => s.name === name);
    setSeverityTempValue(entry?.severity ?? 5);
    setSeverityTarget(name);
  };

  const saveSeverity = () => {
    if (!severityTarget) return;
    setSelectedSymptoms(prev => prev.map(s => s.name === severityTarget ? { ...s, severity: severityTempValue } : s));
    setCustomSymptoms(prev => prev.map(s => s.name === severityTarget ? { ...s, severity: severityTempValue } : s));
    setSeverityTarget(null);
  };

  const toggleCustomSymptom = (name: string) => {
    setCustomSymptoms(prev => {
      const exists = prev.find(s => s.name === name);
      if (exists) return prev.filter(s => s.name !== name);
      return [...prev, { name, severity: 5 }];
    });
  };

  const handleSave = async () => {
    setSubmitting(true);
    const allSymptoms = [...selectedSymptoms, ...customSymptoms];
    const symptomNames = allSymptoms.map(s => s.name);
    const symptomsStr = symptomNames.length > 0 ? symptomNames.join(', ') : undefined;
    const logData = {
      value,
      reading_type: selectedType,
      timestamp: new Date().toISOString(),
      symptoms: symptomsStr ?? null,
    };

    try {
      await dbService.saveLog(logData);
    } catch (err) {
      console.log('Failed to save locally', err);
    }

    const online = await syncService.isOnline();
    if (online) {
      try {
        await patientService.logReading({ value, reading_type: selectedType, timestamp: logData.timestamp, symptoms: symptomsStr });
      } catch {
        console.log('Online save failed, will sync later');
      }
      try {
        for (const s of allSymptoms) {
          await symptomService.log({ name: s.name, severity: s.severity, timestamp: new Date().toISOString() });
        }
      } catch {
        console.log('Failed to log symptoms, will retry');
      }
    }

    setSubmitting(false);
    router.push(`/log-success?value=${value}&reading_type=${encodeURIComponent(selectedType)}`);
  };

  const allReadingTypes = ['Fasting', 'Post-Breakfast', 'Pre-Lunch', 'Post-Lunch', 'Pre-Dinner', 'Bedtime'];

  return loading ? (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
      <Spinner />
    </View>
  ) : (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ backgroundColor: colors.green, paddingTop: 52, paddingHorizontal: 24, paddingBottom: 24, flexShrink: 0 }}>
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.white }}>{t('log.title')}</Text>
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · {t('log.allMgdl')}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {allReadingTypes.map((type, i) => {
            const slot = todaySlots.find(s => s.reading_type === type);
            const val = slot?.value;
            const color = val ? (val > 180 ? '#f87171' : '#6ee7b7') : 'rgba(255,255,255,0.25)';
            return (
              <View key={i} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color, fontVariant: ['tabular-nums'] }}>{val ?? '—'}</Text>
                <Text style={{ fontSize: 9, color: val ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.3)', marginTop: 2 }}>{type}</Text>
              </View>
            );
          })}
          </View>
        </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 20, paddingBottom: 96 }}>
        <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: colors.surface, borderRadius: 24, padding: 20, ...shadows.sm, borderWidth: 1, borderColor: 'rgba(11,77,59,0.06)' }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.t1, marginBottom: 14 }}>{t('log.addReading')}</Text>

          <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: colors.t3, marginBottom: 10 }}>{t('log.readingType')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {['Fasting', 'Post-Breakfast', 'Pre-Lunch', 'Post-Lunch', 'Pre-Dinner', 'Bedtime'].map((type) => {
              const active = selectedType === type;
              const logged = todaySlots.find(s => s.reading_type === type)?.value != null;
              return (
                <TouchableOpacity
                  key={type}
                  disabled={logged}
                  onPress={() => setSelectedType(type)}
                  style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 50, backgroundColor: logged ? colors.bg2 : (active ? colors.green : colors.bg2), opacity: logged ? 0.4 : 1 }}
                >
                  <Text style={{ fontSize: 12, fontWeight: active ? '700' : '600', color: logged ? colors.t4 : (active ? colors.white : colors.t3) }}>{logged ? `${type} ✓` : type}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: colors.t3, marginBottom: 12 }}>{t('log.valueMgdl')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <View style={{ flex: 1, backgroundColor: colors.greenXlight, borderRadius: 20, padding: 20, alignItems: 'center', borderWidth: 2, borderColor: colors.greenLight }}>
              <Text style={{ fontSize: 48, fontWeight: '800', color: colors.green, fontVariant: ['tabular-nums'] }}>{value}</Text>
              <Text style={{ fontSize: 12, color: colors.t3, marginTop: 4 }}>{t('log.normalRange')}</Text>
            </View>
            <View style={{ gap: 10 }}>
              <TouchableOpacity onPress={() => setValue((v) => v + 1)} style={{ width: 48, height: 48, backgroundColor: colors.green, borderRadius: 12, alignItems: 'center', justifyContent: 'center', ...shadows.md }}>
                <Text style={{ fontSize: 24, color: colors.white }}>+</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setValue((v) => Math.max(0, v - 1))} style={{ width: 48, height: 48, backgroundColor: colors.bg2, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 24, color: colors.t2 }}>-</Text>
              </TouchableOpacity>
            </View>
          </View>

          {todaySlots.every(s => s.value != null) ? (
            <View style={{ paddingVertical: 14, borderRadius: 9999, backgroundColor: colors.bg2, alignItems: 'center' }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.t3 }}>{t('log.allLogged')}</Text>
            </View>
          ) : (
            <Button title={t('log.saveReading')} onPress={handleSave} loading={submitting} variant="primary" />
          )}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 12 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', color: colors.t3 }}>{t('log.anySymptoms')}</Text>
        </View>
        <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: colors.surface, borderRadius: 24, padding: 20, ...shadows.sm, borderWidth: 1, borderColor: 'rgba(11,77,59,0.06)' }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {symptomIcons.map((symptom) => {
              const label = t(`log.${symptom.labelKey}`);
              const entry = selectedSymptoms.find(s => s.name === label);
              const active = !!entry;
              return (
                <TouchableOpacity
                  key={symptom.labelKey}
                  onPress={() => toggleSymptom(label)}
                  onLongPress={() => active && openSeverityModal(label)}
                  style={{ paddingVertical: 10, paddingHorizontal: 14, borderRadius: 50, backgroundColor: active ? colors.goldLight : colors.bg2 }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <IconRender item={symptom} size={16} color={active ? '#9A6200' : colors.t2} />
                    <Text style={{ fontSize: 12, fontWeight: active ? '700' : '600', color: active ? '#9A6200' : colors.t2 }}>{label}</Text>
                    {active && (
                      <View style={{ backgroundColor: '#9A6200', borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 }}>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: colors.white }}>{entry!.severity}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity onPress={() => setShowSymptomInput(true)} style={{ paddingVertical: 10, paddingHorizontal: 14, borderRadius: 50, backgroundColor: colors.bg2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Feather name="plus" size={16} color={colors.t2} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.t2 }}>{t('log.more')}</Text>
              </View>
            </TouchableOpacity>
          </View>
          {customSymptoms.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.bg2 }}>
              {customSymptoms.map((s, i) => (
                <TouchableOpacity key={i} onPress={() => setCustomSymptoms(prev => prev.filter((_, idx) => idx !== i))} onLongPress={() => openSeverityModal(s.name)} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 50, backgroundColor: colors.blueLight, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#3B82F6' }}>{s.name}</Text>
                  <View style={{ backgroundColor: '#3B82F6', borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: colors.white }}>{s.severity}</Text>
                  </View>
                  <Feather name="x" size={14} color="#3B82F6" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <Modal visible={showSymptomInput} animationType="slide" transparent>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
              <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingTop: 24, paddingHorizontal: 24, paddingBottom: 40 }}>
                <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.bg2, alignSelf: 'center', marginBottom: 20 }} />
                <Text style={{ fontSize: 18, fontWeight: '800', color: colors.t1, marginBottom: 16 }}>{t('log.addCustomSymptom')}</Text>
                <TextInput
                  value={symptomInput}
                  onChangeText={setSymptomInput}
                  placeholder={t('log.typeSymptom')}
                  placeholderTextColor={colors.t4}
                  style={{ backgroundColor: colors.bg2, borderRadius: 14, padding: 14, fontSize: 15, color: colors.t1, marginBottom: 16 }}
                  autoFocus
                />
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.t3, marginBottom: 8 }}>{t('log.severity')}</Text>
                <View style={{ flexDirection: 'row', gap: 4, marginBottom: 20 }}>
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <TouchableOpacity key={n} onPress={() => setSeverityTempValue(n)} style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: severityTempValue === n ? colors.gold : colors.bg2, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 12, fontWeight: severityTempValue === n ? '800' : '600', color: severityTempValue === n ? colors.t1 : colors.t3 }}>{n}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity onPress={() => { setShowSymptomInput(false); setSymptomInput(''); }} style={{ flex: 1, paddingVertical: 14, borderRadius: 9999, backgroundColor: colors.bg2, alignItems: 'center' }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: colors.t2 }}>{t('common.cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { if (symptomInput.trim()) { setCustomSymptoms(prev => [...prev, { name: symptomInput.trim(), severity: severityTempValue }]); setSymptomInput(''); setSeverityTempValue(5); setShowSymptomInput(false); } }} style={{ flex: 2, paddingVertical: 14, borderRadius: 9999, backgroundColor: colors.green, alignItems: 'center' }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: colors.white }}>{t('log.add')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        <Modal visible={severityTarget !== null} animationType="slide" transparent>
          <TouchableWithoutFeedback onPress={() => setSeverityTarget(null)}>
          <View style={{ flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingTop: 24, paddingHorizontal: 24, paddingBottom: 40, ...shadows.md }} onStartShouldSetResponder={() => true}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.bg2, alignSelf: 'center', marginBottom: 20 }} />
              <Text style={{ fontSize: 18, fontWeight: '800', color: colors.t1, marginBottom: 4 }}>{severityTarget}</Text>
              <Text style={{ fontSize: 13, color: colors.t3, marginBottom: 16 }}>{t('log.severity')}: {severityTempValue}/10</Text>
              <View style={{ flexDirection: 'row', gap: 4, marginBottom: 20 }}>
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <TouchableOpacity key={n} onPress={() => setSeverityTempValue(n)} style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: severityTempValue === n ? colors.gold : colors.bg2, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 12, fontWeight: severityTempValue === n ? '800' : '600', color: severityTempValue === n ? colors.t1 : colors.t3 }}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity onPress={saveSeverity} style={{ paddingVertical: 14, borderRadius: 9999, backgroundColor: colors.green, alignItems: 'center' }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.white }}>{t('log.done')}</Text>
              </TouchableOpacity>
            </View>
          </View>
          </TouchableWithoutFeedback>
        </Modal>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 12 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', color: colors.t3 }}>{t('log.medicationToday')}</Text>
        </View>
        {medications.length === 0 ? (
          <View style={{ marginHorizontal: 16, backgroundColor: colors.surface, borderRadius: 24, padding: 24, ...shadows.sm, borderWidth: 1, borderColor: 'rgba(11,77,59,0.06)', alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: colors.t4 }}>{t('log.noMedsYet')}</Text>
          </View>
        ) : (
          medications
            .map(med => {
              const nearest = getNearestPending(med);
              const count = splitList(med.times).length;
              return { med, nearest, count };
            })
            .sort((a, b) => {
              if (a.nearest && !b.nearest) return -1;
              if (!a.nearest && b.nearest) return 1;
              if (!a.nearest && !b.nearest) return 0;
              const { h: ah, m: am } = parseTime(a.nearest!.time);
              const { h: bh, m: bm } = parseTime(b.nearest!.time);
              return (ah * 60 + am) - (bh * 60 + bm);
            })
            .map(({ med, nearest, count }) => (
              <TouchableOpacity
                key={med.id}
                onPress={() => { setSelectedMed(med); setShowMedModal(true); }}
                style={{ marginHorizontal: 16, marginBottom: 8, backgroundColor: colors.surface, borderRadius: 24, padding: 20, ...shadows.sm, borderWidth: 1, borderColor: 'rgba(11,77,59,0.06)' }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MaterialCommunityIcons name="pill" size={20} color={colors.green} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.t1 }}>{med.name} {med.dose}</Text>
                    <Text style={{ fontSize: 12, color: colors.t3, marginTop: 1 }}>{med.frequency} · {splitList(med.times).map(formatTime).join(' & ')}</Text>
                  </View>
                  {nearest ? (
                    <View style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 50, backgroundColor: nearest.status === 'overdue' ? '#FEE2E2' : colors.goldLight }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: nearest.status === 'overdue' ? '#DC2626' : '#9A6200' }}>{formatTime(nearest.time)}</Text>
                    </View>
                  ) : (
                    <View style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 50, backgroundColor: colors.greenLight }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: colors.green }}>{t('log.allDone')}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))
        )}

        <Modal visible={showMedModal} animationType="slide" transparent>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingTop: 24, paddingHorizontal: 24, paddingBottom: 40 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.bg2, alignSelf: 'center', marginBottom: 20 }} />
              {selectedMed && (
                <>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: colors.t1, marginBottom: 4 }}>{selectedMed.name} {selectedMed.dose}</Text>
                  <Text style={{ fontSize: 13, color: colors.t3, marginBottom: 20 }}>{selectedMed.frequency} · {splitList(selectedMed.times).map(formatTime).join(' & ')}</Text>
                  <View style={{ gap: 12 }}>
                    {splitList(selectedMed.times).map(time => {
                      const taken = splitList(selectedMed.taken_times).includes(time);
                      const skipped = splitList(selectedMed.skipped_times).includes(time);
                      const { h: th, m: tm } = parseTime(time);
                      const now = new Date();
                      const timePassed = (th * 60 + tm) <= (now.getHours() * 60 + now.getMinutes());
                      return (
                        <View key={time} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 16, backgroundColor: colors.bg2, borderRadius: 16 }}>
                          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.t1 }}>{formatTime(time)}</Text>
                          <View style={{ flexDirection: 'row', gap: 8 }}>
                            {taken ? (
                              <View style={{ paddingVertical: 6, paddingHorizontal: 14, borderRadius: 50, backgroundColor: colors.greenLight }}>
                                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.green }}>{t('log.taken')}</Text>
                              </View>
                            ) : skipped ? (
                              <View style={{ paddingVertical: 6, paddingHorizontal: 14, borderRadius: 50, backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.t4 }}>
                                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.t4 }}>{t('log.skipped')}</Text>
                              </View>
                            ) : !timePassed ? (
                              <View style={{ paddingVertical: 6, paddingHorizontal: 14, borderRadius: 50, backgroundColor: colors.amberLight }}>
                                <Text style={{ fontSize: 12, fontWeight: '700', color: '#9A6200' }}>{t('medications.upcoming')}</Text>
                              </View>
                            ) : (
                              <>
                                <TouchableOpacity onPress={() => handleMedAction(selectedMed, time, 'taken')} style={{ paddingVertical: 6, paddingHorizontal: 14, borderRadius: 50, backgroundColor: colors.green }}>
                                  <Text style={{ fontSize: 12, fontWeight: '700', color: colors.white }}>{t('log.take')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleMedAction(selectedMed, time, 'skip')} style={{ paddingVertical: 6, paddingHorizontal: 14, borderRadius: 50, backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.t4 }}>
                                  <Text style={{ fontSize: 12, fontWeight: '700', color: colors.t2 }}>{t('log.skip')}</Text>
                                </TouchableOpacity>
                              </>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                  <TouchableOpacity onPress={() => setShowMedModal(false)} style={{ marginTop: 20, paddingVertical: 14, borderRadius: 9999, backgroundColor: colors.bg2, alignItems: 'center' }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: colors.t2 }}>{t('log.close')}</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}
