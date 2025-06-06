import { useCallback, useEffect, useRef } from "react";

import ReactDiagram, {
  Connection,
  Edge,
  Node,
  updateEdge,
  useEdgesState,
  useNodesState,
} from "react-cosmos-diagram";

import PuzzleNode, { NodeData, HighlightedPort } from "../PuzzleNode";

import { PieceSize } from "../PuzzleGenerator";

import { EdgePosition } from "../PuzzleGenerator/type";
import { isOppositePosition } from "../PuzzleGenerator/utils";
import { findClosestConnections, getSnapPosition } from "../PuzzleNode/utils";

import "react-cosmos-diagram/dist/style.css";

const connectionRadius = 30;

const nodeTypes = {
  puzzle: PuzzleNode,
};

interface Props {
  puzzleNode?: Node<NodeData> | null;

  onUpdateSuccess: () => void;
}
const PuzzleDiagram = ({
  puzzleNode,

  onUpdateSuccess,
}: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const edgeUpdateSuccessful = useRef(true);
  const nodeMap = useRef(new Map<string, string[]>([]));

  const pieceSizeRef = useRef<PieceSize>({
    tabSize: 0,
    totalSize: 0,
    pieceSize: 0,
  });

  const [nodes, setNodes, onNodesChange] = useNodesState<NodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect = useCallback((params: Connection) => {
    const { source, target, sourcePort, targetPort } = params;

    const draggedEdgePosition = sourcePort?.split("-")[0] as EdgePosition;
    const targetEdgePosition = targetPort?.split("-")[0] as EdgePosition;

    if (!isOppositePosition(draggedEdgePosition, targetEdgePosition)) return;

    if (target && source) {
      nodeMap.current.set(source, [target]);
      nodeMap.current.set(target, [source]);
    }

    setNodes((nodes) => {
      const draggedNode = nodes.find((node) => node.id === source);
      const targetNode = nodes.find((node) => node.id === target);

      if (!draggedNode || !targetNode) return nodes;

      let offsetX = 0;
      let offsetY = 0;

      if (targetEdgePosition === "left") {
        offsetX = draggedNode.position.x + pieceSizeRef.current.pieceSize;
        offsetY = draggedNode.position.y;
      }

      if (targetEdgePosition === "right") {
        offsetX = draggedNode.position.x - pieceSizeRef.current.pieceSize;
        offsetY = draggedNode.position.y;
      }

      if (targetEdgePosition === "top") {
        offsetX = draggedNode.position.x;
        offsetY = draggedNode.position.y + pieceSizeRef.current.pieceSize;
      }

      if (targetEdgePosition === "bottom") {
        offsetX = draggedNode.position.x;
        offsetY = draggedNode.position.y - pieceSizeRef.current.pieceSize;
      }

      return nodes.map((node) => {
        if (node.id === target) {
          node.position.x = offsetX;
          node.position.y = offsetY;
        }
        return node;
      });
    });
  }, []);

  const onEdgeUpdateStart = useCallback(() => {
    edgeUpdateSuccessful.current = false;
  }, []);

  const onEdgeUpdate = useCallback(
    (originEdge: Edge, newConnection: Connection) => {
      edgeUpdateSuccessful.current = true;

      setEdges((els) => updateEdge(originEdge, newConnection, els));
    },
    []
  );

  const onEdgeUpdateEnd = useCallback((_c: unknown, edge: Edge) => {
    if (!edgeUpdateSuccessful.current) {
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
    }

    edgeUpdateSuccessful.current = true;
  }, []);

  const onNodeDragEnd = useCallback(
    (_: unknown, node: Node) => {
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: { ...n.data, highlightedPorts: undefined },
        }))
      );

      const connections = findClosestConnections(
        node as Node<NodeData>,
        nodes,
        pieceSizeRef.current.pieceSize,
        connectionRadius
      );

      if (!connections[0]) return;

      const {
        draggedNode,
        targetNode,
        draggedEdgePosition,
        targetEdgePosition,
      } = connections[0];

      const snapPosition = getSnapPosition(
        targetNode,
        draggedEdgePosition,
        pieceSizeRef.current.pieceSize
      );

      const draggedNodes = nodeMap.current.get(draggedNode.id) ?? [];
      const targetNodes = nodeMap.current.get(targetNode.id) ?? [];

      const newGroup = [
        ...new Set([
          ...draggedNodes,
          ...targetNodes,
          draggedNode.id,
          targetNode.id,
        ]),
      ];

      nodeMap.current.clear();

      newGroup.forEach((nodeId) => {
        nodeMap.current.set(
          nodeId,
          newGroup.filter((id) => id !== nodeId)
        );
      });

      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === draggedNode.id) {
            n.position = snapPosition;
            onConnect({
              source: draggedNode.id,
              target: targetNode.id,
              sourcePort: `${draggedEdgePosition}-${draggedNode.data.piece.edge[draggedEdgePosition]}`,
              targetPort: `${targetEdgePosition}-${targetNode.data.piece.edge[targetEdgePosition]}`,
            });
          }
          return n;
        })
      );
    },
    [nodes, onConnect]
  );

  const onNodeDrag = useCallback(
    (_: unknown, node: Node) => {
      const connections = findClosestConnections(
        node as Node<NodeData>,
        nodes,
        pieceSizeRef.current.pieceSize,
        connectionRadius
      );

      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: {
            ...n.data,
            highlightedPorts: [],
          },
        }))
      );

      if (connections.length > 0) {
        setNodes((nds) =>
          nds.map((n) => {
            const draggedConnections = connections.filter(
              (connection) => connection.draggedNode.id === n.id
            );
            const targetConnections = connections.filter(
              (connection) => connection.targetNode.id === n.id
            );

            const highlightedPorts: HighlightedPort[] = [
              ...draggedConnections.map((connection) => ({
                position: connection.draggedEdgePosition,
                isSource: true,
              })),
              ...targetConnections.map((connection) => ({
                position: connection.targetEdgePosition,
                isSource: false,
              })),
            ];

            return {
              ...n,
              data: {
                ...n.data,
                highlightedPorts:
                  highlightedPorts.length > 0 ? highlightedPorts : undefined,
              },
            };
          })
        );
      }
    },
    [nodes]
  );

  useEffect(() => {
    if (!puzzleNode) return;

    setNodes((nds) => nds.concat(puzzleNode));
    onUpdateSuccess();
  }, [puzzleNode]);

  return (
    <ReactDiagram
      ref={ref}
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      connectionRadius={connectionRadius}
      minZoom={1}
      maxZoom={2}
      onNodesChange={onNodesChange}
      onEdgeUpdate={onEdgeUpdate}
      onEdgeUpdateStart={onEdgeUpdateStart}
      onEdgeUpdateEnd={onEdgeUpdateEnd}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeDragEnd={onNodeDragEnd}
      onNodeDrag={onNodeDrag}
    />
  );
};

export default PuzzleDiagram;
