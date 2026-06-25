import { StyleSheet } from "react-native";
import { GRAY_105, GRAY_125, GRAY_600, GRAY_850, WHITE } from "@/constants/colors";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GRAY_105,
  },
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
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: GRAY_105,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 17,
    fontFamily: "Archivo_600SemiBold",
    color: GRAY_850,
  },
  content: {
    flex: 1,
    paddingTop: 8,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionLabel: {
    fontSize: 12,
    color: GRAY_600,
    fontFamily: "Archivo_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 10,
    marginLeft: 4,
  },
  menuGroup: {
    backgroundColor: WHITE,
    borderRadius: 12,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  menuTextBlock: {
    flex: 1,
    gap: 1,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Archivo_400Regular",
    color: GRAY_850,
  },
  menuSub: {
    fontSize: 12,
    color: GRAY_600,
    fontFamily: "Archivo_400Regular",
  },
  menuDivider: {
    height: 1,
    backgroundColor: GRAY_125,
    marginLeft: 60,
  },
  footerNote: {
    marginTop: 24,
    marginHorizontal: 24,
    fontSize: 12,
    color: GRAY_600,
    fontFamily: "Archivo_400Regular",
    textAlign: "center",
    lineHeight: 18,
  },
});
