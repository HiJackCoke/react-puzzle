import { useState } from "react";
import styles from "./style.module.css";

import PuzzleGenerator, {
  OnImageUpdate,
  PieceSize,
  PuzzlePiece,
} from "../PuzzleGenerator";

import PuzzleNodeView from "../PuzzleNode/View";
import { rectSortingStrategy, SortableContext } from "@dnd-kit/sortable";
import { DragOverlay } from "@dnd-kit/core";

interface Props {
  activeId?: number;
}

function PuzzleSidebar({ activeId }: Props) {
  const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
  const [sizes, setSizes] = useState<PieceSize>({
    totalSize: 0,
    pieceSize: 0,
    tabSize: 0,
  });

  const handlePuzzleUpdate: OnImageUpdate = (pieces, size) => {
    setPieces(pieces);
    setSizes(size);
  };

  const activePiece = pieces.find(({ id }) => id === activeId);

  return (
    <>
      <SortableContext
        id="pieces"
        items={pieces}
        strategy={rectSortingStrategy}
      >
        <aside className={styles.container}>
          <PuzzleGenerator onImageUpdate={handlePuzzleUpdate} />

          <div className={styles["puzzle-wrapper"]}>
            {pieces.map((piece) => (
              <PuzzleNodeView
                key={piece.id}
                id={piece.id}
                sizes={sizes}
                piece={piece}
              />
            ))}
          </div>
        </aside>
      </SortableContext>
      <DragOverlay>
        {activeId && activePiece ? (
          <PuzzleNodeView id={activeId} sizes={sizes} piece={activePiece} />
        ) : null}
      </DragOverlay>
    </>
  );
}

export default PuzzleSidebar;
