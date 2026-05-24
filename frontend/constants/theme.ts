export const colors = {
  // 60% neutral base
  bg: '#F7F9F7',
  bg2: '#EFF4F0',
  surface: '#FFFFFF',
  surface2: '#F2F7F3',
  // 30% deep forest green
  green: '#0B4D3B',
  green2: '#1A6B52',
  green3: '#2E8B6A',
  greenLight: '#E3F0EB',
  greenXlight: '#F0F8F4',
  // 10% warm gold accent
  gold: '#E8A020',
  gold2: '#F5C04A',
  goldLight: '#FEF3DC',
  // Semantic
  red: '#D94F3D',
  redLight: '#FDECEA',
  amber: '#F07A30',
  amberLight: '#FEF0E6',
  blue: '#2A6DB5',
  blueLight: '#E8F0FB',
  // Text (opacity-based hierarchy)
  t1: '#1C2B25',
  t2: '#3D5A4E',
  t3: '#7A9E90',
  t4: '#B2CEC5',
  // Legacy aliases
  primary: '#0B4D3B',
  primaryLight: '#E3F0EB',
  secondary: '#E8A020',
  secondaryLight: '#FEF3DC',
  error: '#D94F3D',
  errorLight: '#FDECEA',
  background: '#F7F9F7',
  text: '#1C2B25',
  textSecondary: '#7A9E90',
  border: '#EFF4F0',
  disabled: '#B2CEC5',
  white: '#FFFFFF',
  shadow: '#0B4D3B',
};

export const spacing = {
  r4: 4,
  r8: 8,
  r12: 12,
  r16: 16,
  r20: 20,
  r24: 24,
  r32: 32,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
  r12: 12,
  r16: 16,
  r20: 20,
  r24: 24,
};

export const typography = {
  display: { fontSize: 32, fontWeight: '800' as const, lineHeight: 37 },
  title: { fontSize: 22, fontWeight: '700' as const, lineHeight: 28 },
  subtitle: { fontSize: 17, fontWeight: '600' as const, lineHeight: 24 },
  body: { fontSize: 14, fontWeight: '500' as const, lineHeight: 22 },
  small: { fontSize: 12, fontWeight: '500' as const, lineHeight: 17 },
  label: { fontSize: 11, fontWeight: '700' as const, lineHeight: 15, letterSpacing: 0.6 },
  h1: { fontSize: 32, fontWeight: '800' as const, lineHeight: 37 },
  h2: { fontSize: 22, fontWeight: '700' as const, lineHeight: 28 },
  h3: { fontSize: 17, fontWeight: '600' as const, lineHeight: 24 },
  bodySmall: { fontSize: 14, fontWeight: '500' as const, lineHeight: 22 },
  caption: { fontSize: 12, fontWeight: '500' as const, lineHeight: 17 },
  button: { fontSize: 15, fontWeight: '700' as const, lineHeight: 24 },
};

export const shadows = {
  sm: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  md: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  lg: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 40,
    elevation: 10,
  },
  gold: {
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  green: {
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
};
