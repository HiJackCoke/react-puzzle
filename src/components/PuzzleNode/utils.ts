import { Node, XYPosition } from "react-cosmos-diagram";
import { NodeData } from ".";
import { EdgePosition } from "../PuzzleGenerator/type";
import { isOppositePosition } from "../PuzzleGenerator/utils";

export interface ClosestConnection {
  draggedNode: Node<NodeData>;
  targetNode: Node<NodeData>;
  draggedEdgePosition: EdgePosition;
  targetEdgePosition: EdgePosition;
  distance: number;
}

const getPortPosition = (
  node: Node<NodeData>,
  edge: EdgePosition,
  pieceSize: number
) => {
  const baseX = node.position.x;
  const baseY = node.position.y;
  const halfPieceSize = pieceSize / 2;

  const positions = {
    left: { x: baseX, y: baseY + halfPieceSize },
    right: { x: baseX + pieceSize, y: baseY + halfPieceSize },
    top: { x: baseX + halfPieceSize, y: baseY },
    bottom: { x: baseX + halfPieceSize, y: baseY + pieceSize },
  };

  return positions[edge];
};

const getDistance = (p1: XYPosition, p2: XYPosition): number => {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};

export const getSnapPosition = (
  targetNode: Node<NodeData>,
  draggedEdgePosition: EdgePosition,
  pieceSize: number
): XYPosition => {
  const base = { x: targetNode.position.x, y: targetNode.position.y };

  const snapPositions = {
    left: { x: base.x + pieceSize, y: base.y },
    right: { x: base.x - pieceSize, y: base.y },
    top: { x: base.x, y: base.y + pieceSize },
    bottom: { x: base.x, y: base.y - pieceSize },
  };

  return snapPositions[draggedEdgePosition];
};

export const findClosestConnections = (
  draggedNode: Node<NodeData>,
  nodes: Node<NodeData>[],
  pieceSize: number,
  connectionRadius: number
): ClosestConnection[] => {
  const connections: ClosestConnection[] = [];

  const draggedPiece = draggedNode.data.piece;

  for (const targetNode of nodes) {
    if (targetNode.id === draggedNode.id) continue;

    const targetPiece = targetNode.data.piece;

    for (const [draggedEdge, draggedValue] of Object.entries(
      draggedPiece.edge
    )) {
      const draggedEdgePosition = draggedEdge as EdgePosition;

      for (const [targetEdge, targetValue] of Object.entries(
        targetPiece.edge
      )) {
        const targetEdgePosition = targetEdge as EdgePosition;

        const isValidConnection =
          isOppositePosition(draggedEdgePosition, targetEdgePosition) &&
          ((draggedValue === "tab" && targetValue === "blank") ||
            (draggedValue === "blank" && targetValue === "tab"));

        if (!isValidConnection) continue;

        const draggedPort = getPortPosition(
          draggedNode,
          draggedEdgePosition,
          pieceSize
        );
        const targetPort = getPortPosition(
          targetNode,
          targetEdgePosition,
          pieceSize
        );
        const distance = getDistance(draggedPort, targetPort);

        if (distance < connectionRadius) {
          connections.push({
            draggedNode,
            targetNode,
            draggedEdgePosition,
            targetEdgePosition,
            distance,
          });
        }
      }
    }
  }

        const minDistance = Math.min(
        ...connections.map((connection) => connection.distance)
      );
      const closestConnections = connections.filter(
        (connection) => connection.distance === minDistance
      );

  return closestConnections;
};
