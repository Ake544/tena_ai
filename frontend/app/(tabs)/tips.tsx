import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Card from '../../components/Card';
import { colors, typography } from '../../constants/theme';
import { tipService, Tip } from '../../services/tips';

const { width } = Dimensions.get('window');

const CATEGORY_COLORS: Record<string, [string, string]> = {
  medication: ['#0B4D3B', '#1A6B52'],
  glucose: ['#8B5A00', '#C47A20'],
  diet: ['#1A3D6B', '#2A6DB5'],
  exercise: ['#4A1A6B', '#7A2DB5'],
  adherence: ['#0B4D3B', '#1A6B52'],
  monitoring: ['#8B5A00', '#C47A20'],
  lifestyle: ['#1A3D6B', '#2A6DB5'],
  education: ['#4A1A6B', '#7A2DB5'],
};

const CATEGORY_ICONS: Record<string, string> = {
  medication: 'pill',
  glucose: 'chart-bar',
  diet: 'food',
  exercise: 'walk',
  adherence: 'shield-check',
  monitoring: 'activity',
  lifestyle: 'heart',
  education: 'book-open',
};

function getCategoryGradient(category: string): [string, string] {
  return CATEGORY_COLORS[category] || ['#0B4D3B', '#1A6B52'];
}

function getCategoryIcon(category: string): string {
  return CATEGORY_ICONS[category] || 'lightbulb';
}

export default function TipsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [tips, setTips] = useState<Tip[]>([]);
  const [history, setHistory] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTips();
  }, []);

  const loadTips = async () => {
    try {
      const data = await tipService.getToday();
      setTips(data.today);
      setHistory(data.history);
    } catch (err) {
      console.log('Failed to load tips', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.title}>{t('tips.title')}</Text>
          <Text style={styles.titleSub}>{tips.length > 0 ? t('tips.dailyTip', { count: tips.length }) : t('tips.loading')}</Text>
        </View>
        {tips.length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{tips.length} {t('tips.new')}</Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <Text style={{ textAlign: 'center', color: colors.t3, marginTop: 40 }}>{t('tips.loading')}</Text>
        ) : tips.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Feather name="info" size={40} color={colors.t4} />
            <Text style={{ fontSize: 14, color: colors.t3, marginTop: 12 }}>{t('tips.noTips')}</Text>
          </View>
        ) : (
          tips.map((tip) => {
            const [c1, c2] = getCategoryGradient(tip.category);
            const icon = getCategoryIcon(tip.category);
            return (
              <LinearGradient key={tip.id} colors={[c1, c2]} style={styles.tipCard}>
                <View style={[styles.decorCircle, { bottom: -20, right: -20 }]} />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                  <MaterialCommunityIcons name={icon as any} size={14} color="rgba(255,255,255,0.5)" />
                  <Text style={styles.tipLabel}>{tip.category.charAt(0).toUpperCase() + tip.category.slice(1)}</Text>
                </View>
                <Text style={styles.tipTitle}>{tip.title}</Text>
                <Text style={styles.tipBody}>{tip.body}</Text>
                {tip.fact && (
                  <View style={styles.factBox}>
                    <Text style={styles.factText}>{tip.fact}</Text>
                  </View>
                )}
              </LinearGradient>
            );
          })
        )}

        {history.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t('tips.previous')}</Text>
            {history.slice(0, 5).map((tip) => (
              <Card key={tip.id} style={styles.historyCard}>
                <Text style={styles.historyCategory}>{tip.category}</Text>
                <Text style={styles.historyTitle}>{tip.title}</Text>
                <Text style={styles.historyBody} numberOfLines={2}>{tip.body}</Text>
              </Card>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: 56,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.t1,
  },
  titleSub: {
    fontSize: 12,
    color: colors.t3,
    marginTop: 2,
  },
  badge: {
    backgroundColor: colors.greenLight,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 50,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.green,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 96,
  },
  tipCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  decorCircle: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  tipLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.55)',
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.white,
    marginBottom: 6,
  },
  tipBody: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
    marginBottom: 12,
  },
  factBox: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    padding: 12,
  },
  factText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.t1,
    marginBottom: 12,
    marginTop: 8,
  },
  historyCard: {
    marginBottom: 10,
  },
  historyCategory: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.green,
    marginBottom: 4,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.t1,
    marginBottom: 4,
  },
  historyBody: {
    fontSize: 12,
    color: colors.t3,
    lineHeight: 18,
  },
});
