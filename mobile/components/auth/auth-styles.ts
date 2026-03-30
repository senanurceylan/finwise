import { StyleSheet } from 'react-native';

export const authColors = {
  pageBg: '#0b0e11',
  cardBg: '#1e2329',
  cardBorder: '#2b3139',
  textPrimary: '#eaecef',
  textMuted: '#848e9c',
  textDanger: '#f6465d',
  textBrand: '#f0b90b',
  textBrandHover: '#f5d066',
  inputBg: '#0b0e11',
  inputBorder: '#2b3139',
} as const;

export const authStyles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: authColors.pageBg,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  authPanel: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  appHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  appTitle: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
    color: authColors.textBrand,
    letterSpacing: -0.4,
  },
  appSubtitle: {
    marginTop: 8,
    fontSize: 15,
    color: authColors.textMuted,
  },
  authCard: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
    backgroundColor: authColors.cardBg,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  authTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: authColors.textPrimary,
    marginBottom: 20,
  },
  authForm: {
    gap: 16,
  },
  authError: {
    color: authColors.textDanger,
    fontSize: 14,
    marginTop: -2,
  },
  formField: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: authColors.textMuted,
  },
  input: {
    width: '100%',
    minHeight: 46,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: authColors.inputBg,
    borderWidth: 1,
    borderColor: authColors.inputBorder,
    borderRadius: 4,
    color: authColors.textPrimary,
  },
  btnPrimary: {
    width: '100%',
    minHeight: 48,
    borderRadius: 4,
    backgroundColor: authColors.textBrand,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 12,
  },
  btnPrimaryDisabled: {
    opacity: 0.7,
  },
  btnPrimaryText: {
    color: authColors.pageBg,
    fontSize: 16,
    fontWeight: '600',
  },
  authSwitch: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
  },
  authSwitchText: {
    fontSize: 14,
    color: authColors.textMuted,
  },
  authLink: {
    fontSize: 14,
    color: authColors.textBrand,
    textDecorationLine: 'underline',
  },
});
