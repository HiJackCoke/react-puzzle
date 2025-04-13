import { DragEvent, useCallback, useRef } from "react";

import ReactDiagram, {
  Connection,
  Edge,
  Node,
  updateEdge,
  useEdgesState,
  useNodesState,
} from "react-cosmos-diagram";

import PuzzleNode, { NodeData } from "./components/PuzzleNode";
import { useDragContext } from "./contexts/DragContext";
import { PieceSize } from "./components/PuzzleGenerator";
import PuzzleSidebar from "./components/PuzzleSidebar";

import "react-cosmos-diagram/dist/style.css";
import { EdgePosition } from "./components/PuzzleGenerator/type";
import { isOppositePosition } from "./components/PuzzleGenerator/utils";

interface ClosestConnection {
  draggedNode: Node<NodeData>;
  targetNode: Node<NodeData>;
  draggedEdgePosition: EdgePosition;
  targetEdgePosition: EdgePosition;
}

const connectionRadius = 30;

const nodeTypes = {
  puzzle: PuzzleNode,
};

const getId = (pieceId: number) => `puzzle-node-${pieceId}`;

const getTranslateValues = (transformString: string) => {
  const translateRegex = /translate\(\s*([^\s,]+)px\s*,\s*([^\s,]+)px\s*\)/;
  const scaleRegex = /scale\(\s*([^\s,]+)\s*(?:,\s*([^\s,]+))?\s*\)/;

  const matches = transformString.match(translateRegex);
  const scaleMatches = transformString.match(scaleRegex);

  let x = 0,
    y = 0,
    scale = 1;

  if (matches) {
    x = parseFloat(matches[1]);
    y = parseFloat(matches[2]);
  }

  if (scaleMatches) {
    scale = parseFloat(scaleMatches[1]);
  }
  return { x, y, scale };
};

