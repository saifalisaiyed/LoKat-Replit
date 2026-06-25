import { StyleSheet } from "react-native";
import { WHITE_A70 } from "@/constants/colors";

export default StyleSheet.create({
  container: {
    flex: 1,
  },
  bg: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 40,
  },
  fullLogo: {
    width: 260,
    height: 66,
    marginBottom: 20,
  },
  tagline: {
    fontSize: 15,
    color: WHITE_A70,
    fontFamily: "Archivo_400Regular",
    textAlign: "center",
    letterSpacing: 0.2,
  },
});
