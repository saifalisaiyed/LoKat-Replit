import { StyleSheet } from "react-native";
import { GRAY_105, GRAY_120, GRAY_125, GRAY_150, GRAY_600, GRAY_850, PURPLE, WHITE } from "@/constants/colors";

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: GRAY_105 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: WHITE, borderBottomWidth: 1, borderBottomColor: GRAY_125,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: GRAY_105, alignItems: "center", justifyContent: "center",
  },
  title: { fontSize: 17, fontFamily: "Archivo_600SemiBold", color: GRAY_850 },
  content: { padding: 20 },
  introText: {
    fontSize: 14, color: GRAY_600,
    fontFamily: "Archivo_400Regular", lineHeight: 20, marginBottom: 24,
  },
  section: { marginBottom: 20 },
  sectionLabel: {
    fontSize: 12, color: GRAY_600,
    fontFamily: "Archivo_600SemiBold", textTransform: "uppercase",
    letterSpacing: 0.6, marginBottom: 10, marginLeft: 2,
  },
  typeRow: { flexDirection: "row", gap: 12 },
  typeCard: {
    flex: 1, backgroundColor: WHITE, borderRadius: 14,
    padding: 14, alignItems: "center", gap: 10,
  },
  typeIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  typeLabel: {
    fontSize: 13, fontFamily: "Archivo_500Medium",
    color: GRAY_600, textAlign: "center",
  },
  messageInput: {
    backgroundColor: WHITE, borderRadius: 14, borderWidth: 1.5,
    borderColor: GRAY_150, padding: 16,
    fontSize: 14, color: GRAY_850,
    fontFamily: "Archivo_400Regular", minHeight: 150,
    lineHeight: 22,
  },
  charCount: {
    fontSize: 11, color: GRAY_600,
    fontFamily: "Archivo_400Regular", marginTop: 6, marginLeft: 2,
  },
  privacyNote: {
    flexDirection: "row", gap: 8, alignItems: "flex-start",
    backgroundColor: GRAY_120, borderRadius: 10, padding: 12, marginBottom: 20,
  },
  privacyText: {
    flex: 1, fontSize: 12, color: GRAY_600,
    fontFamily: "Archivo_400Regular", lineHeight: 17,
  },
  sendBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: PURPLE,
    borderRadius: 14, paddingVertical: 16,
    shadowColor: PURPLE, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  sendBtnDisabled: { opacity: 0.45 },
  sendBtnText: { color: WHITE, fontSize: 16, fontFamily: "Archivo_600SemiBold" },
  successContainer: {
    flex: 1, alignItems: "center", justifyContent: "center",
    padding: 32, gap: 12,
  },
  successIcon: { marginBottom: 8 },
  successTitle: {
    fontSize: 24, fontFamily: "Archivo_700Bold", color: GRAY_850,
  },
  successText: {
    fontSize: 14, color: GRAY_600,
    fontFamily: "Archivo_400Regular", textAlign: "center", lineHeight: 22,
    maxWidth: 300,
  },
  doneBtn: {
    marginTop: 16, paddingVertical: 14, paddingHorizontal: 32,
    borderRadius: 14, backgroundColor: PURPLE,
  },
  doneBtnText: { color: WHITE, fontSize: 15, fontFamily: "Archivo_600SemiBold" },
});
