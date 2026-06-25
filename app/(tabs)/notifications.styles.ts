import { StyleSheet } from "react-native";
import { BLACK_A03, GRAY_105, GRAY_170, GRAY_450, GRAY_600, GRAY_850, PURPLE, SKY_A03, SKY_A10, WHITE } from "@/constants/colors";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GRAY_105,
  },
  header: {
    backgroundColor: WHITE,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_170,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: GRAY_105,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: GRAY_850,
    fontFamily: "Archivo_600SemiBold",
  },
  markAllRead: {
    fontSize: 13,
    color: PURPLE,
    fontFamily: "Archivo_500Medium",
    paddingBottom: 3,
  },
  notifCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: BLACK_A03,
  },
  notifCardUnread: {
    backgroundColor: SKY_A03,
    borderColor: SKY_A10,
  },
  notifIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  notifContent: {
    flex: 1,
    gap: 2,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: GRAY_850,
    fontFamily: "Archivo_500Medium",
  },
  notifTitleUnread: {
    fontWeight: "600",
    fontFamily: "Archivo_600SemiBold",
  },
  notifBody: {
    fontSize: 13,
    color: GRAY_600,
    lineHeight: 18,
    fontFamily: "Archivo_400Regular",
  },
  notifTime: {
    fontSize: 11,
    color: GRAY_450,
    marginTop: 3,
    fontFamily: "Archivo_400Regular",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PURPLE,
    marginTop: 6,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: GRAY_850,
    fontFamily: "Archivo_500Medium",
  },
  emptySubtitle: {
    fontSize: 14,
    color: GRAY_600,
    textAlign: "center",
    paddingHorizontal: 40,
    fontFamily: "Archivo_400Regular",
  },
});
