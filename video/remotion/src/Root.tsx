import {Composition, Still} from 'remotion';
import {Thumb} from './Thumb';
import {Thumb32} from './Thumb32';
import {Video} from './Video';
import {FPS} from './theme';
import {TOTAL_FRAMES} from './timing';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Still id="Thumb" component={Thumb} width={1280} height={720} />
      <Still id="Thumb32" component={Thumb32} width={1200} height={800} />
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
