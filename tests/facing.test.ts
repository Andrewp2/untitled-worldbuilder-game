import { describe, expect, it } from 'vitest';
import { facingDirection, facingPicture } from '../src/view/facing';
import { toWorld } from '../src/core/projection';

describe('isometric movement facing', () => {
  const axes = [
    { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 0, y: -1 },
  ];
  it('follows the projected heading for every grid axis', () => {
    for (const motion of axes) {
      const screen = toWorld(motion);
      const heading = (screen.y > 0 ? 's' : 'n') + (screen.x > 0 ? 'e' : 'w');
      expect(facingDirection(motion)).toBe(heading);
    }
  });
  it('selects the picture that actually faces the destination, including reversed rear exports', () => {
    // Headings verified from the shipping pictures (front eyes / rear axle).
    const pictureHeadings = { se: 'se', sw: 'sw', ne: 'nw', nw: 'ne' };
    for (const motion of axes) {
      expect(pictureHeadings[facingPicture(motion)]).toBe(facingDirection(motion));
    }
  });
});
