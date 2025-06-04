import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { PieceSize, PuzzlePiece } from "../PuzzleGenerator";

interface Props {
  id: number;
  piece: PuzzlePiece;
  sizes: PieceSize;
}

const PuzzleNodeView = ({ id, piece, sizes }: Props) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
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
