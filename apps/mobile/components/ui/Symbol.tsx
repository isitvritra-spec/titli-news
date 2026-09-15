import Svg, { Circle, Path, Rect } from "react-native-svg";
import { editorial } from "./theme";
export type SymbolName =
  | "search"
  | "arrow"
  | "close"
  | "menu"
  | "gift"
  | "star"
  | "globe"
  | "leaf"
  | "lock";
export function Symbol({
  name,
  size = 22,
  color = editorial.ink,
}: {
  name: SymbolName;
  size?: number;
  color?: string;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.65}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {name === "search" && (
        <>
          <Circle cx={10.5} cy={10.5} r={6.5} />
          <Path d="m16 16 4.5 4.5" />
        </>
      )}
      {name === "arrow" && <Path d="M4 12h16m-7-7 7 7-7 7" />}
      {name === "close" && <Path d="m6 6 12 12M6 18 18 6" />}
      {name === "menu" && <Path d="M5 8h14M5 16h14" />}
      {name === "gift" && (
        <>
          <Rect x={3} y={8} width={18} height={4} rx={1} />
          <Path d="M5 12v9h14v-9M12 8v13M12 8S3 8 5 3s7 5 7 5Zm0 0s9 0 7-5-7 5-7 5Z" />
        </>
      )}
      {name === "star" && (
        <Path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z" />
      )}
      {name === "globe" && (
        <>
          <Circle cx={12} cy={12} r={9} />
          <Path d="M3 12h18M12 3c-6 5-6 13 0 18 6-5 6-13 0-18Z" />
        </>
      )}
      {name === "leaf" && (
        <Path d="M5 19C0 7 11 4 21 3c-1 10-4 21-16 16Zm-2 3L16 9" />
      )}
      {name === "lock" && (
        <>
          <Rect x={5} y={10} width={14} height={11} rx={3} />
          <Path d="M8 10V6a4 4 0 0 1 8 0v4M12 15v2" />
        </>
      )}
    </Svg>
  );
}
