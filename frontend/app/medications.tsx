import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Alert, TouchableWithoutFeedback } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, shadows } from '../constants/theme';
import { useTranslation } from 'react-i18next';
import { medicationService, Medication } from '../services/medication';

const frequencies = ['Once daily', 'Twice daily', 'Three times daily', 'As needed'];

const freqLabels: Record<string, string> = {
  'Once daily': 'onceDaily',
  'Twice daily': 'twiceDaily',
  'Three times daily': 'threeTimesDaily',
  'As needed': 'asNeeded',
};

export default function MedicationsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Medication | null>(null);
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [frequency, setFrequency] = useState('Twice daily');
  const [times, setTimes] = useState('8:00 AM, 8:00 PM');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadMeds();
  }, []);

  const loadMeds = async () => {
    try {
      const data = await medicationService.list();
      setMedications(data);
    } catch (err) {
      console.log('Failed to load medications', err);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setName('');
    setDose('500mg');
    setFrequency('Twice daily');
    setTimes('8:00 AM, 8:00 PM');
    setNotes('');
    setShowModal(true);
  };

  const openEdit = (med: Medication) => {
    setEditing(med);
    setName(med.name);
    setDose(med.dose);
    setFrequency(med.frequency);
    setTimes(med.times);
    setNotes(med.notes || '');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !dose.trim()) {
      Alert.alert(t('medications.required'), t('medications.required'));
      return;
    }
    try {
      if (editing) {
        await medicationService.update(editing.id, { name, dose, frequency, times, notes });
      } else {
        await medicationService.create({ name, dose, frequency, times, notes });
      }
      setShowModal(false);
      loadMeds();
    } catch (err: any) {
      Alert.alert(t('common.error'), err.response?.data?.detail || t('medications.errorSave'));
    }
  };

  const handleDelete = (med: Medication) => {
    Alert.alert(t('medications.confirmDelete'), t('medications.confirmDelete', { name: med.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: async () => {
        await medicationService.delete(med.id);
        loadMeds();
      }},
    ]);
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

  const findNearestPendingTime = (med: Medication): string | null => {
    const times = splitList(med.times);
    if (times.length === 0) return null;
    const taken = splitList(med.taken_times);
    const skipped = splitList(med.skipped_times);
    const done = new Set([...taken, ...skipped]);
    const pending = times.filter(t => !done.has(t));
    if (pending.length === 0) return null;
    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();
    const upcoming = pending.filter(t => {
      const { h, m } = parseTime(t);
      return (h * 60 + m) <= currentMin;
    });
    if (upcoming.length === 0) return pending[0];
    upcoming.sort((a, b) => {
      const { h: ah, m: am } = parseTime(a);
      const { h: bh, m: bm } = parseTime(b);
      return (bh * 60 + bm) - (ah * 60 + am);
    });
    return upcoming[0];
  };

  const handleTaken = async (med: Medication) => {
    const time = findNearestPendingTime(med);
    if (!time) {
      Alert.alert(t('medications.allTaken'), t('medications.allTaken', { name: med.name }));
      return;
    }
    try {
      await medicationService.markTaken(med.id, time);
      loadMeds();
    } catch (err: any) {
      Alert.alert(t('common.error'), err.response?.data?.detail || t('medications.errorSave'));
    }
  };

  const handleSkip = async (med: Medication) => {
    const time = findNearestPendingTime(med);
    if (!time) {
      Alert.alert(t('medications.allDone'), t('medications.allDone', { name: med.name }));
      return;
    }
    try {
      await medicationService.markSkip(med.id, time);
      loadMeds();
    } catch (err: any) {
      Alert.alert(t('common.error'), err.response?.data?.detail || t('medications.errorSave'));
    }
  };

  const takenCount = medications.filter(m => m.taken_today).length;
  const adherence = medications.length > 0 ? Math.round((takenCount / medications.length) * 100) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ backgroundColor: colors.green, paddingTop: 52, paddingHorizontal: 24, paddingBottom: 20, flexShrink: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
            <Feather name="arrow-left" size={22} color={colors.white} />
          </TouchableOpacity>
          <View>
            <Text style={{ fontSize: 20, fontWeight: '800', color: colors.white }}>{t('medications.title')}</Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{t('medications.activePrescriptions', { count: medications.length })}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 12, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: colors.white }}>{adherence}%</Text>
            <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{t('medications.todayAdherence')}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 12, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: colors.gold2 }}>{takenCount}/{medications.length}</Text>
            <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{t('medications.takenToday')}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 16, paddingBottom: 96 }}>
        {medications.length === 0 ? (
          <View style={{ marginHorizontal: 16, backgroundColor: colors.surface, borderRadius: 24, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(11,77,59,0.06)', ...shadows.sm }}>
            <MaterialCommunityIcons name="pill" size={40} color={colors.t4} />
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.t2, marginTop: 16 }}>{t('medications.noMeds')}</Text>
            <Text style={{ fontSize: 13, color: colors.t3, marginTop: 4, textAlign: 'center' }}>{t('medications.noMedsSub')}</Text>
          </View>
        ) : (
          medications.map((med) => (
            <TouchableOpacity key={med.id} onPress={() => openEdit(med)} style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: colors.surface, borderRadius: 24, padding: 16, borderWidth: 1, borderColor: 'rgba(11,77,59,0.06)', ...shadows.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: med.taken_today ? colors.greenLight : colors.goldLight, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <MaterialCommunityIcons name="pill" size={22} color={med.taken_today ? colors.green : '#9A6200'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: colors.t1 }}>{med.name} {med.dose}</Text>
                  <Text style={{ fontSize: 12, color: colors.t3, marginTop: 2 }}>{t(`medications.${freqLabels[med.frequency]}`)} · {med.times}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <TouchableOpacity onPress={() => handleTaken(med)} style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 50, backgroundColor: med.taken_today ? colors.greenLight : colors.bg2 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: med.taken_today ? colors.green : colors.t3 }}>{med.taken_today ? t('medications.taken') : t('medications.take')}</Text>
                  </TouchableOpacity>
                  {!med.taken_today && (
                    <TouchableOpacity onPress={() => handleSkip(med)} style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 50, backgroundColor: colors.bg2 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.t3 }}>{t('medications.skip')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              {med.notes && (
                <Text style={{ fontSize: 12, color: colors.t4, marginTop: 8, marginLeft: 56 }}>{med.notes}</Text>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <TouchableOpacity onPress={openAdd} style={{ position: 'absolute', right: 24, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', ...shadows.gold }}>
        <Text style={{ fontSize: 28, color: colors.t1, fontWeight: '200', lineHeight: 30 }}>+</Text>
      </TouchableOpacity>

      <Modal visible={showModal} animationType="slide" transparent>
        <TouchableWithoutFeedback onPress={() => setShowModal(false)}>
          <View style={{ flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end' }}>
            <View onStartShouldSetResponder={() => true} style={{ backgroundColor: colors.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingTop: 24, paddingHorizontal: 24, paddingBottom: 40, maxHeight: '85%', ...shadows.lg }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.bg2, alignSelf: 'center', marginBottom: 20 }} />
            <Text style={{ fontSize: 18, fontWeight: '800', color: colors.t1, marginBottom: 20 }}>{editing ? t('medications.edit') : t('medications.new')}</Text>

            <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: colors.t3, marginBottom: 6 }}>{t('medications.name')}</Text>
            <TextInput value={name} onChangeText={setName} placeholder={t('medications.placeName')} placeholderTextColor={colors.t4} style={{ backgroundColor: colors.bg2, borderRadius: 14, padding: 14, fontSize: 15, color: colors.t1, marginBottom: 14 }} />

            <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: colors.t3, marginBottom: 6 }}>{t('medications.dose')}</Text>
            <TextInput value={dose} onChangeText={setDose} placeholder={t('medications.placeDose')} placeholderTextColor={colors.t4} style={{ backgroundColor: colors.bg2, borderRadius: 14, padding: 14, fontSize: 15, color: colors.t1, marginBottom: 14 }} />

            <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: colors.t3, marginBottom: 6 }}>{t('medications.frequency')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              {frequencies.map((f) => (
                <TouchableOpacity key={f} onPress={() => setFrequency(f)} style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 50, backgroundColor: frequency === f ? colors.green : colors.bg2 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: frequency === f ? colors.white : colors.t3 }}>{t(`medications.${freqLabels[f]}`)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: colors.t3, marginBottom: 6 }}>{t('medications.times')}</Text>
            <TextInput value={times} onChangeText={setTimes} placeholder={t('medications.placeTimes')} placeholderTextColor={colors.t4} style={{ backgroundColor: colors.bg2, borderRadius: 14, padding: 14, fontSize: 15, color: colors.t1, marginBottom: 14 }} />

            <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: colors.t3, marginBottom: 6 }}>{t('medications.notes')}</Text>
            <TextInput value={notes} onChangeText={setNotes} placeholder={t('medications.placeNotes')} placeholderTextColor={colors.t4} style={{ backgroundColor: colors.bg2, borderRadius: 14, padding: 14, fontSize: 15, color: colors.t1, marginBottom: 20 }} />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={() => setShowModal(false)} style={{ flex: 1, paddingVertical: 14, borderRadius: 9999, backgroundColor: colors.bg2, alignItems: 'center' }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.t2 }}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={{ flex: 2, paddingVertical: 14, borderRadius: 9999, backgroundColor: colors.green, alignItems: 'center' }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.white }}>{editing ? t('medications.update') : t('medications.add')}</Text>
              </TouchableOpacity>
            </View>

            {editing && (
              <TouchableOpacity onPress={() => { setShowModal(false); handleDelete(editing); }} style={{ marginTop: 12, alignItems: 'center' }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.red }}>{t('medications.delete')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}
