import { StyleSheet } from "react-native";
import { PURPLE, RED, WHITE } from "@/constants/colors";

export default StyleSheet.create({
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: {
    backgroundColor: PURPLE,
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: RED,
    borderWidth: 1.5,
    borderColor: WHITE,
  },
});
