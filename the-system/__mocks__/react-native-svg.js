const React = require('react');

// react-test-renderer (React 19) crashes on DOM-string host elements like 'svg', 'rect'.
// We use custom string names that look like React host elements but are rendered
// by react-test-renderer as opaque nodes in toJSON() output.
// IS_REACT_ACT_ENVIRONMENT must be true (set in jest.config.js globals) and
// renderer.act() must wrap renderer.create() calls for toJSON() to work.

function Svg({ children, width, height }) {
  return React.createElement('svg-mock', { width, height }, children);
}
function Rect({ x, y, width, height, fill }) {
  return React.createElement('rect-mock', { x, y, width, height, fill });
}
function Circle({ cx, cy, r, fill }) {
  return React.createElement('circle-mock', { cx, cy, r, fill });
}
function Text_({ children }) {
  return React.createElement('text-mock', null, children);
}
function G({ children }) {
  return React.createElement('g-mock', null, children);
}
function Path({ d, fill }) {
  return React.createElement('path-mock', { d, fill });
}
function Defs({ children }) {
  return React.createElement('defs-mock', null, children);
}
function RadialGradient({ children }) {
  return React.createElement('radialGradient-mock', null, children);
}
function LinearGradient({ children }) {
  return React.createElement('linearGradient-mock', null, children);
}
function Stop({ offset, stopColor }) {
  return React.createElement('stop-mock', { offset, stopColor });
}
function Line(props) {
  return React.createElement('line-mock', null);
}
function Polygon(props) {
  return React.createElement('polygon-mock', null);
}
function Pattern({ children }) {
  return React.createElement('pattern-mock', null, children);
}

module.exports = {
  __esModule: true,
  default: Svg,
  Svg,
  Rect,
  Circle,
  Text: Text_,
  G,
  Path,
  Defs,
  RadialGradient,
  LinearGradient,
  Stop,
  Line,
  Polygon,
  Pattern,
};
