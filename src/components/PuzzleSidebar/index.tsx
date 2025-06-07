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
  const [isOpen, setIsOpen] = useState(true);
  const [sizes, setSizes] = useState<PieceSize>({
    totalSize: 0,
    pieceSize: 0,
    tabSize: 0,
  });

  const handlePuzzleUpdate: OnImageUpdate = (pieces, size) => {
    onImageChange?.(pieces, size);
    setSizes(size);
  };

  const activePiece = pieces.find(({ id }) => id === activeId);

  return (
    <>
      <aside
        className={`${styles.container} ${
          isOpen ? styles.open : styles.closed
        }`}
      >
        <button
          className={styles["toggle-button"]}
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "사이드바 닫기" : "사이드바 열기"}
        >
          {isOpen ? "←" : "→"}
        </button>
        <div className={styles.content}>
          <PuzzleGenerator onImageUpdate={handlePuzzleUpdate} />
          <div className={styles["puzzle-wrapper"]}>
            <SortableContext
              id="pieces"
              items={pieces}
              strategy={rectSortingStrategy}
            >
              {pieces.map((piece) => (
                <PuzzleNodeView
                  key={piece.id}
                  id={piece.id}
                  isDragging={activeId === piece.id}
                  sizes={sizes}
                  piece={piece}
                />
              ))}
            </SortableContext>
          </div>
        </div>
      </aside>

      {activeId && activePiece ? (
        <DragOverlay dropAnimation={{ duration: 0 }}>
          <PuzzleNodeView id={activeId} sizes={sizes} piece={activePiece} />
        </DragOverlay>
      ) : null}
    </>
  );
}

export default PuzzleSidebar;
