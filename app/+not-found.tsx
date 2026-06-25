// template
import { Link, Stack } from "expo-router";
import { Text, View } from "react-native";
import { BLUE_MED } from "@/constants/colors";

import styles from "./+not-found.styles";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View style={styles.container}>
        <Text style={styles.title}>This screen doesn&apos;t exist.</Text>

        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}
