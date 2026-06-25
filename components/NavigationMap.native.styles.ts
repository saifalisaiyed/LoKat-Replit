import { StyleSheet } from "react-native";
import { BLACK, PURPLE, WHITE } from "@/constants/colors";

export default StyleSheet.create({
  destOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: PURPLE,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  destInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: WHITE,
  },
});
