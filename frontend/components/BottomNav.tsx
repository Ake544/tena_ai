import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line, Polyline, Rect } from 'react-native-svg';
import { colors } from '../constants/theme';

type Tab = 'home' | 'log' | 'tips' | 'history' | 'profile';

interface BottomNavProps {
  activeTab: Tab;
  onTabPress: (tab: Tab) => void;
}

const tabs: { key: Tab; label: string }[] = [
  { key: 'home', label: '' },
  { key: 'log', label: 'Log' },
  { key: 'tips', label: 'Tips' },
  { key: 'history', label: 'History' },
  { key: 'profile', label: 'Profile' },
];

const iconSize = 24;
const strokeWidth = 1.8;

function HomeIcon({ active }: { active: boolean }) {
  const stroke = active ? colors.green : colors.t3;
  return (
    <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <Polyline points="9 22 9 12 15 12 15 22" />
    </Svg>
  );
}

function LogIcon({ active }: { active: boolean }) {
  const stroke = active ? colors.green : colors.t3;
  return (
    <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="9" />
      <Line x1="12" y1="8" x2="12" y2="16" />
      <Line x1="8" y1="12" x2="16" y2="12" />
    </Svg>
  );
}

function TipsIcon({ active }: { active: boolean }) {
  const stroke = active ? colors.green : colors.t3;
  return (
    <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="10" />
      <Path d="M12 8v4l3 3" />
    </Svg>
  );
}

function HistoryIcon({ active }: { active: boolean }) {
  const stroke = active ? colors.green : colors.t3;
  return (
    <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </Svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  const stroke = active ? colors.green : colors.t3;
  return (
    <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <Circle cx="12" cy="7" r="4" />
    </Svg>
  );
}

const iconComponents: Record<Tab, typeof HomeIcon> = {
  home: HomeIcon,
  log: LogIcon,
  tips: TipsIcon,
  history: HistoryIcon,
  profile: ProfileIcon,
};

export default function BottomNav({ activeTab, onTabPress }: BottomNavProps) {
  return (
    <View style={styles.container}>
      {tabs.map(({ key, label }) => {
        const isActive = key === activeTab;
        const Icon = iconComponents[key];
        return (
          <TouchableOpacity key={key} style={[styles.item, !isActive && styles.itemInactive]} onPress={() => onTabPress(key)} activeOpacity={0.7}>
            <Icon active={isActive} />
            {isActive ? (
              <View style={styles.dot} />
            ) : (
              label ? <Text style={styles.label}>{label}</Text> : null
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.bg2,
    paddingTop: 12,
    paddingBottom: 28,
    paddingHorizontal: 8,
    zIndex: 50,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  itemInactive: {
    opacity: 0.45,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.green,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.green,
  },
});
