import React from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useLumina } from '../context/LuminaContext';

export const Cerebro = () => {
  const { graphData } = useLumina();

  return (
    <div className="flex-1 bg-[#030304] relative overflow-hidden">
      <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur px-4 py-2 rounded-lg border border-white/10">
        <h2 className="text-indigo-400 font-bold text-sm tracking-widest uppercase">Cerebro Graph</h2>
        <p className="text-xs text-gray-500">{graphData.nodes.length} Nodes • {graphData.links.length} Links</p>
      </div>
      
      <ForceGraph2D
        graphData={graphData}
        backgroundColor="#030304"
        nodeLabel="id"
        nodeColor={node => node.group === 'url' ? '#60A5FA' : '#818CF8'}
        linkColor={() => '#333'}
        nodeRelSize={6}
        linkWidth={1}
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={0.005}
      />
    </div>
  );
};