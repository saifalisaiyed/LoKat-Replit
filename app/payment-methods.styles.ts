import { StyleSheet } from "react-native";
import { BLACK, BLACK_A45, EMERALD_A10, GRAY_105, GRAY_125, GRAY_600, GRAY_850, PURPLE, PURPLE_A08, WHITE } from "@/constants/colors";

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: GRAY_105 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_125,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: GRAY_105,
    alignItems: "center", justifyContent: "center",
  },
  title: { fontSize: 17, fontFamily: "Archivo_600SemiBold", color: GRAY_850 },
  content: { flex: 1 },
  balanceCard: {
    margin: 20,
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 20,
    gap: 16,
    shadowColor: BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  balanceTop: { flexDirection: "row", alignItems: "center", gap: 14 },
  walletIconWrap: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: PURPLE_A08,
    alignItems: "center", justifyContent: "center",
  },
  balanceLabel: { fontSize: 13, color: GRAY_600, fontFamily: "Archivo_400Regular" },
  balanceAmount: { fontSize: 28, color: PURPLE, fontFamily: "Archivo_700Bold" },
  withdrawBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: PURPLE,
    borderRadius: 12, paddingVertical: 14,
  },
  withdrawBtnDisabled: { opacity: 0.45 },
  withdrawBtnText: { color: WHITE, fontSize: 15, fontFamily: "Archivo_600SemiBold" },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionLabel: {
    fontSize: 12, color: GRAY_600,
    fontFamily: "Archivo_600SemiBold",
    textTransform: "uppercase", letterSpacing: 0.6,
    marginBottom: 10, marginLeft: 4,
  },
  infoCard: { backgroundColor: WHITE, borderRadius: 12, overflow: "hidden" },
  infoRow: {
    flexDirection: "row", alignItems: "flex-start",
    gap: 12, paddingVertical: 12, paddingHorizontal: 14,
  },
  infoRowBorder: { borderTopWidth: 1, borderTopColor: GRAY_125 },
  infoText: {
    flex: 1, fontSize: 13, color: GRAY_850,
    fontFamily: "Archivo_400Regular", lineHeight: 18,
  },
  historyLink: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: WHITE, borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 14, gap: 12,
  },
  iconWrap: {
    width: 34, height: 34, borderRadius: 9,
    alignItems: "center", justifyContent: "center",
  },
  historyText: { flex: 1, fontSize: 15, fontFamily: "Archivo_400Regular", color: GRAY_850 },
  modalOverlay: {
    flex: 1, backgroundColor: BLACK_A45,
    alignItems: "center", justifyContent: "center", padding: 24,
  },
  modalCard: {
    backgroundColor: WHITE, borderRadius: 20,
    padding: 24, width: "100%", maxWidth: 360, alignItems: "center", gap: 8,
  },
  successIcon: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: EMERALD_A10,
    alignItems: "center", justifyContent: "center", marginBottom: 8,
  },
  modalTitle: { fontSize: 18, fontFamily: "Archivo_700Bold", color: GRAY_850, marginBottom: 4 },
  modalBody: { fontSize: 14, color: GRAY_600, fontFamily: "Archivo_400Regular", textAlign: "center" },
  modalAmount: { fontSize: 32, fontFamily: "Archivo_700Bold", color: PURPLE, marginVertical: 4 },
  modalNote: {
    fontSize: 12, color: GRAY_600,
    fontFamily: "Archivo_400Regular", textAlign: "center", lineHeight: 18,
  },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 8, width: "100%" },
  modalCancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    backgroundColor: GRAY_105, alignItems: "center",
  },
  modalCancelText: { fontSize: 15, fontFamily: "Archivo_500Medium", color: GRAY_600 },
  modalConfirmBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    backgroundColor: PURPLE, alignItems: "center",
  },
  modalConfirmText: { fontSize: 15, fontFamily: "Archivo_600SemiBold", color: WHITE },
  modalDoneBtn: {
    marginTop: 8, paddingVertical: 14, paddingHorizontal: 32,
    borderRadius: 12, backgroundColor: PURPLE, alignItems: "center",
  },
  modalDoneText: { fontSize: 15, fontFamily: "Archivo_600SemiBold", color: WHITE },
});
