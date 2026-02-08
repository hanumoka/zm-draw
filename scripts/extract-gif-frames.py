"""GIF 프레임 추출 스크립트
Usage: python scripts/extract-gif-frames.py <input.gif> [--max-frames 30] [--skip N]

Options:
  --max-frames  최대 추출 프레임 수 (기본: 30)
  --skip N      N 프레임마다 1장 추출 (기본: 자동 계산)
  --output-dir  출력 디렉토리 (기본: input 파일 옆에 _frames 폴더)
"""

import sys
import os
from PIL import Image


def extract_frames(gif_path, max_frames=30, skip=None, output_dir=None):
    if not os.path.exists(gif_path):
        print(f"Error: File not found: {gif_path}")
        sys.exit(1)

    img = Image.open(gif_path)
    total_frames = getattr(img, 'n_frames', 1)

    if total_frames == 1:
        print("Error: Not an animated GIF (only 1 frame)")
        sys.exit(1)

    # Auto-calculate skip if not specified
    if skip is None:
        skip = max(1, total_frames // max_frames)

    # Output directory
    if output_dir is None:
        base = os.path.splitext(gif_path)[0]
        output_dir = base + "_frames"

    os.makedirs(output_dir, exist_ok=True)

    print(f"GIF: {gif_path}")
    print(f"Total frames: {total_frames}")
    print(f"Skip: every {skip} frame(s)")
    print(f"Output: {output_dir}")
    print("---")

    extracted = 0
    for i in range(0, total_frames, skip):
        if extracted >= max_frames:
            break
        img.seek(i)
        frame = img.convert("RGBA")

        # Get frame duration (ms)
        duration = img.info.get('duration', 0)

        out_path = os.path.join(output_dir, f"frame_{extracted:03d}_f{i}_d{duration}ms.png")
        frame.save(out_path, "PNG")
        extracted += 1

    print(f"Extracted {extracted} frames to {output_dir}")
    return output_dir, extracted


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    gif_path = sys.argv[1]
    max_frames = 30
    skip = None
    output_dir = None

    args = sys.argv[2:]
    i = 0
    while i < len(args):
        if args[i] == '--max-frames' and i + 1 < len(args):
            max_frames = int(args[i + 1])
            i += 2
        elif args[i] == '--skip' and i + 1 < len(args):
            skip = int(args[i + 1])
            i += 2
        elif args[i] == '--output-dir' and i + 1 < len(args):
            output_dir = args[i + 1]
            i += 2
        else:
            i += 1

    extract_frames(gif_path, max_frames, skip, output_dir)
