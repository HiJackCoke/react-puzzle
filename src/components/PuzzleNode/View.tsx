import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { PieceSize, PuzzlePiece } from "../PuzzleGenerator";

interface Props {
  id: number;
  piece: PuzzlePiece;
  sizes: PieceSize;
  isDragging?: boolean;
}

const PuzzleNodeView = ({ id, piece, sizes, isDragging }: Props) => {
  const { attributes, listeners, transform, transition, setNodeRef } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <img
        src={piece.dataUrl}
        alt={`piece-${id}`}
        style={{
          width: `${sizes.totalSize}px`,
          height: `${sizes.totalSize}px`,
          objectFit: "cover",
        }}
      />
    </div>
  );
};

export default PuzzleNodeView;
