import { NodeProps, Port, Position } from "react-cosmos-diagram";

import styles from "./style.module.css";
import { PieceSize, PuzzleEdge, PuzzlePiece } from "../PuzzleGenerator";
import { CSSProperties } from "react";

import "./style.css";

type Props = {
  piece: PuzzlePiece;
  size: PieceSize;
};

const capitalizeFirstLetter = (str: Lowercase<Position>): Position => {
  return (str[0].toUpperCase() + str.slice(1)) as Position;
};

function PuzzleNode({ data, selected }: NodeProps<Props>) {
  const { piece } = data;

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
        return (
          <div
            key={`${key}-${value}`}
            className={`${styles[`${value}-${key}`]}`}
            style={
              {
                "--position": `${data.size.tabSize + data.size.tabSize / 2}px`,
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
