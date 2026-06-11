import IconColoring from './IconColoring';
import {
  EASY_COLORING,
  REACT_ICONS,
  NUMBERS_COLORING,
  ALPHABET_COLORING,
} from '../data/coloringIcons';
import { CARTOON_COLORING } from '../data/cartoonColoring';

export const EasyColoring = () => <IconColoring icons={EASY_COLORING} />;
export const ReactIconsColoring = () => <IconColoring icons={REACT_ICONS} />;
export const NumbersColoring = () => <IconColoring icons={NUMBERS_COLORING} />;
export const AlphabetColoring = () => <IconColoring icons={ALPHABET_COLORING} />;
export const CartoonColoring = () => <IconColoring icons={CARTOON_COLORING} />;
