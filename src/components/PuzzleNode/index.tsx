import { NodeProps, Port, Position } from "react-cosmos-diagram";

import styles from "./style.module.css";
import { PieceSize, PuzzleEdge, PuzzlePiece } from "../PuzzleGenerator";
import { CSSProperties } from "react";

import "./style.css";
import { EdgePosition } from "../PuzzleGenerator/type";

export type NodeData = {
  piece: PuzzlePiece;
  size: PieceSize;
  highlightedPort?: {
    position: EdgePosition;
    isSource: boolean;
  };
};

const capitalizeFirstLetter = (
  str: Lowercase<keyof typeof Position>
): keyof typeof Position => {
  return (str[0].toUpperCase() + str.slice(1)) as keyof typeof Position;
};

function PuzzleNode({ data, selected }: NodeProps<NodeData>) {
  const { piece, highlightedPort } = data;

  const { id, dataUrl, edge } = piece;

  const edgeMap = Object.entries(edge) as [
    keyof PuzzlePiece["edge"],
    PuzzleEdge
  ][];

  return (
    <div
      className={`${styles.container} ${selected ? "selected" : ""}`}
      onDragStart={(e) => e.preventDefault()}
    >
      <div className={styles.wrapper}>
        <img src={dataUrl} alt={`piece-${id}`} />
        {/* <div className={styles.id}>{id}</div> */}
      </div>

      {edgeMap.map(([key, value]) => {
        if (value === "flat") return null;

        const isHighlighted = highlightedPort?.position === key;
        const highlightClass = isHighlighted ? styles.highlighted : "";

        return (
          <div
            key={`${key}-${value}`}
            className={`${styles[`${value}-${key}`]} ${highlightClass}`}
            style={
              {
                "--position": `${data.size.tabSize + data.size.tabSize / 2}px`,
                "--highlight-color": highlightedPort?.isSource
                  ? "#4CAF50"
                  : "#2196F3",
              } as CSSProperties
            }
          >
            <Port
              id={`${key}-${value}`}
              position={Position[capitalizeFirstLetter(key)]}
              type={value === "tab" ? "source" : "target"}
            />
          </div>
        );
      })}
    </div>
  );
}

export default PuzzleNode;
