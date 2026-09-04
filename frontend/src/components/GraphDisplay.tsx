// src/components/client/GraphDisplay.tsx
'use client';

import React, { useEffect, useRef, memo } from 'react';
import cytoscape, { Core, ElementDefinition, LayoutOptions } from 'cytoscape';
// Optional: Layout extensions
// import fcose from 'cytoscape-fcose';
// cytoscape.use(fcose);

import { GraphData, GraphNode, GraphEdge } from '@/lib/types';

interface HighlightIds {
  nodes: string[];
  edges: string[];
}

interface GraphDisplayProps {
  graphData: GraphData;
  onEdgeSelect?: (edge: GraphEdge) => void;
  highlightIds?: HighlightIds;
}

const HIGHLIGHT_DURATION_MS = 2500;

const GraphDisplay: React.FC<GraphDisplayProps> = ({ graphData, onEdgeSelect, highlightIds }) => {
  const onEdgeSelectRef = useRef(onEdgeSelect);
  onEdgeSelectRef.current = onEdgeSelect;
  const cyContainerRef = useRef<HTMLDivElement>(null);
  // Store core instance in ref to persist across renders
  const cyRef = useRef<Core | null>(null);
  // Store layout reference if needed for dynamic updates
  const layoutRef = useRef<cytoscape.Layouts | null>(null);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!cyContainerRef.current) return;

    // Map your data structure to Cytoscape's ElementDefinition[]
    const elements: ElementDefinition[] = [
      ...(graphData.nodes || []).map((node: GraphNode) => ({
          data: { id: node.id, label: node.label || node.id /* ...other node props */ },
          group: 'nodes' as const, // Explicitly type group
      })),
      ...(graphData.edges || []).map((edge: GraphEdge) => ({
          data: {
            id: edge.id || `${edge.source}_${edge.target}_${edge.label || ''}`, // Ensure unique edge ID for Cytoscape
            source: edge.source,
            target: edge.target,
            label: edge.label,
            evidence: edge.evidence,
            confidence: edge.confidence,
            source_label: edge.source_label,
          },
          group: 'edges' as const, // Explicitly type group
      }))
    ];

    const layoutOptions: LayoutOptions = {
        name: 'cose', // Or 'fcose', 'dagre', 'breadthfirst', etc.
        padding: 60,
        animate: true,
        animationDuration: 500,
        fit: true,
        // --- COSE specific options (adjust as needed) ---
        idealEdgeLength: () => 100, // Wrap in a function
        nodeOverlap: 20,
        refresh: 20,
        randomize: false,
        componentSpacing: 100,
        nodeRepulsion: () => 400000, // Wrap in a function
        edgeElasticity: () => 100, // Wrap in a function
        nestingFactor: 5,
        gravity: 80,
        numIter: 1000,
        initialTemp: 200,
        coolingFactor: 0.95,
        minTemp: 1.0
        // --- End COSE options ---
    };

    // Initialize Cytoscape only once or if container changes
    if (!cyRef.current && cyContainerRef.current) {
        console.log("Initializing Cytoscape...");
        cyRef.current = cytoscape({
        container: cyContainerRef.current,
        elements: elements,
        style: [ // Define node and edge styles using Tailwind concepts where possible
            {
            selector: 'node',
            style: {
                'background-color': '#4B5563', // gray-600
                'label': 'data(label)',
                'width': 'label', 'height': 'label',
                'padding': '10px',
                'shape': 'round-rectangle',
                'text-valign': 'center',
                'text-halign': 'center',
                'color': '#FFFFFF', // white text
                'font-size': '12px', // text-xs equivalent
                'border-width': 1,
                'border-color': '#374151' // gray-700
            }
            },
             { // Style for selected nodes
                 selector: 'node:selected',
                 style: {
                    'background-color': '#3B82F6', // blue-500
                    'border-width': 2,
                    'border-color': '#1D4ED8' // blue-700
                 }
             },
            {
            selector: 'edge',
            style: {
                'width': 1.5,
                'line-color': '#D1D5DB', // gray-300
                'target-arrow-color': '#9CA3AF', // gray-400
                'target-arrow-shape': 'triangle',
                'curve-style': 'bezier', // 'unbundled-bezier' for multiple edges
                'label': 'data(label)',
                'font-size': '10px', // smaller text
                'color': '#6B7280', // gray-500
                'text-rotation': 'autorotate',
                'text-margin-y': -10,
                'arrow-scale': 1
            }
            },
            { // Style for selected edges
                 selector: 'edge:selected',
                 style: {
                    'line-color': '#3B82F6', // blue-500
                    'target-arrow-color': '#3B82F6',
                    'width': 2.5
                 }
             },
            { // Transient highlight for newly-added nodes (fades out after HIGHLIGHT_DURATION_MS)
                selector: 'node.highlight-new',
                style: {
                    'background-color': '#F59E0B', // amber-500
                    'border-color': '#B45309', // amber-700
                    'border-width': 3,
                    'transition-property': 'background-color, border-color, border-width',
                    'transition-duration': 600,
                }
            },
            { // Transient highlight for newly-added edges
                selector: 'edge.highlight-new',
                style: {
                    'line-color': '#F59E0B',
                    'target-arrow-color': '#F59E0B',
                    'width': 3,
                    'transition-property': 'line-color, target-arrow-color, width',
                    'transition-duration': 600,
                }
            }
        ],
        // Initial layout is run
        layout: layoutOptions,
        // Interaction options
        zoom: 1,
        minZoom: 0.2,
        maxZoom: 3,
        zoomingEnabled: true,
        userZoomingEnabled: true,
        panningEnabled: true,
        userPanningEnabled: true,
        boxSelectionEnabled: true,
        });

        // --- Add Event Listeners ---
        cyRef.current.on('tap', 'node', (event) => {
            const node = event.target;
            console.log('Tapped node:', node.id(), node.data());
            // You could open a detail panel here
        });
         cyRef.current.on('tap', 'edge', (event) => {
            const data = event.target.data();
            onEdgeSelectRef.current?.({
                id: data.id,
                source: data.source,
                target: data.target,
                label: data.label,
                evidence: data.evidence,
                confidence: data.confidence,
                source_label: data.source_label,
            });
        });
        cyRef.current.on('viewport', () => {
             // console.log('Viewport changed (zoom/pan)');
        });


    } else if (cyRef.current) {
        // Update existing instance: diff elements and update layout
        console.log("Updating Cytoscape elements...");
        cyRef.current.json({ elements }); // Smartly updates elements

        // Re-run layout if needed (or use cy.layout(...).run() directly)
        if (layoutRef.current) {
             layoutRef.current.stop(); // Stop previous layout if running
        }
        layoutRef.current = cyRef.current.layout(layoutOptions);
        layoutRef.current.run();

        // Optional: Fit view after update, with padding
        cyRef.current.animate({
             fit: { eles: cyRef.current.elements(), padding: 60 }
         }, { duration: 500 });
    }

    // Briefly highlight newly-added nodes/edges so incremental growth is
    // visible instead of hidden by the full-graph re-layout above.
    if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
        highlightTimeoutRef.current = null;
    }
    if (cyRef.current && highlightIds && (highlightIds.nodes.length || highlightIds.edges.length)) {
        const cy = cyRef.current;
        const highlighted = cy.collection();
        [...highlightIds.nodes, ...highlightIds.edges].forEach((id) => {
            const el = cy.getElementById(id);
            if (el.length) highlighted.merge(el);
        });
        if (highlighted.length) {
            highlighted.addClass('highlight-new');
            highlightTimeoutRef.current = setTimeout(() => {
                highlighted.removeClass('highlight-new');
            }, HIGHLIGHT_DURATION_MS);
        }
    }

    // Cleanup function (important!)
    return () => {
        if (highlightTimeoutRef.current) {
            clearTimeout(highlightTimeoutRef.current);
            highlightTimeoutRef.current = null;
        }
        // Currently, we don't destroy the instance on data change, only update.
        // Destroy only if the component truly unmounts permanently.
        console.log("GraphDisplay cleanup effect - Instance might persist");
        // cyRef.current?.destroy(); // Uncomment if you need full destruction on unmount
        // cyRef.current = null;
    };

  }, [graphData, highlightIds]); // Re-run when data changes or a new highlight batch arrives

  // Render the container div
  return <div ref={cyContainerRef} className="w-full h-full bg-inherit" />; // Use Tailwind classes
};

// Memoize the component to prevent re-renders if props haven't changed
export default memo(GraphDisplay);