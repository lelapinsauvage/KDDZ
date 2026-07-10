import type { CSSProperties } from "react";
import { loadFont as loadFredoka } from "@remotion/google-fonts/Fredoka";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: logoFontFamily } = loadFredoka("normal", {
  subsets: ["latin"],
  weights: ["600", "700"],
});

const { fontFamily: onlineFontFamily } = loadInter("normal", {
  subsets: ["latin"],
  weights: ["600", "700"],
});

const colors = {
  background: "#FBF3E7",
  ink: "#302C27",
  orange: "#F47A32",
  pink: "#E86F9C",
  yellow: "#F2BF3F",
  teal: "#45BDB2",
  green: "#61AB56",
  purple: "#9B67CC",
  cream: "#FFFDF7",
};

const fontStack =
  `${logoFontFamily}, "Avenir Next", "Nunito Sans", -apple-system, BlinkMacSystemFont, system-ui, sans-serif`;

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

function bySecond(seconds: number, fps: number) {
  return seconds * fps;
}

function timed(
  frame: number,
  fps: number,
  startSeconds: number,
  durationSeconds: number,
  easing = Easing.bezier(0.16, 1, 0.3, 1),
) {
  return interpolate(
    frame,
    [bySecond(startSeconds, fps), bySecond(startSeconds + durationSeconds, fps)],
    [0, 1],
    {
      ...clamp,
      easing,
    },
  );
}

export const KiddzOnlineLogoIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgEnter = timed(frame, fps, 0, 0.45);
  const onlineIn = timed(frame, fps, 1.88, 0.62);
  const colorIn = timed(frame, fps, 2.64, 0.72);
  const eyeIn = timed(frame, fps, 0.78, 0.22, Easing.bezier(0.34, 1.56, 0.64, 1));
  const finalSettle = spring({
    frame: frame - bySecond(3.38, fps),
    fps,
    config: {
      damping: 12,
      mass: 0.75,
      stiffness: 150,
    },
  });

  const logoScale = interpolate(finalSettle, [0, 1], [1, 1.018], clamp);
  const onlineY = interpolate(onlineIn, [0, 1], [22, 0]);
  const onlineOpacity = onlineIn;

  const circleX = 0;
  const circleY = 0;
  const eyeScale = interpolate(
    frame,
    [bySecond(0.9, fps), bySecond(1.18, fps), bySecond(1.78, fps), bySecond(2.08, fps)],
    [0.35, 1.04, 0.98, 1],
    {
      ...clamp,
      easing: Easing.bezier(0.34, 1.56, 0.64, 1),
    },
  );
  const eyeRotate = 0;
  const eyeColor = interpolateColors(colorIn, [0, 1], [colors.ink, colors.orange]);
  const finalSmile = timed(frame, fps, 3.12, 0.42, Easing.bezier(0.34, 1.56, 0.64, 1));

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        opacity: bgEnter,
        fontFamily: fontStack,
        color: colors.ink,
      }}
    >
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            transform: `scale(${logoScale})`,
          }}
        >
          <KiddzWord frame={frame} fps={fps} />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <EyeO
              opacity={eyeIn}
              circleX={circleX}
              circleY={circleY}
              eyeScale={eyeScale}
              eyeRotate={eyeRotate}
              eyeColor={eyeColor}
              smileProgress={finalSmile}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                opacity: onlineOpacity,
                transform: `translateY(${onlineY}px)`,
              }}
            >
              {"nline".split("").map((letter, index) => (
                <OnlineLetter
                  key={`${letter}-${index}`}
                  letter={letter}
                  index={index}
                  colorProgress={colorIn}
                  frame={frame}
                  fps={fps}
                />
              ))}
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const wordBase: CSSProperties = {
  display: "inline-block",
  fontWeight: 700,
  letterSpacing: 0,
  lineHeight: 0.88,
};

