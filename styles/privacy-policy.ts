import { StyleSheet } from "react-native";
import { GRAY_105, GRAY_125, GRAY_600, GRAY_850, PURPLE, PURPLE_A06, PURPLE_A07, PURPLE_A15, WHITE } from "@/constants/colors";

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
  heroBanner: {
    backgroundColor: PURPLE_A07, borderRadius: 16,
    padding: 20, marginBottom: 20, alignItems: "center", gap: 8,
  },
  heroTitle: {
    fontSize: 16, fontFamily: "Archivo_700Bold",
    color: PURPLE, textAlign: "center", lineHeight: 22,
  },
  heroBody: {
    fontSize: 13, fontFamily: "Archivo_400Regular",
    color: GRAY_600, textAlign: "center", lineHeight: 19,
  },
  updated: {
    fontSize: 12, color: GRAY_600,
    fontFamily: "Archivo_400Regular", marginBottom: 20,
  },
  section: {
    backgroundColor: WHITE, borderRadius: 14, padding: 16,
    marginBottom: 12, gap: 4,
  },
  sectionTitle: {
    fontSize: 14, fontFamily: "Archivo_700Bold",
    color: GRAY_850, marginBottom: 8,
  },
  subsection: { marginBottom: 10 },
  subsectionHeading: {
    fontSize: 13, fontFamily: "Archivo_600SemiBold",
    color: GRAY_850, marginBottom: 3,
  },
  sectionBody: {
    fontSize: 13, color: GRAY_600,
    fontFamily: "Archivo_400Regular", lineHeight: 20,
  },
  contactCard: {
    flexDirection: "row", gap: 12, alignItems: "flex-start",
    backgroundColor: WHITE, borderRadius: 14, padding: 16,
    marginBottom: 12, borderWidth: 1.5, borderColor: PURPLE_A15,
  },
  contactTitle: {
    fontSize: 13, fontFamily: "Archivo_600SemiBold", color: GRAY_850,
  },
  contactBody: {
    fontSize: 13, fontFamily: "Archivo_400Regular",
    color: GRAY_600, marginTop: 2,
  },
  footer: {
    marginTop: 4, padding: 16,
    backgroundColor: PURPLE_A06, borderRadius: 12,
  },
  footerText: {
    fontSize: 13, color: PURPLE,
    fontFamily: "Archivo_500Medium", lineHeight: 20, textAlign: "center",
  },
});