function App() {
  const edgeUpdateSuccessful = useRef(true);
  const nodeMap = useRef(new Map<string, string[]>([]));

  const pieceSizeRef = useRef<PieceSize>({
    tabSize: 0,
    totalSize: 0,
    pieceSize: 0,
  });

  const dragCtx = useDragContext();

  const [nodes, setNodes, onNodesChange] = useNodesState<NodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect = useCallback((params: Connection) => {
    const { source, target, sourcePort, targetPort } = params;

    const draggedEdgePosition = sourcePort?.split("-")[0] as EdgePosition;
    const targetEdgePosition = targetPort?.split("-")[0] as EdgePosition;

    if (!isOppositePosition(draggedEdgePosition, targetEdgePosition)) return;

    if (target && source) {
      const draggedNodes = nodeMap.current.get(source) ?? [];
      const targetNodes = nodeMap.current.get(target) ?? [];

      const targets = new Set([...draggedNodes, ...targetNodes, target]);
      const sources = new Set([...draggedNodes, ...targetNodes, source]);

      nodeMap.current.set(source, Array.from(targets));
      nodeMap.current.set(target, Array.from(sources));
    }

    setNodes((nodes) => {
      const connectedNodes = target
        ? nodeMap.current
            .get(target)
            ?.flatMap((node) => nodeMap.current.get(node) ?? [])
        : [];

      const filteredConnectedNodes = [...new Set(connectedNodes)];

      const draggedNode = nodes.find((node) => node.id === source);

      const draggedNodeX = draggedNode?.position.x || 0;
      const draggedNodeY = draggedNode?.position.y || 0;

      const childNodes = nodes.filter((node) =>
        filteredConnectedNodes?.includes(node.id)
      );

      let offsetX = 0;
      let offsetY = 0;

      const unCaughtNodes = nodes.filter(
        (node) =>
          !childNodes.some(
            (childNodes) =>
              childNodes.id === node.id && childNodes.id !== source
          )
      );

      return nodes.map((node) => {
        if (node.id === target) {
          if (targetEdgePosition === "left") {
            offsetX = draggedNodeX + pieceSizeRef.current.pieceSize;
            offsetY = draggedNodeY;
          }

          if (targetEdgePosition === "right") {
            offsetX = draggedNodeX - pieceSizeRef.current.pieceSize;
            offsetY = draggedNodeY;
          }

          if (targetEdgePosition === "top") {
            offsetX = draggedNodeX;
            offsetY = draggedNodeY + pieceSizeRef.current.pieceSize;
          }

          if (targetEdgePosition === "bottom") {
            offsetX = draggedNodeX;
            offsetY = draggedNodeY - pieceSizeRef.current.pieceSize;
          }

          if (childNodes.some((childNodes) => childNodes.id === source)) {
            childNodes
              .filter((childNodes) => childNodes.id === target)
              .forEach((childNode) => {
                childNode.position.x = offsetX;
                childNode.position.y = offsetY;
              });
          } else {
            childNodes
              .filter((childNodes) => childNodes.id !== target)
              .forEach((childNode) => {
                childNode.position.x =
                  offsetX + (childNode.position.x - node.position.x);
                childNode.position.y =
                  offsetY + (childNode.position.y - node.position.y);
              });
            unCaughtNodes
              .filter((unCaughtNode) => unCaughtNode.id !== source)
              .forEach((unCaughtNode) => {
                unCaughtNode.position.x =
                  offsetX + (unCaughtNode.position.x - node.position.x);
                unCaughtNode.position.y =
                  offsetY + (unCaughtNode.position.y - node.position.y);
              });

            node.position.x = offsetX;
            node.position.y = offsetY;
          }
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

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (!dragCtx) return;

    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (!dragCtx) return;
    const { draggedElementRef } = dragCtx;

    const node = draggedElementRef.current;
    if (!node) return;
    //   node.remove();
    node.style.visibility = "hidden";

    const type = event.dataTransfer.getData("application/react-cosmos-diagram");

    const distance = JSON.parse(event.dataTransfer.getData("application/node"));

    const piece = JSON.parse(event.dataTransfer.getData("application/piece"));

    const pieceSize = JSON.parse(
      event.dataTransfer.getData("application/pieceSize")
    );

    if (typeof type === "undefined" || !type) {
      return;
    }

    const container = event.target as HTMLDivElement;
    const viewport = container.querySelector(
      ".react-diagram__viewport"
    ) as HTMLDivElement;

    const translate = getTranslateValues(viewport?.style.transform);

    const position = {
      x: (event.clientX - distance.x - translate.x) / translate.scale,
      y: (event.clientY - distance.y - translate.y) / translate.scale,
    };

    const newNode = {
      id: getId(piece.id),
      type,
      position,
      data: {
        piece,
        size: pieceSize,
      },
    };

    pieceSizeRef.current = pieceSize;
    setNodes((nds) => nds.concat(newNode));
    event.dataTransfer.effectAllowed = "none";
  }, []);

  const onNodeDrag = useCallback(
    (_: unknown, node: Node) => {
      const draggedNode = node as Node<NodeData>;
      const draggedPiece = draggedNode.data.piece;

      const getPortPosition = (node: Node<NodeData>, edge: EdgePosition) => {
        switch (edge) {
          case "left":
            return {
              x: node.position.x,
              y: node.position.y + pieceSizeRef.current.pieceSize / 2,
            };
          case "right":
            return {
              x: node.position.x + pieceSizeRef.current.pieceSize,
              y: node.position.y + pieceSizeRef.current.pieceSize / 2,
            };
          case "top":
            return {
              x: node.position.x + pieceSizeRef.current.pieceSize / 2,
              y: node.position.y,
            };
          case "bottom":
            return {
              x: node.position.x + pieceSizeRef.current.pieceSize / 2,
              y: node.position.y + pieceSizeRef.current.pieceSize,
            };
        }
      };

      const getDistance = (
        p1: { x: number; y: number },
        p2: { x: number; y: number }
      ) => {
        return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
      };

      let closestConnection: ClosestConnection | null = null;
      let minDistance = connectionRadius / 2;

      nodes.forEach((targetNode) => {
        if (targetNode.id === node.id) return;

        const targetPiece = targetNode.data.piece;

        Object.entries(draggedPiece.edge).forEach(
          ([draggedEdge, draggedValue]) => {
            const draggedEdgePosition = draggedEdge as EdgePosition;
            Object.entries(targetPiece.edge).forEach(
              ([targetEdge, targetValue]) => {
                const targetEdgePosition = targetEdge as EdgePosition;
                if (
                  isOppositePosition(draggedEdgePosition, targetEdgePosition) &&
                  ((draggedValue === "tab" && targetValue === "blank") ||
                    (draggedValue === "blank" && targetValue === "tab"))
                ) {
                  const draggedPort = getPortPosition(
                    draggedNode,
                    draggedEdgePosition
                  );
                  const targetPort = getPortPosition(
                    targetNode,
                    targetEdgePosition
                  );
                  const distance = getDistance(draggedPort, targetPort);

                  if (distance < minDistance) {
                    minDistance = distance;
                    closestConnection = {
                      draggedNode,
                      targetNode,
                      draggedEdgePosition,
                      targetEdgePosition,
                    };
                  }
                }
              }
            );
          }
        );
      });

      if (closestConnection) {
        const {
          draggedNode,
          targetNode,
          draggedEdgePosition,
          targetEdgePosition,
        } = closestConnection as ClosestConnection;

        let snapX = targetNode.position.x;
        let snapY = targetNode.position.y;

        switch (draggedEdgePosition) {
          case "left":
            snapX = targetNode.position.x + pieceSizeRef.current.pieceSize;
            snapY = targetNode.position.y;
            break;
          case "right":
            snapX = targetNode.position.x - pieceSizeRef.current.pieceSize;
            snapY = targetNode.position.y;
            break;
          case "top":
            snapX = targetNode.position.x;
            snapY = targetNode.position.y + pieceSizeRef.current.pieceSize;
            break;
          case "bottom":
            snapX = targetNode.position.x;
            snapY = targetNode.position.y - pieceSizeRef.current.pieceSize;
            break;
        }

        setNodes((nds) =>
          nds.map((n) => {
            if (n.id === draggedNode.id) {
              n.position = { x: snapX, y: snapY };
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
      }
    },
    [nodes, onConnect]
  );

  return (
    <div className="dnd-container">
      <ReactDiagram
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        connectionRadius={connectionRadius}
        minZoom={1}
        maxZoom={2}
        onNodesChange={onNodesChange}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onEdgeUpdate={onEdgeUpdate}
        onEdgeUpdateStart={onEdgeUpdateStart}
        onEdgeUpdateEnd={onEdgeUpdateEnd}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDrag={onNodeDrag}
      />

      <PuzzleSidebar />
    </div>
  );
}

export default App;