function KiddzWord({ frame, fps }: { frame: number; fps: number }) {
  const word = "Kiddz";
  const firstLetterFrame = bySecond(0.14, fps);
  const stepFrames = bySecond(0.16, fps);
  const visibleCount = Math.min(
    word.length,
    Math.max(0, Math.floor((frame - firstLetterFrame) / stepFrames) + 1),
  );
  const activeLetterStart = firstLetterFrame + Math.max(visibleCount - 1, 0) * stepFrames;
  const activeLetterPop =
    visibleCount > 0
      ? interpolate(frame, [activeLetterStart, activeLetterStart + bySecond(0.16, fps)], [0, 1], {
          ...clamp,
          easing: Easing.bezier(0.34, 1.56, 0.64, 1),
        })
      : 0;
  const activeLetterY = interpolate(activeLetterPop, [0, 1], [24, 0]);
  const activeLetterScale = interpolate(activeLetterPop, [0, 1], [0.72, 1]);
  const visibleWord = word.slice(0, visibleCount);
  const settledLetters = visibleWord.slice(0, -1);
  const activeLetter = visibleWord.slice(-1);

  return (
    <span
      style={{
        ...wordBase,
        position: "relative",
        display: "inline-block",
        fontSize: 164,
      }}
    >
      <span style={{ visibility: "hidden" }}>{word}</span>
      <span
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          display: "inline-flex",
          alignItems: "baseline",
        }}
      >
        <span>{settledLetters}</span>
        {activeLetter ? (
          <span
            style={{
              display: "inline-block",
              transform: `translateY(${activeLetterY}px) scale(${activeLetterScale})`,
              transformOrigin: "bottom center",
            }}
          >
            {activeLetter}
          </span>
        ) : null}
      </span>
    </span>
  );
}

function OnlineLetter({
  letter,
  index,
  colorProgress,
  frame,
  fps,
}: {
  letter: string;
  index: number;
  colorProgress: number;
  frame: number;
  fps: number;
}) {
  const letterColors = [colors.pink, colors.yellow, colors.teal, colors.green, colors.purple];
  const start = 0.08 * index;
  const localColor = interpolate(colorProgress, [start, start + 0.42], [0, 1], clamp);
  const color = interpolateColors(localColor, [0, 1], [colors.ink, letterColors[index]]);
  const pop = spring({
    frame: frame - bySecond(2.72 + start, fps),
    fps,
    config: {
      damping: 10,
      mass: 0.55,
      stiffness: 180,
    },
  });
  const scale = interpolate(pop, [0, 1], [0.92, 1], clamp);

  return (
    <span
      style={{
        display: "inline-block",
        fontFamily: onlineFontFamily,
        fontSize: 134,
        fontWeight: 600,
        letterSpacing: 0,
        lineHeight: 0.9,
        color,
        transform: `scale(${scale})`,
        transformOrigin: "bottom center",
      }}
    >
      {letter}
    </span>
  );
}

function EyeO({
  opacity,
  circleX,
  circleY,
  eyeScale,
  eyeRotate,
  eyeColor,
  smileProgress,
}: {
  opacity: number;
  circleX: number;
  circleY: number;
  eyeScale: number;
  eyeRotate: number;
  eyeColor: string;
  smileProgress: number;
}) {
  const mouthScale = interpolate(smileProgress, [0, 1], [0, 1], clamp);

  return (
    <div
      style={{
        position: "relative",
        width: 150,
        height: 150,
        marginRight: 0,
        opacity,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 4,
          borderRadius: 999,
          border: `15px solid ${eyeColor}`,
          backgroundColor: colors.cream,
          transform: `translate(${circleX}px, ${circleY}px) rotate(${eyeRotate}deg) scale(${eyeScale})`,
        }}
      />
      <svg
        width="150"
        height="150"
        viewBox="0 0 150 150"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          opacity: smileProgress,
          transform: `scale(${mouthScale})`,
        }}
        aria-hidden="true"
      >
        <path
          d="M52 98C65 112 85 112 98 98"
          fill="none"
          stroke={eyeColor}
          strokeWidth="8"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
