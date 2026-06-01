import React from 'react';
import renderer from 'react-test-renderer';
import OnboardingOrbit from '../src/components/fx/OnboardingOrbit';

it('renders without crashing and is non-interactive', () => {
  let tree: any;
  renderer.act(() => { tree = renderer.create(<OnboardingOrbit color="#D97757" />); });
  const json = JSON.stringify(tree.toJSON());
  expect(json).toContain('"pointerEvents":"none"');
});
