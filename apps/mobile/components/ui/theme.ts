import { Platform, StyleSheet } from "react-native";
import { colors, fontFamily } from "@repo/tokens";

export const editorial = {
  paper: "#FAF8F4",
  white: "#FFFFFF",
  ink: colors.ink,
  muted: "#706F68",
  line: "#E6E2DB",
  lime: "#DCF47B",
  lilac: "#DED4F4",
  peach: "#F7BC96",
  blue: "#C4DDF1",
  moss: "#7C8061",
  serif: Platform.select({
    ios: "Georgia",
    android: "serif",
    default: "Georgia",
  }),
};
export const type = StyleSheet.create({
  label: {
    fontFamily: fontFamily.label,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: editorial.muted,
  },
  title: {
    fontFamily: editorial.serif,
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -1,
    color: editorial.ink,
  },
  body: {
    fontFamily: fontFamily.body,
    fontSize: 17,
    lineHeight: 24,
    color: editorial.muted,
  },
  button: { fontFamily: fontFamily.label, fontSize: 16, color: editorial.ink },
});
