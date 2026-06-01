import React from 'react';
import renderer from 'react-test-renderer';
import AmbientEmbers from '../src/components/fx/AmbientEmbers';

it('renders non-interactive', () => {
  let tree: any;
  renderer.act(() => { tree = renderer.create(<AmbientEmbers color="#D97757" count={4} />); });
  const json = JSON.stringify(tree.toJSON());
  expect(json).toContain('"pointerEvents":"none"');
});
