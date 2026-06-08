import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, shadows } from '../constants/theme';
import { medicationService, Medication } from '../services/medication';

const frequencies = ['Once daily', 'Twice daily', 'Three times daily', 'As needed'];

export default function MedicationsScreen() {
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
      Alert.alert('Required', 'Name and dose are required');
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
      Alert.alert('Error', err.response?.data?.detail || 'Failed to save');
    }
  };

  const handleDelete = (med: Medication) => {
    Alert.alert('Delete medication', `Remove ${med.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await medicationService.delete(med.id);
        loadMeds();
      }},
    ]);
  };

  const handleTaken = async (med: Medication) => {
    try {
      await medicationService.markTaken(med.id);
      loadMeds();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Failed to update');
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
            <Text style={{ fontSize: 20, fontWeight: '800', color: colors.white }}>Medications</Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{medications.length} active prescriptions</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 12, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: colors.white }}>{adherence}%</Text>
            <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>Today adherence</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 12, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: colors.gold2 }}>{takenCount}/{medications.length}</Text>
            <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>Taken today</Text>
          </View>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 16, paddingBottom: 96 }}>
        {medications.length === 0 ? (
          <View style={{ marginHorizontal: 16, backgroundColor: colors.surface, borderRadius: 24, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(11,77,59,0.06)', ...shadows.sm }}>
            <MaterialCommunityIcons name="pill" size={40} color={colors.t4} />
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.t2, marginTop: 16 }}>No medications yet</Text>
            <Text style={{ fontSize: 13, color: colors.t3, marginTop: 4, textAlign: 'center' }}>Add your first medication to start tracking adherence</Text>
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
                  <Text style={{ fontSize: 12, color: colors.t3, marginTop: 2 }}>{med.frequency} · {med.times}</Text>
                </View>
                <TouchableOpacity onPress={() => handleTaken(med)} style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 50, backgroundColor: med.taken_today ? colors.greenLight : colors.bg2 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: med.taken_today ? colors.green : colors.t3 }}>{med.taken_today ? 'Taken' : 'Mark'}</Text>
                </TouchableOpacity>
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
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingTop: 24, paddingHorizontal: 24, paddingBottom: 40, maxHeight: '85%' }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.bg2, alignSelf: 'center', marginBottom: 20 }} />
            <Text style={{ fontSize: 18, fontWeight: '800', color: colors.t1, marginBottom: 20 }}>{editing ? 'Edit medication' : 'New medication'}</Text>

            <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: colors.t3, marginBottom: 6 }}>Name</Text>
            <TextInput value={name} onChangeText={setName} placeholder="e.g. Metformin" placeholderTextColor={colors.t4} style={{ backgroundColor: colors.bg2, borderRadius: 14, padding: 14, fontSize: 15, color: colors.t1, marginBottom: 14 }} />

            <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: colors.t3, marginBottom: 6 }}>Dose</Text>
            <TextInput value={dose} onChangeText={setDose} placeholder="e.g. 500mg" placeholderTextColor={colors.t4} style={{ backgroundColor: colors.bg2, borderRadius: 14, padding: 14, fontSize: 15, color: colors.t1, marginBottom: 14 }} />

            <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: colors.t3, marginBottom: 6 }}>Frequency</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              {frequencies.map((f) => (
                <TouchableOpacity key={f} onPress={() => setFrequency(f)} style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 50, backgroundColor: frequency === f ? colors.green : colors.bg2 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: frequency === f ? colors.white : colors.t3 }}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: colors.t3, marginBottom: 6 }}>Times</Text>
            <TextInput value={times} onChangeText={setTimes} placeholder="e.g. 8:00 AM, 8:00 PM" placeholderTextColor={colors.t4} style={{ backgroundColor: colors.bg2, borderRadius: 14, padding: 14, fontSize: 15, color: colors.t1, marginBottom: 14 }} />

            <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: colors.t3, marginBottom: 6 }}>Notes (optional)</Text>
            <TextInput value={notes} onChangeText={setNotes} placeholder="Side effects, instructions..." placeholderTextColor={colors.t4} style={{ backgroundColor: colors.bg2, borderRadius: 14, padding: 14, fontSize: 15, color: colors.t1, marginBottom: 20 }} />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={() => setShowModal(false)} style={{ flex: 1, paddingVertical: 14, borderRadius: 9999, backgroundColor: colors.bg2, alignItems: 'center' }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.t2 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={{ flex: 2, paddingVertical: 14, borderRadius: 9999, backgroundColor: colors.green, alignItems: 'center' }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.white }}>{editing ? 'Update' : 'Add medication'}</Text>
              </TouchableOpacity>
            </View>

            {editing && (
              <TouchableOpacity onPress={() => { setShowModal(false); handleDelete(editing); }} style={{ marginTop: 12, alignItems: 'center' }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.red }}>Delete medication</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
