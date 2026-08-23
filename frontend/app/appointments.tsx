import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, shadows } from '../constants/theme';
import { useTranslation } from 'react-i18next';
import { medicationService, Appointment } from '../services/medication';

const appointmentTypes = ['Check-up', 'Follow-up', 'Lab test', 'Consultation', 'Emergency'];

const apptTypeLabels: Record<string, string> = {
  'Check-up': 'typeCheckup',
  'Follow-up': 'typeFollowup',
  'Lab test': 'typeLab',
  'Consultation': 'typeConsult',
  'Emergency': 'typeEmergency',
};

export default function AppointmentsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [title, setTitle] = useState('');
  const [hospital, setHospital] = useState('');
  const [appointmentType, setAppointmentType] = useState('Follow-up');
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadAppts();
  }, []);

  const loadAppts = async () => {
    try {
      const data = await medicationService.listAppointments();
      setAppointments(data);
    } catch (err) {
      console.log('Failed to load appointments', err);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const daysUntil = (iso: string) => {
    const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
    if (diff < 0) return { text: t('appointments.overdue'), color: colors.red };
    if (diff === 0) return { text: t('appointments.today'), color: colors.gold2 };
    if (diff === 1) return { text: t('appointments.tomorrow'), color: colors.gold2 };
    if (diff <= 7) return { text: t('appointments.days', { count: diff }), color: colors.green };
    return { text: t('appointments.days', { count: diff }), color: colors.t3 };
  };

  const openAdd = () => {
    setEditing(null);
    setTitle('');
    setHospital('');
    setAppointmentType('Follow-up');
    setDateStr(new Date().toISOString().split('T')[0]);
    setTimeStr('09:00');
    setNotes('');
    setShowModal(true);
  };

  const openEdit = (apt: Appointment) => {
    setEditing(apt);
    setTitle(apt.title);
    setHospital(apt.hospital);
    setAppointmentType(apt.appointment_type || 'Follow-up');
    const d = new Date(apt.date);
    setDateStr(d.toISOString().split('T')[0]);
    setTimeStr(d.toTimeString().slice(0, 5));
    setNotes(apt.notes || '');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !hospital.trim()) {
      Alert.alert(t('appointments.required'), t('appointments.required'));
      return;
    }
    const date = new Date(`${dateStr}T${timeStr}:00`).toISOString();
    try {
      if (editing) {
        await medicationService.updateAppointment(editing.id, { title, hospital, appointment_type: appointmentType, date, notes });
      } else {
        await medicationService.createAppointment({ title, hospital, appointment_type: appointmentType, date, notes });
      }
      setShowModal(false);
      loadAppts();
    } catch (err: any) {
      Alert.alert(t('common.error'), err.response?.data?.detail || t('appointments.errorSave'));
    }
  };

  const handleDelete = (apt: Appointment) => {
    Alert.alert(t('appointments.confirmDelete'), t('appointments.confirmDelete', { title: apt.title }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: async () => {
        await medicationService.deleteAppointment(apt.id);
        loadAppts();
      }},
    ]);
  };

  const upcoming = appointments.filter(a => new Date(a.date) >= new Date());
  const past = appointments.filter(a => new Date(a.date) < new Date());
  const nextApt = upcoming[0];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ backgroundColor: colors.green, paddingTop: 52, paddingHorizontal: 24, paddingBottom: 20, flexShrink: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
            <Feather name="arrow-left" size={22} color={colors.white} />
          </TouchableOpacity>
          <View>
            <Text style={{ fontSize: 20, fontWeight: '800', color: colors.white }}>{t('appointments.title')}</Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{t('appointments.upcoming', { count: upcoming.length })} · {t('appointments.past', { count: past.length })}</Text>
          </View>
        </View>
        {nextApt && (
          <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <MaterialCommunityIcons name="hospital-building" size={20} color={colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.white }}>{nextApt.title}</Text>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 1 }}>{nextApt.hospital} · {formatDate(nextApt.date)}</Text>
            </View>
            <View style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.15)' }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.white }}>{daysUntil(nextApt.date).text}</Text>
            </View>
          </View>
        )}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 16, paddingBottom: 96 }}>
        {appointments.length === 0 ? (
          <View style={{ marginHorizontal: 16, backgroundColor: colors.surface, borderRadius: 24, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(11,77,59,0.06)', ...shadows.sm }}>
            <Feather name="calendar" size={40} color={colors.t4} />
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.t2, marginTop: 16 }}>{t('appointments.noAppts')}</Text>
            <Text style={{ fontSize: 13, color: colors.t3, marginTop: 4, textAlign: 'center' }}>{t('appointments.noApptsSub')}</Text>
          </View>
        ) : (
          <>
            {upcoming.length > 0 && (
              <>
                <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', color: colors.t3, marginHorizontal: 24, marginBottom: 12 }}>{t('appointments.upcomingSection')}</Text>
                {upcoming.map((apt) => {
                  const due = daysUntil(apt.date);
                  return (
                    <TouchableOpacity key={apt.id} onPress={() => openEdit(apt)} style={{ marginHorizontal: 16, marginBottom: 10, backgroundColor: colors.surface, borderRadius: 20, padding: 14, borderWidth: 1, borderColor: 'rgba(11,77,59,0.06)', ...shadows.sm, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: due.color === colors.green ? colors.greenLight : colors.goldLight, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <MaterialCommunityIcons name="hospital-building" size={20} color={due.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.t1 }}>{apt.title}</Text>
                        <Text style={{ fontSize: 11, color: colors.t3, marginTop: 1 }}>{apt.hospital}{apt.appointment_type ? ` · ${t(`appointments.${apptTypeLabels[apt.appointment_type]}`)}` : ''}</Text>
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 2 }}>
                          <Text style={{ fontSize: 11, color: colors.t4 }}>{formatDate(apt.date)}</Text>
                          <Text style={{ fontSize: 11, color: colors.t4 }}>{formatTime(apt.date)}</Text>
                        </View>
                      </View>
                      <View style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 50, backgroundColor: due.color === colors.green ? colors.greenLight : colors.goldLight }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: due.color }}>{due.text}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}
            {past.length > 0 && (
              <>
                <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', color: colors.t3, marginHorizontal: 24, marginBottom: 12, marginTop: 8 }}>{t('appointments.pastSection')}</Text>
                {past.slice(0, 10).map((apt) => (
                  <TouchableOpacity key={apt.id} onPress={() => openEdit(apt)} style={{ marginHorizontal: 16, marginBottom: 8, backgroundColor: colors.surface, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: 'rgba(11,77,59,0.04)', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: colors.bg2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Feather name="check" size={16} color={colors.t3} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.t2 }}>{apt.title}</Text>
                      <Text style={{ fontSize: 11, color: colors.t4 }}>{formatDate(apt.date)}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>

      <TouchableOpacity onPress={openAdd} style={{ position: 'absolute', right: 24, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', ...shadows.gold }}>
        <Text style={{ fontSize: 28, color: colors.t1, fontWeight: '200', lineHeight: 30 }}>+</Text>
      </TouchableOpacity>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingTop: 24, paddingHorizontal: 24, paddingBottom: 40, maxHeight: '85%' }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.bg2, alignSelf: 'center', marginBottom: 20 }} />
            <Text style={{ fontSize: 18, fontWeight: '800', color: colors.t1, marginBottom: 20 }}>{editing ? t('appointments.edit') : t('appointments.new')}</Text>

            <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: colors.t3, marginBottom: 6 }}>{t('appointments.titleField')}</Text>
            <TextInput value={title} onChangeText={setTitle} placeholder={t('appointments.placeTitle')} placeholderTextColor={colors.t4} style={{ backgroundColor: colors.bg2, borderRadius: 14, padding: 14, fontSize: 15, color: colors.t1, marginBottom: 14 }} />

            <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: colors.t3, marginBottom: 6 }}>{t('appointments.hospital')}</Text>
            <TextInput value={hospital} onChangeText={setHospital} placeholder={t('appointments.placeHospital')} placeholderTextColor={colors.t4} style={{ backgroundColor: colors.bg2, borderRadius: 14, padding: 14, fontSize: 15, color: colors.t1, marginBottom: 14 }} />

            <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: colors.t3, marginBottom: 6 }}>{t('appointments.type')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              {appointmentTypes.map((type) => (
                <TouchableOpacity key={type} onPress={() => setAppointmentType(type)} style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 50, backgroundColor: appointmentType === type ? colors.green : colors.bg2 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: appointmentType === type ? colors.white : colors.t3 }}>{t(`appointments.${apptTypeLabels[type]}`)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 14 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: colors.t3, marginBottom: 6 }}>{t('appointments.date')}</Text>
                <TextInput value={dateStr} onChangeText={setDateStr} placeholder={t('appointments.placeDate')} placeholderTextColor={colors.t4} style={{ backgroundColor: colors.bg2, borderRadius: 14, padding: 14, fontSize: 15, color: colors.t1 }} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: colors.t3, marginBottom: 6 }}>{t('appointments.time')}</Text>
                <TextInput value={timeStr} onChangeText={setTimeStr} placeholder={t('appointments.placeTime')} placeholderTextColor={colors.t4} style={{ backgroundColor: colors.bg2, borderRadius: 14, padding: 14, fontSize: 15, color: colors.t1 }} />
              </View>
            </View>

            <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: colors.t3, marginBottom: 6 }}>{t('appointments.notes')}</Text>
            <TextInput value={notes} onChangeText={setNotes} placeholder={t('appointments.placeNotes')} placeholderTextColor={colors.t4} style={{ backgroundColor: colors.bg2, borderRadius: 14, padding: 14, fontSize: 15, color: colors.t1, marginBottom: 20 }} />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={() => setShowModal(false)} style={{ flex: 1, paddingVertical: 14, borderRadius: 9999, backgroundColor: colors.bg2, alignItems: 'center' }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.t2 }}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={{ flex: 2, paddingVertical: 14, borderRadius: 9999, backgroundColor: colors.green, alignItems: 'center' }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.white }}>{editing ? t('appointments.update') : t('appointments.add')}</Text>
              </TouchableOpacity>
            </View>

            {editing && (
              <TouchableOpacity onPress={() => { setShowModal(false); handleDelete(editing); }} style={{ marginTop: 12, alignItems: 'center' }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.red }}>{t('appointments.delete')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
