import { StyleSheet } from "react-native";
import { BLACK, GRAY_100, GRAY_105, GRAY_125, GRAY_150, GRAY_600, GRAY_850, GREEN_25, GREEN_500, PURPLE, PURPLE_50, RED, RED_50, WHITE } from "@/constants/colors";

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: GRAY_105 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_125,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: GRAY_105, alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 17, color: GRAY_850, fontFamily: "Archivo_600SemiBold" },
  scrollContent: { paddingHorizontal: 20, paddingTop: 24 },
  iconSection: { alignItems: "center", marginBottom: 28, gap: 12 },
  lockCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: PURPLE_50, alignItems: "center", justifyContent: "center",
  },
  description: {
    fontSize: 14, color: GRAY_600, textAlign: "center",
    fontFamily: "Archivo_400Regular", maxWidth: 260,
  },
  formSection: {
    backgroundColor: WHITE, borderRadius: 18, padding: 20, gap: 18,
    shadowColor: BLACK, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  inputGroup: { gap: 6 },
  inputLabel: {
    fontSize: 13, color: GRAY_600, fontFamily: "Archivo_500Medium", marginLeft: 2,
  },
  input: {
    backgroundColor: GRAY_100, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14,
    fontSize: 15, color: GRAY_850, borderWidth: 1, borderColor: GRAY_150,
    fontFamily: "Archivo_400Regular",
  },
  passwordRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: GRAY_100, borderRadius: 12, borderWidth: 1, borderColor: GRAY_150,
    paddingRight: 12,
  },
  passwordInput: {
    flex: 1, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15,
    color: GRAY_850, fontFamily: "Archivo_400Regular",
  },
  divider: { height: 1, backgroundColor: GRAY_125 },
  errorRow: {
    flexDirection: "row", alignItems: "center", gap: 6, marginTop: 16,
    backgroundColor: RED_50, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10,
  },
  errorText: { fontSize: 13, color: RED, flex: 1, fontFamily: "Archivo_400Regular" },
  successRow: {
    flexDirection: "row", alignItems: "center", gap: 6, marginTop: 16,
    backgroundColor: GREEN_25, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10,
  },
  successText: { fontSize: 13, color: GREEN_500, flex: 1, fontFamily: "Archivo_400Regular" },
  saveBtn: {
    backgroundColor: PURPLE, paddingVertical: 16, borderRadius: 12,
    alignItems: "center", justifyContent: "center", marginTop: 24,
    shadowColor: PURPLE, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  saveBtnText: { color: WHITE, fontSize: 16, fontFamily: "Archivo_600SemiBold" },
});
