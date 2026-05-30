import React from 'react';
import renderer from 'react-test-renderer';
import AvatarDisplay from '../../../src/components/avatar/AvatarDisplay';
import type { HeroClass } from '../../../src/components/avatar/avatarData';

const CLASSES: HeroClass[] = ['Warrior', 'Mage', 'Rogue'];
const RANKS = ['E', 'D', 'C', 'B', 'A', 'S'];

describe('AvatarDisplay', () => {
  it('renders Warrior at rank E without crashing', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(<AvatarDisplay heroClass="Warrior" rank="E" />);
    });
    const json = tree!.toJSON();
    expect(json).not.toBeNull();
  });

  it.each(CLASSES)('renders %s class without crashing', (cls) => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(<AvatarDisplay heroClass={cls} rank="C" />);
    });
    expect(tree!.toJSON()).not.toBeNull();
  });

  it.each(RANKS)('renders rank %s without crashing', (rank) => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(<AvatarDisplay heroClass="Warrior" rank={rank} />);
    });
    expect(tree!.toJSON()).not.toBeNull();
  });

  it('renders all mood variants', () => {
    const moods: Array<'radiant' | 'steady' | 'worn' | 'broken'> = ['radiant', 'steady', 'worn', 'broken'];
    for (const mood of moods) {
      let tree: renderer.ReactTestRenderer;
      renderer.act(() => {
        tree = renderer.create(<AvatarDisplay heroClass="Rogue" rank="B" mood={mood} />);
      });
      expect(tree!.toJSON()).not.toBeNull();
    }
  });

  it('applies opacity for worn mood', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(<AvatarDisplay heroClass="Warrior" rank="A" mood="worn" />);
    });
    const json = tree!.toJSON() as renderer.ReactTestRendererJSON;
    expect(json).not.toBeNull();
    // View has opacity style
    expect(json.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ opacity: 0.75 })])
    );
  });

  it('applies opacity for broken mood', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(<AvatarDisplay heroClass="Mage" rank="E" mood="broken" />);
    });
    const json = tree!.toJSON() as renderer.ReactTestRendererJSON;
    expect(json).not.toBeNull();
    expect(json.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ opacity: 0.55 })])
    );
  });

  it('accepts custom pixelSize', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(<AvatarDisplay heroClass="Warrior" rank="S" pixelSize={2} />);
    });
    expect(tree!.toJSON()).not.toBeNull();
  });

  it('accepts custom weaponTier', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(<AvatarDisplay heroClass="Mage" rank="C" weaponTier={5} />);
    });
    expect(tree!.toJSON()).not.toBeNull();
  });
});
