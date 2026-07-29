import { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';
import { patientService, PatientProfile, GlucoseStats, GlucoseTodaySlot } from '../../services/patient';
import { syncService } from '../../services/sync';
import { dbService } from '../../services/db';
import { medicationService, Medication, Appointment } from '../../services/medication';
import { tipService, Tip } from '../../services/tips';
import { alertService, Alert } from '../../services/alerts';
import { chatService } from '../../services/chat';

const HOME_CACHE_KEY = 'tena_ai_home_cache';

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [stats, setStats] = useState<GlucoseStats | null>(null);
  const [todaySlots, setTodaySlots] = useState<GlucoseTodaySlot[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [tips, setTips] = useState<Tip[]>([]);
  const [unreadAlerts, setUnreadAlerts] = useState<Alert[]>([]);
  const [chatVisible, setChatVisible] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      syncService.syncPending().catch(() => {});
      const [p, s, t, m, a] = await Promise.allSettled([
        patientService.getProfile(),
        patientService.getStats(),
        patientService.getTodayReadings(),
        medicationService.list(),
        medicationService.listAppointments(),
      ]);
      if (p.status === 'fulfilled') setProfile(p.value);
      if (s.status === 'fulfilled') setStats(s.value);
      if (t.status === 'fulfilled') setTodaySlots(t.value.slots);
      if (m.status === 'fulfilled') setMedications(m.value);
      if (a.status === 'fulfilled') setAppointments(a.value);
      await tipService.getToday().then(d => setTips(d.today)).catch(() => {});
      await alertService.getActive().then(d => setUnreadAlerts(d)).catch(() => {});
      const failed = [p, s, t, m, a].filter(r => r.status === 'rejected');
      if (failed.length === 0) {
        dbService.cacheSet(HOME_CACHE_KEY, JSON.stringify({
          profile: p.status === 'fulfilled' ? p.value : null,
          stats: s.status === 'fulfilled' ? s.value : null,
          todaySlots: t.status === 'fulfilled' ? t.value.slots : [],
          medications: m.status === 'fulfilled' ? m.value : [],
          appointments: a.status === 'fulfilled' ? a.value : [],
        })).catch(() => {});
      } else {
        const cached = await dbService.cacheGet(HOME_CACHE_KEY).catch(() => null);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (p.status === 'rejected') setProfile(parsed.profile);
          if (s.status === 'rejected') setStats(parsed.stats);
          if (t.status === 'rejected') setTodaySlots(parsed.todaySlots);
          if (m.status === 'rejected') setMedications(parsed.medications);
          if (a.status === 'rejected') setAppointments(parsed.appointments);
        }
      }
    } catch (err) {
      console.log('Failed to load home data', err);
      const cached = await dbService.cacheGet(HOME_CACHE_KEY).catch(() => null);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.profile) setProfile(parsed.profile);
          if (parsed.stats) setStats(parsed.stats);
          if (parsed.todaySlots) setTodaySlots(parsed.todaySlots);
          if (parsed.medications) setMedications(parsed.medications);
          if (parsed.appointments) setAppointments(parsed.appointments);
        } catch {}
      }
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

  const getNearestPending = (med: Medication): { time: string; status: 'pending' | 'overdue' } | null => {
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
  };

  const medAdherence = medications.length > 0
    ? Math.round((medications.filter(m => m.taken_today).length / medications.length) * 100)
    : null;

  const pendingMeds = medications
    .map(m => ({ med: m, nearest: getNearestPending(m) }))
    .filter(x => x.nearest)
    .sort((a, b) => {
      const { h: ah, m: am } = parseTime(a.nearest!.time);
      const { h: bh, m: bm } = parseTime(b.nearest!.time);
      return (ah * 60 + am) - (bh * 60 + bm);
    });

  const nextAppt = appointments.length > 0
    ? appointments
        .filter(a => new Date(a.date) > new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]
    : null;

  const bedtimeSlot = todaySlots.find(s => s.reading_type === 'Bedtime');
  const bedtimeLogged = bedtimeSlot?.value != null;

  const handleSend = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: text }]);
    setChatLoading(true);
    try {
      const resp = await chatService.sendMessage(text);
      setChatMessages(prev => [...prev, { role: 'assistant', content: resp }]);
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I'm having trouble connecting right now. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const maxBarHeight = (val: number | null) => {
    if (val === null) return '10%';
    const pct = (val / 300) * 100;
    return `${Math.min(Math.max(pct, 10), 95)}%`;
  };

  const barColor = (val: number | null) => {
    if (val === null) return colors.bg2;
    if (val > 180) return colors.red;
    if (val < 70) return '#D94F3D';
    return colors.green;
  };

  const today = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dateStr = `${dayNames[today.getDay()]}, ${today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ backgroundColor: colors.green, paddingTop: 52, paddingHorizontal: 24, paddingBottom: 20, flexShrink: 0 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{t('home.greeting', 'ሰላም')}</Text>
              <Feather name="smile" size={16} color="rgba(255,255,255,0.55)" />
            </View>
            <Text style={{ fontSize: 24, fontWeight: '800', color: colors.white }}>{profile?.full_name || '...'}</Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Day {stats?.days_logged || 0} of tracking · {dateStr}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.white }}>{profile?.full_name?.split(' ').map(n => n[0]).join('') || 'AB'}</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 12, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: colors.white, fontVariant: ['tabular-nums'] }}>{stats?.last_glucose ?? '—'}</Text>
            <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>Last glucose</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 12, alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: colors.gold2, fontVariant: ['tabular-nums'] }}>{stats?.days_logged ?? 0}</Text>
              <MaterialCommunityIcons name="fire" size={20} color={colors.gold2} />
            </View>
            <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>Day streak</Text>
          </View>
            <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 12, alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: colors.white }}>{medAdherence != null ? `${medAdherence}%` : '—'}</Text>
              <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>Med adherence</Text>
          </View>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 16, paddingBottom: 96 }}>
        {stats && stats.today_high_count >= 2 && (
          <TouchableOpacity style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: colors.redLight, borderRadius: 20, padding: 14, paddingHorizontal: 16, flexDirection: 'row', gap: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(217,79,61,0.15)' }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Feather name="alert-triangle" size={20} color={colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.red }}>High readings today</Text>
              <Text style={{ fontSize: 12, color: colors.t3, marginTop: 2, lineHeight: 16 }}>{stats.today_high_count} readings above 180 mg/dL</Text>
            </View>
            <Text style={{ color: colors.t3, fontSize: 16 }}>›</Text>
          </TouchableOpacity>
        )}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 12 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', color: colors.t3 }}>Today's glucose</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/log')}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.green }}>Log reading</Text>
          </TouchableOpacity>
        </View>
        <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: colors.surface, borderRadius: 24, padding: 20, ...shadows.sm, borderWidth: 1, borderColor: 'rgba(11,77,59,0.06)' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <View>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.t1 }}>Today's readings</Text>
              <Text style={{ fontSize: 12, color: colors.t3, marginTop: 2 }}>mg/dL</Text>
            </View>
            {stats && stats.today_high_count > 0 && (
              <View style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 50, backgroundColor: colors.redLight }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.red }}>{stats.today_high_count} high</Text>
              </View>
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 100 }}>
            {todaySlots.map((slot, i) => (
              <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 9, fontWeight: '600', color: 'rgba(0,0,0,0.35)', marginBottom: 3, fontVariant: ['tabular-nums'] }}>{slot.value ?? ''}</Text>
                <View style={{ width: '100%', backgroundColor: barColor(slot.value), borderRadius: 4, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, height: maxBarHeight(slot.value) }} />
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <Text style={{ fontSize: 9, color: colors.t4 }}>Fasting</Text>
            <Text style={{ fontSize: 9, color: colors.t4 }}>Post-B'fast</Text>
            <Text style={{ fontSize: 9, color: colors.t4 }}>Pre-lunch</Text>
            <Text style={{ fontSize: 9, color: colors.t4 }}>Post-lunch</Text>
            <Text style={{ fontSize: 9, color: colors.t4 }}>Pre-dinner</Text>
            <Text style={{ fontSize: 9, color: colors.t4 }}>Bedtime</Text>
          </View>
        </View>

        {unreadAlerts.length > 0 && (
          <TouchableOpacity onPress={() => router.push('/alert-detail')} style={{ marginHorizontal: 16, marginBottom: 12 }}>
            <View style={{ backgroundColor: unreadAlerts.some(a => a.severity === 'urgent') ? '#FEE2E2' : '#FEF3C7', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: unreadAlerts.some(a => a.severity === 'urgent') ? '#FECACA' : '#FDE68A' }}>
              <Feather name={unreadAlerts.some(a => a.severity === 'urgent') ? 'alert-triangle' : 'alert-circle'} size={20} color={unreadAlerts.some(a => a.severity === 'urgent') ? '#DC2626' : '#D97706'} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: unreadAlerts.some(a => a.severity === 'urgent') ? '#991B1B' : '#92400E' }}>{unreadAlerts.length} unread alert{unreadAlerts.length > 1 ? 's' : ''}</Text>
                <Text style={{ fontSize: 11, color: unreadAlerts.some(a => a.severity === 'urgent') ? '#991B1B' : '#92400E', marginTop: 1 }}>{unreadAlerts[0].title}</Text>
              </View>
              <Text style={{ fontSize: 18, color: unreadAlerts.some(a => a.severity === 'urgent') ? '#991B1B' : '#92400E' }}>›</Text>
            </View>
          </TouchableOpacity>
        )}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 12 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', color: colors.t3 }}>Today's tip</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/tips')}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.green }}>See all {tips.length}</Text>
          </TouchableOpacity>
        </View>
        {tips.length > 0 ? (
          <TouchableOpacity onPress={() => router.push('/(tabs)/tips')} style={{ marginHorizontal: 16, marginBottom: 16, borderRadius: 24, overflow: 'hidden' }}>
            <LinearGradient colors={['#0B4D3B', '#1A6B52']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 20, position: 'relative', overflow: 'hidden' }}>
              <View style={{ position: 'absolute', top: -24, right: -24, width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(255,255,255,0.06)' }} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 }}>
                <MaterialCommunityIcons name="pill" size={14} color="rgba(255,255,255,0.55)" />
                <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>{tips[0].category}</Text>
              </View>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.white, marginBottom: 8 }}>{tips[0].title}</Text>
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 20, marginBottom: 12 }}>{tips[0].body}</Text>
              {tips[0].fact && (
                <View style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 12 }}>
                  <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', lineHeight: 16 }}>{tips[0].fact}</Text>
                </View>
              )}
              <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{tips.length - 1} more tip{tips.length > 2 ? 's' : ''} today</Text>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>›</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => router.push('/(tabs)/tips')} style={{ marginHorizontal: 16, marginBottom: 16, borderRadius: 24, backgroundColor: colors.surface, padding: 20, borderWidth: 1, borderColor: 'rgba(11,77,59,0.06)', ...shadows.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Feather name="info" size={16} color={colors.t3} />
              <Text style={{ fontSize: 13, color: colors.t3 }}>Log a glucose reading to get your personalized tip</Text>
            </View>
          </TouchableOpacity>
        )}

        {(pendingMeds.length > 0 || medications.length === 0 || nextAppt || !bedtimeLogged) && (
        <>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 12 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', color: colors.t3 }}>Reminders</Text>
        </View>
        <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: colors.surface, borderRadius: 24, padding: 20, ...shadows.sm, borderWidth: 1, borderColor: 'rgba(11,77,59,0.06)' }}>
          {pendingMeds.length > 0 ? pendingMeds.map(({ med, nearest }, idx) => (
            <TouchableOpacity key={med.id} onPress={() => router.push('/medications')} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: (idx < pendingMeds.length - 1 || nextAppt || !bedtimeLogged) ? 1 : 0, borderBottomColor: colors.bg2 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MaterialCommunityIcons name="pill" size={20} color={colors.green} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.t1 }}>{med.name} {med.dose}</Text>
                <Text style={{ fontSize: 12, color: colors.t3, marginTop: 1 }}>Due at {formatTime(nearest!.time)} · {nearest!.status === 'overdue' ? 'Overdue' : 'Not yet taken'}</Text>
              </View>
              <View style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 50, backgroundColor: nearest!.status === 'overdue' ? '#FEE2E2' : colors.goldLight }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: nearest!.status === 'overdue' ? '#DC2626' : '#9A6200' }}>{nearest!.status === 'overdue' ? 'Overdue' : 'Pending'}</Text>
              </View>
            </TouchableOpacity>
          )) : medications.length > 0 ? null : (
            <TouchableOpacity onPress={() => router.push('/medications')} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.bg2 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.bg2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MaterialCommunityIcons name="pill" size={20} color={colors.t3} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.t1 }}>No medications yet</Text>
                <Text style={{ fontSize: 12, color: colors.t3, marginTop: 1 }}>Add medications in Profile to track adherence</Text>
              </View>
            </TouchableOpacity>
          )}
          {nextAppt ? (
            <TouchableOpacity onPress={() => router.push('/appointments')} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: nextAppt && !bedtimeLogged ? 1 : 0, borderBottomColor: colors.bg2 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.blueLight, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MaterialCommunityIcons name="hospital-building" size={20} color="#3B82F6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.t1 }}>{nextAppt.title}</Text>
                <Text style={{ fontSize: 12, color: colors.t3, marginTop: 1 }}>{nextAppt.hospital}</Text>
              </View>
              <View style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 50, backgroundColor: colors.greenLight }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.green }}>{nextAppt.date.split('T')[0]}</Text>
              </View>
            </TouchableOpacity>
          ) : null}
          {!bedtimeLogged && (
            <TouchableOpacity onPress={() => router.push('/(tabs)/log')} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.bg2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MaterialCommunityIcons name="water" size={20} color={colors.t3} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.t1 }}>Bedtime glucose log</Text>
                <Text style={{ fontSize: 12, color: colors.t3, marginTop: 1 }}>Not yet logged today</Text>
              </View>
              <View style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 50, backgroundColor: colors.amberLight }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.amber }}>Tonight</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
        </>
        )}
      </ScrollView>

      <TouchableOpacity onPress={() => { setChatVisible(true); }} style={{ position: 'absolute', right: 24, bottom: 88, width: 48, height: 48, borderRadius: 24, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center', ...shadows.gold }}>
        <Feather name="message-circle" size={22} color={colors.white} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/(tabs)/log')} style={{ position: 'absolute', right: 24, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', ...shadows.gold }}>
        <Text style={{ fontSize: 28, color: colors.t1, fontWeight: '200', lineHeight: 30 }}>+</Text>
      </TouchableOpacity>

      <Modal visible={chatVisible} animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.bg }}>
          <View style={{ backgroundColor: colors.green, paddingTop: 52, paddingHorizontal: 24, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                <Feather name="message-circle" size={18} color={colors.white} />
              </View>
              <View>
                <Text style={{ fontSize: 17, fontWeight: '800', color: colors.white }}>Tena AI Chat</Text>
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Diabetes assistant</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setChatVisible(false)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="x" size={18} color={colors.white} />
            </TouchableOpacity>
          </View>
          <ScrollView ref={scrollViewRef} style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} onContentSizeChange={() => scrollViewRef.current?.scrollToEnd()}>
            {chatMessages.length === 0 ? (
              <View style={{ alignItems: 'center', marginTop: 60 }}>
                <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Feather name="message-square" size={28} color={colors.green} />
                </View>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.t1 }}>Ask me anything</Text>
                <Text style={{ fontSize: 13, color: colors.t3, marginTop: 8, textAlign: 'center', lineHeight: 20 }}>I can help with your diabetes care — from meal ideas to understanding your glucose readings.</Text>
              </View>
            ) : (
              chatMessages.map((msg, i) => (
                <View key={i} style={{ flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', marginBottom: 12, alignItems: 'flex-end', gap: 8 }}>
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: msg.role === 'user' ? colors.goldLight : colors.greenLight, alignItems: 'center', justifyContent: 'center' }}>
                    <Feather name={msg.role === 'user' ? 'user' : 'message-circle'} size={14} color={msg.role === 'user' ? '#9A6200' : colors.green} />
                  </View>
                  <View style={{ maxWidth: '75%', backgroundColor: msg.role === 'user' ? colors.green : colors.surface, borderRadius: 16, borderBottomRightRadius: msg.role === 'user' ? 4 : 16, borderBottomLeftRadius: msg.role === 'user' ? 16 : 4, padding: 12, ...(msg.role === 'assistant' ? shadows.sm : {}) }}>
                    <Text style={{ fontSize: 14, color: msg.role === 'user' ? colors.white : colors.t1, lineHeight: 22 }}>{msg.content}</Text>
                  </View>
                </View>
              ))
            )}
            {chatLoading && (
              <View style={{ flexDirection: 'row', marginBottom: 12, alignItems: 'center', gap: 8 }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center' }}>
                  <Feather name="message-circle" size={14} color={colors.green} />
                </View>
                <View style={{ backgroundColor: colors.surface, borderRadius: 16, borderBottomLeftRadius: 4, padding: 14, ...shadows.sm }}>
                  <ActivityIndicator size="small" color={colors.green} />
                </View>
              </View>
            )}
          </ScrollView>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, paddingBottom: 20, borderTopWidth: 1, borderTopColor: colors.bg2, backgroundColor: colors.bg }}>
            <TextInput
              value={chatInput}
              onChangeText={setChatInput}
              placeholder="Ask Tena AI..."
              placeholderTextColor={colors.t4}
              style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 50, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: colors.t1, borderWidth: 1, borderColor: 'rgba(11,77,59,0.1)' }}
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />
            <TouchableOpacity onPress={handleSend} disabled={chatLoading} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: chatLoading ? colors.t4 : colors.green, alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="send" size={16} color={colors.white} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
