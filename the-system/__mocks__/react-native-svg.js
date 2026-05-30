const React = require('react');

const Svg = ({ children, width, height }) =>
  React.createElement('svg', { width, height }, children);
const Rect = ({ x, y, width, height, fill, key }) =>
  React.createElement('rect', { x, y, width, height, fill });
const Circle = ({ cx, cy, r, fill }) =>
  React.createElement('circle', { cx, cy, r, fill });
const Text_ = ({ children }) => React.createElement('text', null, children);
const G = ({ children }) => React.createElement('g', null, children);
const Path = ({ d, fill }) => React.createElement('path', { d, fill });
const Defs = ({ children }) => React.createElement('defs', null, children);
const RadialGradient = ({ children }) => React.createElement('radialGradient', null, children);
const LinearGradient = ({ children }) => React.createElement('linearGradient', null, children);
const Stop = ({ offset, stopColor }) => React.createElement('stop', { offset, stopColor });
const Line = (props) => React.createElement('line', null);
const Polygon = (props) => React.createElement('polygon', null);

module.exports = {
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
};
