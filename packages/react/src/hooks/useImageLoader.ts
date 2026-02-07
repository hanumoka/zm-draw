'use client';

import { useCallback, useEffect } from 'react';
import type Konva from 'konva';
import type { Shape, StampType } from '@zm-draw/core';
import { generateId, defaultImageShapeProps } from '@zm-draw/core';
import { useEditorStore } from '../stores/editorStore';

/** Maximum image dimension (pixels) before scaling down */
const MAX_IMAGE_SIZE = 4000;

/** Maximum display size for initial placement */
const maxDisplaySize = 400;

/** Module-level image cache to avoid redundant loads */
const imageCache = new Map<string, HTMLImageElement>();

export interface UseImageLoaderOptions {
  stageRef: React.RefObject<Konva.Stage | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  snapToGridValue?: (value: number) => number;
  onShapesChange?: (shapes: Shape[]) => void;
}

export function useImageLoader(options: UseImageLoaderOptions) {
  const {
    stageRef,
    containerRef,
    snapToGridValue = (v: number) => v,
    onShapesChange,
  } = options;

  const storeAddShape = useEditorStore((s) => s.addShape);
  const select = useEditorStore((s) => s.select);
  const setTool = useEditorStore((s) => s.setTool);

  // ── Load image from src and cache it ─────────────────────

  const loadImage = useCallback((src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      // Check cache first
      const cached = imageCache.get(src);
      if (cached && cached.complete) {
        resolve(cached);
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imageCache.set(src, img);
        resolve(img);
      };
      img.onerror = () => {
        reject(new Error(`Failed to load image: ${src.substring(0, 50)}...`));
      };
      img.src = src;
    });
  }, []);

  // ── Add image shape at position ──────────────────────────

  const addImageShape = useCallback(
    (
      src: string,
      x: number,
      y: number,
      naturalWidth: number,
      naturalHeight: number
    ) => {
      // Calculate size - fit within max dimensions while preserving aspect ratio
      let width = naturalWidth;
      let height = naturalHeight;

      if (width > MAX_IMAGE_SIZE || height > MAX_IMAGE_SIZE) {
        const scale = Math.min(MAX_IMAGE_SIZE / width, MAX_IMAGE_SIZE / height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      // Limit initial display size for usability
      if (width > maxDisplaySize || height > maxDisplaySize) {
        const displayScale = Math.min(
          maxDisplaySize / width,
          maxDisplaySize / height
        );
        width = Math.round(width * displayScale);
        height = Math.round(height * displayScale);
      }

      const snappedX = snapToGridValue(x - width / 2);
      const snappedY = snapToGridValue(y - height / 2);

      const newShape: Shape = {
        id: generateId(),
        type: 'image',
        x: snappedX,
        y: snappedY,
        ...defaultImageShapeProps,
        width,
        height,
        src,
        naturalWidth,
        naturalHeight,
      };

      storeAddShape(newShape);
      select(newShape.id);
      setTool('select');

      // Notify external callback
      const updatedShapes = useEditorStore.getState().shapes;
      onShapesChange?.(updatedShapes);
    },
    [snapToGridValue, storeAddShape, select, setTool, onShapesChange]
  );

  // ── Process dropped or pasted image file ─────────────────

  const processImageFile = useCallback(
    async (file: File, x: number, y: number) => {
      return new Promise<void>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const dataUrl = e.target?.result as string;
          if (!dataUrl) {
            reject(new Error('Failed to read file'));
            return;
          }

          // Load image to get dimensions
          const img = new Image();
          img.onload = () => {
            // Cache the image
            imageCache.set(dataUrl, img);
            addImageShape(dataUrl, x, y, img.naturalWidth, img.naturalHeight);
            resolve();
          };
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = dataUrl;
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
    },
    [addImageShape]
  );

  // ── Handle drag over (prevent default to allow drop) ─────

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  // ── Handle file drop on canvas ───────────────────────────

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const files = Array.from(e.dataTransfer.files);
      const imageFiles = files.filter((file) =>
        file.type.startsWith('image/')
      );

      if (imageFiles.length === 0) return;

      // Get drop position relative to canvas
      const stage = stageRef.current;
      if (!stage) return;

      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;

      const stagePos = stage.position();
      const stageScale = stage.scaleX();

      // Convert screen position to canvas position
      const dropX =
        (e.clientX - containerRect.left - stagePos.x) / stageScale;
      const dropY =
        (e.clientY - containerRect.top - stagePos.y) / stageScale;

      // Process each image file
      for (const file of imageFiles) {
        try {
          await processImageFile(file, dropX, dropY);
        } catch (error) {
          console.error('Failed to process dropped image:', error);
        }
      }
    },
    [stageRef, containerRef, processImageFile]
  );

  // ── Handle clipboard paste (for images) ──────────────────

  const handlePasteImage = useCallback(
    async (e: ClipboardEvent) => {
      // Check for image data in clipboard
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageItems = Array.from(items).filter((item) =>
        item.type.startsWith('image/')
      );
      if (imageItems.length === 0) return;

      // Prevent default paste behavior for images
      e.preventDefault();

      const stage = stageRef.current;
      if (!stage) return;

      // Get center of current viewport
      const stagePos = stage.position();
      const stageScale = stage.scaleX();
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;

      const centerX = (containerRect.width / 2 - stagePos.x) / stageScale;
      const centerY = (containerRect.height / 2 - stagePos.y) / stageScale;

      for (const item of imageItems) {
        const file = item.getAsFile();
        if (file) {
          try {
            await processImageFile(file, centerX, centerY);
          } catch (error) {
            console.error('Failed to paste image:', error);
          }
        }
      }
    },
    [stageRef, containerRef, processImageFile]
  );

  // ── Open file dialog to add image ────────────────────────

  const openImageDialog = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || files.length === 0) return;

      const stage = stageRef.current;
      if (!stage) return;

      // Get center of current viewport
      const stagePos = stage.position();
      const stageScale = stage.scaleX();
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;

      const centerX = (containerRect.width / 2 - stagePos.x) / stageScale;
      const centerY = (containerRect.height / 2 - stagePos.y) / stageScale;

      for (const file of Array.from(files)) {
        if (file.type.startsWith('image/')) {
          try {
            await processImageFile(file, centerX, centerY);
          } catch (error) {
            console.error('Failed to add image:', error);
          }
        }
      }
    };
    input.click();
  }, [stageRef, containerRef, processImageFile]);

  // ── Add stamp at center of viewport ──────────────────────

  const addStampAtCenter = useCallback(
    (addShape: (type: string, x: number, y: number, opts?: Record<string, unknown>) => void) => {
      const stage = stageRef.current;
      if (!stage) return;

      const stagePos = stage.position();
      const stageScale = stage.scaleX();
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;

      const centerX = (containerRect.width / 2 - stagePos.x) / stageScale;
      const centerY = (containerRect.height / 2 - stagePos.y) / stageScale;

      addShape('stamp', centerX, centerY);
    },
    [stageRef, containerRef]
  );

  // ── Handle stamp shortcut (select type and add) ──────────

  const handleStampShortcut = useCallback(
    (
      type: StampType,
      addShape: (type: string, x: number, y: number, opts?: Record<string, unknown>) => void
    ) => {
      const storeState = useEditorStore.getState();
      storeState.setStampType(type);

      const stage = stageRef.current;
      if (!stage) return;

      const stagePos = stage.position();
      const stageScale = stage.scaleX();
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;

      const centerX = (containerRect.width / 2 - stagePos.x) / stageScale;
      const centerY = (containerRect.height / 2 - stagePos.y) / stageScale;

      addShape('stamp', centerX, centerY, { stampType: type });
    },
    [stageRef, containerRef]
  );

  // ── Clipboard paste listener for images ──────────────────

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      if (Array.from(items).some((item) => item.type.startsWith('image/'))) {
        handlePasteImage(e);
      }
      // Let normal paste (Ctrl+V for shapes) continue if no image
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePasteImage]);

  return {
    loadImage,
    addImageShape,
    processImageFile,
    handleDragOver,
    handleDrop,
    openImageDialog,
    addStampAtCenter,
    handleStampShortcut,
  };
}
