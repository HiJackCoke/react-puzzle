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
  activeId?: number | null;
  pieces: PuzzlePiece[];
  onImageChange?: (pieces: PuzzlePiece[], size: PieceSize) => void;
}

function PuzzleSidebar({ activeId, pieces, onImageChange }: Props) {
  // const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
  const [sizes, setSizes] = useState<PieceSize>({
    totalSize: 0,
    pieceSize: 0,
    tabSize: 0,
  });

  const handlePuzzleUpdate: OnImageUpdate = (pieces, size) => {
    onImageChange?.(pieces, size);
    // setPieces(pieces);
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
                isDragging={activeId === piece.id}
                sizes={sizes}
                piece={piece}
              />
            ))}
          </div>
        </aside>
      </SortableContext>

      {activeId && activePiece ? (
        <DragOverlay dropAnimation={{ duration: 0 }}>
          <PuzzleNodeView id={activeId} sizes={sizes} piece={activePiece} />
        </DragOverlay>
      ) : null}
    </>
  );
}

export default PuzzleSidebar;
