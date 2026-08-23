import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, shadows } from '../constants/theme';
import Spinner from '../components/Spinner';
import { alertService, Alert } from '../services/alerts';

const SEVERITY_CONFIG: Record<string, { bg: string; border: string; icon: string; text: string; labelKey: string }> = {
  urgent: { bg: '#FEE2E2', border: '#FECACA', icon: 'alert-triangle', text: '#991B1B', labelKey: 'alerts.urgent' },
  warning: { bg: '#FEF3C7', border: '#FDE68A', icon: 'alert-circle', text: '#92400E', labelKey: 'alerts.warning' },
  info: { bg: '#DBEAFE', border: '#93C5FD', icon: 'info', text: '#1E40AF', labelKey: 'alerts.info' },
};

export default function AlertDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      if (id) {
        const alert = await alertService.getOne(id);
        setAlerts([alert]);
      } else {
        const data = await alertService.getActive();
        setAlerts(data);
        alertService.acknowledgeAll();
      }
    } catch (err) {
      console.log('Failed to load alerts', err);
    } finally {
      setLoading(false);
    }
  };

  return loading ? (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
      <Spinner />
    </View>
  ) : (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ backgroundColor: colors.green, paddingTop: 52, paddingHorizontal: 24, paddingBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 8 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
            <Feather name="arrow-left" size={22} color={colors.white} />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.white }}>{t('alerts.title')}</Text>
        </View>
        <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginLeft: 8 }}>{alerts.length}{id ? '' : ` ${t('alerts.unread')}`}</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 96 }}>
        {alerts.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <Feather name="check-circle" size={48} color={colors.green} />
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.t1, marginTop: 16 }}>{t('alerts.noActive')}</Text>
            <Text style={{ fontSize: 13, color: colors.t3, marginTop: 4, textAlign: 'center' }}>{t('alerts.caughtUp')}</Text>
          </View>
        ) : (
          alerts.map((alert) => {
            const cfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.info;
            const severityLabel = t(cfg.labelKey);
            return (
              <View key={alert.id} style={{ marginBottom: 12, backgroundColor: colors.surface, borderRadius: 24, padding: 16, borderWidth: 1, borderColor: 'rgba(11,77,59,0.06)', ...shadows.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: cfg.bg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Feather name={cfg.icon as any} size={20} color={cfg.text} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: colors.t1, flex: 1 }}>{alert.title}</Text>
                      <View style={{ paddingVertical: 2, paddingHorizontal: 8, borderRadius: 50, backgroundColor: cfg.bg }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: cfg.text }}>{severityLabel}</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 13, color: colors.t2, lineHeight: 20 }}>{alert.body}</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
