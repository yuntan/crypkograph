import * as d3 from 'd3';
import {
  dagStratify,
  sugiyama,
  layeringSimplex,
  layeringLongestPath,
  layeringCoffmanGraham,
  decrossTwoLayer,
  twolayerGreedy,
  twolayerAgg,
  DagNode,
} from 'd3-dag';

import './types.mjs'

const imageSize = 96;

/** @type {Crypko[]} */
const crypkos = await chrome.runtime.sendMessage('getCrypkos');
/** @type {{ [crypkoHash: string]: string }} */
const crypkoThumbnailURLs =
  await chrome.runtime.sendMessage('getCrypkoThumbnailURLs')

render(crypkos);

/**
 * @param {Crypko[]} crypkos
 */
function render(crypkos) {
  const createDAG = dagStratify()
    .id((/** @type {Crypko} */ { hash }) => hash)
    .parentIds((/** @type {Crypko} */ { parents }) => parents);
  const dag = createDAG(crypkos);

  // NOTE: https://observablehq.com/@erikbrinkman/d3-dag-sugiyama

  // shortest edges
  const layering = layeringSimplex();
  // minimum height
  // const layering = layeringLongestPath();
  // constrained width
  // const layering = layeringCoffmanGraham();

  // two layer greedy (fast)
  const decrossing =
    decrossTwoLayer().order(twolayerGreedy().base(twolayerAgg()));

  const layout = sugiyama()
    .layering(layering)
    .decross(decrossing)
    .nodeSize((/** @type {DagNode<Crypko, undefined>} */ node) => {
      const size = node ? imageSize : 12
      return [1.2 * size, 1.5 * size];
    });
  const { width, height } = layout(dag);

  const svg = document.querySelector('svg');
  svg.style.width = `${Math.ceil(width + imageSize)}px`;
  svg.style.height = `${Math.ceil(height + imageSize)}px`;

  const selection = d3.select('svg');

  const line = d3.line()
    .curve(d3.curveCatmullRom)
    .x((/** @type {any} */ d) => d.x)
    .y((/** @type {any} */ d) => d.y);

  selection
    .append('g')
    .selectAll('path')
    .data(dag.links())
    .enter()
    .append('path')
    .attr('d', (/** @type {any} */ { points }) => line(points))
    .attr('fill', 'none')
    .attr('stroke-width', 3)
    .attr('stroke', 'black')
    .attr('transform', `translate(${imageSize / 2}, ${imageSize / 2})`);

  const nodes = selection
    .append('g')
    .selectAll('g')
    .data(dag.descendants())
    .enter()
    .append('g')
    .attr(
      'transform',
      (/** @type {any} */ { x, y }) => `translate(${x}, ${y})`
    );

  // add border rect
  nodes
    .append('rect')
    .attr('class', 'svg-image-border')
    .attr('width', imageSize + 2)
    .attr('height', imageSize + 2);

  // add image
  nodes
    .append('image')
    .attr('xlink:href', (d) => crypkoThumbnailURLs[d.data.hash])
    .attr('width', imageSize).attr('height', imageSize)

  // add label background
  nodes
    .append('rect')
    .attr('class', 'svg-text-background')
    .attr('width', 48)
    .attr('height', 12)
    .attr('y', imageSize - 12);

  // add name label
  nodes
    .append('text')
    .text((d) => d.data.name)
    .attr('alignment-baseline', 'top')
    .attr('y', imageSize);
}
