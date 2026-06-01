import React from 'react';
import renderer from 'react-test-renderer';
import { Text } from 'react-native';
import CornerBox, { CornerBrackets } from '../src/components/ui/CornerBox';

describe('CornerBox', () => {
  it('renders children', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <CornerBox color="#D97757"><Text>hi</Text></CornerBox>
      );
    });
    const json = JSON.stringify(tree!.toJSON());
    expect(json).toContain('hi');
  });

  it('renders four corner brackets thicker than the edge border', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(<CornerBox color="#D97757" borderWidth={1} cornerThickness={2} />);
    });
    const json = tree!.toJSON();
    const styles: any[] = [];
    const walk = (n: any) => {
      if (!n) return;
      if (Array.isArray(n)) return n.forEach(walk);
      if (n.props && n.props.style) {
        const s = Array.isArray(n.props.style) ? Object.assign({}, ...n.props.style.filter(Boolean)) : n.props.style;
        styles.push(s);
      }
      if (Array.isArray(n.children)) n.children.forEach(walk);
    };
    walk(json);
    const corners = styles.filter((s) => s && (s.borderTopWidth === 2 || s.borderBottomWidth === 2));
    expect(corners.length).toBe(4);
    const edge = styles.find((s) => s && s.borderWidth === 1);
    expect(edge).toBeTruthy();
  });

  it('CornerBrackets renders four brackets, non-interactive', () => {
    let tree: any;
    renderer.act(() => { tree = renderer.create(<CornerBrackets color="#D97757" thickness={2} />); });
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('"pointerEvents":"none"');
  });
});
