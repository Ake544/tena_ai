import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../constants/theme';

export default function MedicalDisclaimer() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync('tena_ai_disclaimer_accepted').then((val) => {
      if (!val) setVisible(true);
    });
  }, []);

  const accept = async () => {
    await SecureStore.setItemAsync('tena_ai_disclaimer_accepted', 'true');
    setVisible(false);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: spacing.r20 }}>
        <View style={{ backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.r24, maxHeight: '80%' }}>
          <View style={{ alignItems: 'center', marginBottom: spacing.r16 }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.amberLight, alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="alert-triangle" size={24} color={colors.amber} />
            </View>
          </View>

          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.t1, textAlign: 'center', marginBottom: spacing.r4 }}>
            Medical Disclaimer
          </Text>
          <Text style={{ fontSize: 13, fontWeight: '500', color: colors.t3, textAlign: 'center', marginBottom: spacing.r20 }}>
            Please read carefully
          </Text>

          <ScrollView style={{ marginBottom: spacing.r20 }} showsVerticalScrollIndicator={false}>
            <Text style={{ fontSize: 14, fontWeight: '500', color: colors.t2, lineHeight: 22, marginBottom: spacing.r12 }}>
              Tena AI is designed for informational and self-management purposes only. It is NOT a substitute for professional medical advice, diagnosis, or treatment.
            </Text>
            <Text style={{ fontSize: 14, fontWeight: '500', color: colors.t2, lineHeight: 22, marginBottom: spacing.r12 }}>
              • Always consult a qualified healthcare provider with any questions about your health.
            </Text>
            <Text style={{ fontSize: 14, fontWeight: '500', color: colors.t2, lineHeight: 22, marginBottom: spacing.r12 }}>
              • Never disregard professional medical advice or delay seeking it because of something you read in this app.
            </Text>
            <Text style={{ fontSize: 14, fontWeight: '500', color: colors.t2, lineHeight: 22, marginBottom: spacing.r12 }}>
              • Glucose readings, AI tips, and alerts provided are estimates, they do not constitute a medical diagnosis.
            </Text>
            <Text style={{ fontSize: 14, fontWeight: '500', color: colors.t2, lineHeight: 22, marginBottom: spacing.r12 }}>
              • If you are experiencing a medical emergency, call your local emergency services immediately.
            </Text>
            <Text style={{ fontSize: 14, fontWeight: '500', color: colors.t2, lineHeight: 22, marginBottom: spacing.r12 }}>
              • By using this app, you agree that the developers are not liable for any decisions or actions taken based on the app's data or recommendations.
            </Text>
            <Text style={{ fontSize: 14, fontWeight: '500', color: colors.t3, lineHeight: 22, fontStyle: 'italic' }}>
              This disclaimer is also governed by our Terms of Service and Privacy Policy, which you accepted during sign-up.
            </Text>
          </ScrollView>

          <TouchableOpacity
            onPress={accept}
            activeOpacity={0.8}
            style={{ backgroundColor: colors.green, borderRadius: borderRadius.r12, paddingVertical: 14, alignItems: 'center' }}
          >
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.white }}>I Understand</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
