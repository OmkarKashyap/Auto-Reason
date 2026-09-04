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
        idealEdgeLength: () => 150, // Wrap in a function - more breathing room between connected nodes
        nodeOverlap: 24,
        refresh: 20,
        randomize: false,
        componentSpacing: 120,
        nodeRepulsion: () => 550000, // Wrap in a function - spreads clusters apart so labels don't collide
        edgeElasticity: () => 100, // Wrap in a function
        nestingFactor: 5,
        gravity: 60,
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
        style: [ // Dark-theme palette tuned for legibility on the app's near-black canvas
            {
            selector: 'node',
            style: {
                'background-color': '#232b1c', // dark olive, tied to the accent green
                'label': 'data(label)',
                'width': 'label', 'height': 'label',
                'padding': '14px',
                'shape': 'round-rectangle',
                'text-valign': 'center',
                'text-halign': 'center',
                'color': '#F3F4F6', // near-white text
                'font-size': '13px',
                'font-weight': 500,
                'border-width': 1.5,
                'border-color': '#4d6633' // muted green border
            }
            },
             { // Style for selected nodes
                 selector: 'node:selected',
                 style: {
                    'background-color': '#99FF00',
                    'color': '#111827',
                    'border-width': 2,
                    'border-color': '#c2ff66'
                 }
             },
            {
            selector: 'edge',
            style: {
                'width': 1.5,
                'line-color': '#6B7280', // gray-500 - visible against the dark canvas
                'target-arrow-color': '#9CA3AF', // gray-400
                'target-arrow-shape': 'triangle',
                'curve-style': 'bezier', // 'unbundled-bezier' for multiple edges
                'label': 'data(label)',
                'font-size': '11px',
                'font-weight': 500,
                'color': '#E5E7EB', // near-white label text
                'text-rotation': 'autorotate',
                'text-margin-y': -10,
                // Backing "halo" behind the label so it stays legible over
                // crossing lines and other nodes, instead of floating text.
                'text-background-color': '#161616',
                'text-background-opacity': 0.9,
                'text-background-shape': 'roundrectangle',
                'text-background-padding': '3px',
                'text-border-width': 1,
                'text-border-color': '#2a2a2a',
                'text-border-opacity': 1,
                'arrow-scale': 1
            }
            },
            { // Style for selected edges
                 selector: 'edge:selected',
                 style: {
                    'line-color': '#99FF00',
                    'target-arrow-color': '#99FF00',
                    'color': '#111827',
                    'text-background-color': '#99FF00',
                    'text-background-opacity': 1,
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

  // Render the container div. The dotted grid gives the canvas a sense of
  // place (like a whiteboard) without competing with node/edge colors.
  return (
    <div
      ref={cyContainerRef}
      className="w-full h-full"
      style={{
        backgroundColor: '#161616',
        backgroundImage: 'radial-gradient(#2a2a2a 1px, transparent 1px)',
        backgroundSize: '22px 22px',
      }}
    />
  );
};

// Memoize the component to prevent re-renders if props haven't changed
export default memo(GraphDisplay);