import { StyleSheet } from "react-native";
import { GRAY_105, GRAY_125, GRAY_600, GRAY_850, PURPLE, PURPLE_A06, WHITE } from "@/constants/colors";

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
  updated: {
    fontSize: 12, color: GRAY_600,
    fontFamily: "Archivo_400Regular", marginBottom: 20,
  },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 14, fontFamily: "Archivo_600SemiBold",
    color: GRAY_850, marginBottom: 6,
  },
  sectionBody: {
    fontSize: 13, color: GRAY_600,
    fontFamily: "Archivo_400Regular", lineHeight: 20,
  },
  footer: {
    marginTop: 8, padding: 16,
    backgroundColor: PURPLE_A06,
    borderRadius: 12,
  },
  footerText: {
    fontSize: 13, color: PURPLE,
    fontFamily: "Archivo_500Medium", lineHeight: 20, textAlign: "center",
  },
});
