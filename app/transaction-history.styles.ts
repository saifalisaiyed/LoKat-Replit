import { StyleSheet } from "react-native";
import { GRAY_105, GRAY_125, GRAY_600, GRAY_850, PURPLE, WHITE } from "@/constants/colors";

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
  summaryRow: {
    flexDirection: "row",
    backgroundColor: WHITE,
    marginTop: 12,
    marginHorizontal: 20,
    borderRadius: 12,
    paddingVertical: 16,
    overflow: "hidden",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: GRAY_125,
  },
  summaryAmount: {
    fontSize: 20,
    fontFamily: "Archivo_700Bold",
  },
  summaryLabel: {
    fontSize: 12,
    color: GRAY_600,
    fontFamily: "Archivo_400Regular",
  },
  list: {
    paddingTop: 12,
    paddingHorizontal: 20,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: WHITE,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  itemIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  itemInfo: {
    flex: 1,
    gap: 2,
  },
  itemLocation: {
    fontSize: 14,
    fontFamily: "Archivo_500Medium",
    color: GRAY_850,
  },
  itemMeta: {
    fontSize: 12,
    color: GRAY_600,
    fontFamily: "Archivo_400Regular",
  },
  itemBadge: {
    fontSize: 11,
    color: PURPLE,
    fontFamily: "Archivo_500Medium",
    marginTop: 2,
  },
  itemRight: {
    alignItems: "flex-end",
    gap: 2,
  },
  itemAmount: {
    fontSize: 15,
    fontFamily: "Archivo_700Bold",
  },
  itemType: {
    fontSize: 11,
    color: GRAY_600,
    fontFamily: "Archivo_400Regular",
  },
  separator: {
    height: 8,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingBottom: 80,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: "Archivo_600SemiBold",
    color: GRAY_850,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    color: GRAY_600,
    fontFamily: "Archivo_400Regular",
  },
});
