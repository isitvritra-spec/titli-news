import { Redirect } from "expo-router";

export default function Shh() {
  return <Redirect href="/(tabs)/topics?checkin=1" />;
}
