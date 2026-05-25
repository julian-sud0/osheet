/**
 * Design tokens ported from the original prototype (index.html lines 11-18).
 * Keep these in sync with any palette decisions made in design reviews.
 */

export const colors = {
  cream: '#F6F1E8',
  cream2: '#EFE7D6',
  fog: '#E8E1D4',

  sage: '#7FA88B',
  sageDark: '#5C8770',
  sageLight: '#d7e3da',

  terra: '#D88B6B',
  terraDark: '#B86A4C',
  terraLight: '#f7e5dc',

  blue: '#7C9BB3',
  blueLight: '#d7e0e8',

  cocoa: '#3D332B',
  cocoa2: '#6B5E54',

  stageBg: '#d9d1c2',
  phoneBezel: '#c9bfae',
} as const;

export const shadows = {
  card: {
    shadowColor: '#3D332B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 4,
  },
  fab: {
    shadowColor: '#3D332B',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 28,
    elevation: 8,
  },
} as const;

export const fonts = {
  display: 'Fraunces_500Medium',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemibold: 'Inter_600SemiBold',
} as const;

export const radii = {
  sm: 8,
  md: 14,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 22,
  xl: 32,
} as const;

export const type = {
  title: { fontFamily: fonts.display, fontSize: 28, lineHeight: 32, letterSpacing: -0.28 },
  section: { fontFamily: fonts.display, fontSize: 20, lineHeight: 24 },
  body: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21 },
  sub: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19.5, color: colors.cocoa2 },
  label: {
    fontFamily: fonts.bodySemibold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
    color: colors.cocoa2,
  },
} as const;
