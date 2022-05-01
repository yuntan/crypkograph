import * as d3 from 'd3';
import { dagStratify, sugiyama, decrossOpt, DagNode, DagLink } from 'd3-dag';

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

  const layout = sugiyama()
    // .decross(decrossOpt()) // FIXME: CPU freeze
    .nodeSize(
      (/** @type {DagNode<Crypko, undefined>} */ _) =>
        [imageSize * 2, imageSize * 2]
    );
  const { width, height } = layout(dag);

  const svg = document.querySelector('svg');
  svg.style.width = `${width}px`;
  svg.style.height = `${height}px`;

  const selection = d3.select('svg');
  selection.attr('viewBox', [0, 0, width, height].join(' '));

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
    .attr('y', 128)
    .attr('transform', `translate(${imageSize / 2}, ${imageSize / 2})`)

  const nodes = selection
    .append('g')
    .selectAll('g')
    .data(dag.descendants())
    .enter()
    .append('g')
    .attr('transform', (/** @type {any} */ { x, y }) => `translate(${x}, ${y})`);

  nodes
    .append('rect')
    .attr('class', 'svg-image-border')
    .attr('width', imageSize + 2)
    .attr('height', imageSize + 2)

  nodes
    .append('image')
    .attr('xlink:href', (d) => crypkoThumbnailURLs[d.data.hash])
    .attr('width', imageSize).attr('height', imageSize)

  nodes
    .append('rect')
    .attr('class', 'svg-text-background')
    .attr('width', 48)
    .attr('height', 12)
    .attr('y', imageSize - 12);

  nodes
    .append('text')
    .text((d) => d.data.name)
    .attr('alignment-baseline', 'top')
    .attr('y', imageSize);
}
