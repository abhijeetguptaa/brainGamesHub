import { useEffect } from 'react';
import TapLearnGame from './TapLearnGame';
import { TAP_LEARN_DATA, type GameType } from '../data/tapLearnData';
import { setScreen } from '../utils/analytics';

interface TapLearnRouteProps {
  gameType: GameType;
}

export default function TapLearnRoute({ gameType }: TapLearnRouteProps) {
  useEffect(() => {
    setScreen('TapLearn_' + gameType);
  }, [gameType]);

  return <TapLearnGame gameType={gameType} data={TAP_LEARN_DATA[gameType]} />;
}
