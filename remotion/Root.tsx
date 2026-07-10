import { Composition } from "remotion";
import { KiddzOnlineLogoIntro } from "./KiddzOnlineLogoIntro";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="KiddzOnlineLogoIntro"
      component={KiddzOnlineLogoIntro}
      durationInFrames={150}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
