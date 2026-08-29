import {Composition, Still} from 'remotion';
import {Thumb} from './Thumb';
import {Thumb32} from './Thumb32';
import {Thumb32b} from './Thumb32b';
import {Video} from './Video';
import {GCover, GClaim, GDisguise, GCeiling, GDesk, GCloud} from './gallery/cards';
import {GArch} from './gallery/Arch';
import {FPS} from './theme';
import {TOTAL_FRAMES} from './timing';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Still id="Thumb" component={Thumb} width={1280} height={720} />
      <Still id="Thumb32" component={Thumb32} width={1200} height={800} />
      <Still id="Thumb32b" component={Thumb32b} width={1200} height={800} />
      <Still id="GCover" component={GCover} width={1200} height={800} />
      <Still id="GClaim" component={GClaim} width={1200} height={800} />
      <Still id="GDisguise" component={GDisguise} width={1200} height={800} />
      <Still id="GCeiling" component={GCeiling} width={1200} height={800} />
      <Still id="GDesk" component={GDesk} width={1200} height={800} />
      <Still id="GCloud" component={GCloud} width={1200} height={800} />
      <Still id="GArch" component={GArch} width={1200} height={800} />
      <Composition
      id="Video"
      component={Video}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={1920}
      height={1080}
    />
    </>
  );
};
