import { StyleSheet } from "react-native";
import { BLACK, BLACK_A55, BLACK_A60, DARK_MAP, GRAY_110, GRAY_170, GRAY_450, GRAY_600, GRAY_750, GRAY_90, GRAY_900, PURPLE, WHITE } from "@/constants/colors";

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK_MAP },
  overlay: { justifyContent: "center", alignItems: "center", zIndex: 10 },
  hintText: {
    marginTop: 14, fontSize: 12, color: WHITE,
    fontFamily: "Archivo_500Medium",
    backgroundColor: BLACK_A55,
    paddingHorizontal: 14, paddingVertical: 5,
    borderRadius: 20, overflow: "hidden",
  },
  buttonRow: {
    position: "absolute", left: 20, right: 20,
    flexDirection: "row", gap: 12, zIndex: 20,
  },
  cancelPill: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 6, height: 50,
    borderRadius: 25, backgroundColor: BLACK_A60,
  },
  cancelPillText: { color: WHITE, fontSize: 15, fontFamily: "Archivo_500Medium" },
  confirmPill: {
    flex: 2, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 6, height: 50,
    borderRadius: 25, backgroundColor: PURPLE,
  },
  confirmPillText: { color: WHITE, fontSize: 15, fontFamily: "Archivo_600SemiBold" },

  directionSheet: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    backgroundColor: WHITE,
    borderTopLeftRadius: 26, borderTopRightRadius: 26,
    paddingHorizontal: 20, paddingTop: 10,
    zIndex: 30,
    shadowColor: BLACK, shadowOpacity: 0.18,
    shadowRadius: 24, elevation: 20,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: GRAY_170, alignSelf: "center", marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: "row", alignItems: "center", marginBottom: 12,
  },
  sheetTitleWrap: { flex: 1, alignItems: "center" },
  sheetTitle: { fontSize: 16, fontFamily: "Archivo_600SemiBold", color: GRAY_900 },
  sheetSub: { fontSize: 12, color: GRAY_450, fontFamily: "Archivo_400Regular", marginTop: 2 },
  skipText: { fontSize: 14, color: GRAY_450, fontFamily: "Archivo_500Medium" },

  grid: { gap: 6, marginBottom: 10 },
  gridRow: { flexDirection: "row", gap: 6 },
  dirCell: {
    flex: 1, height: 52, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    backgroundColor: GRAY_90,
    borderWidth: 1.5, borderColor: GRAY_170,
    gap: 2,
  },
  dirCellActive: {
    backgroundColor: PURPLE, borderColor: PURPLE,
    shadowColor: PURPLE, shadowOpacity: 0.3,
    shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  centerCell: {
    flex: 1, height: 52, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    backgroundColor: GRAY_110, borderWidth: 1.5, borderColor: GRAY_170,
  },
  centerEmoji: { fontSize: 22 },
  dirArrow: { fontSize: 17, color: GRAY_450, lineHeight: 20 },
  dirArrowActive: { color: WHITE },
  dirLabel: { fontSize: 11, fontFamily: "Archivo_600SemiBold", color: GRAY_750 },
  dirLabelActive: { color: WHITE },

  resultRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 6, marginBottom: 10,
  },
  resultText: { fontSize: 13, color: GRAY_600, fontFamily: "Archivo_400Regular" },
  resultDir: { fontFamily: "Archivo_600SemiBold", color: GRAY_900 },

  confirmDirBtn: {
    backgroundColor: PURPLE, borderRadius: 14,
    paddingVertical: 15, alignItems: "center",
  },
  confirmDirText: { color: WHITE, fontSize: 15, fontFamily: "Archivo_600SemiBold" },
});
