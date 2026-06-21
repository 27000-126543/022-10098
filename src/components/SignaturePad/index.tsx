import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { Eraser, Undo2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SignaturePadProps {
  width?: number
  height?: number
  penColor?: string
  penWidth?: number
  onSave?: (dataUrl: string) => void
  value?: string | null
}

export interface SignaturePadRef {
  clear: () => void
  undo: () => void
  toDataURL: (type?: string, quality?: number) => string
}

interface Point {
  x: number
  y: number
}

const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(
  (
    {
      width,
      height = 200,
      penColor = '#1f2937',
      penWidth = 2.5,
      onSave,
      value,
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
    const isDrawingRef = useRef(false)
    const lastPointRef = useRef<Point | null>(null)
    const strokeHistoryRef = useRef<ImageData[]>([])
    const [canvasWidth, setCanvasWidth] = useState<number>(width || 0)
    const [, forceUpdate] = useState(0)

    const getCoordinates = useCallback(
      (e: React.MouseEvent | React.TouchEvent): Point | null => {
        const canvas = canvasRef.current
        if (!canvas) return null

        const rect = canvas.getBoundingClientRect()
        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height

        let clientX: number, clientY: number

        if ('touches' in e) {
          if (e.touches.length === 0 && e.changedTouches.length === 0) return null
          const touch = e.touches[0] || e.changedTouches[0]
          clientX = touch.clientX
          clientY = touch.clientY
        } else {
          clientX = e.clientX
          clientY = e.clientY
        }

        return {
          x: (clientX - rect.left) * scaleX,
          y: (clientY - rect.top) * scaleY,
        }
      },
      []
    )

    const saveState = useCallback(() => {
      const canvas = canvasRef.current
      const ctx = ctxRef.current
      if (!canvas || !ctx) return

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      strokeHistoryRef.current.push(imageData)
      forceUpdate((n) => n + 1)
    }, [])

    const beginDraw = useCallback(
      (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault()
        const point = getCoordinates(e)
        if (!point) return

        saveState()

        isDrawingRef.current = true
        lastPointRef.current = point

        const ctx = ctxRef.current
        if (ctx) {
          ctx.beginPath()
          ctx.arc(point.x, point.y, penWidth / 2, 0, Math.PI * 2)
          ctx.fillStyle = penColor
          ctx.fill()
        }
      },
      [getCoordinates, penColor, penWidth, saveState]
    )

    const draw = useCallback(
      (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawingRef.current) return
        e.preventDefault()

        const point = getCoordinates(e)
        const lastPoint = lastPointRef.current
        const ctx = ctxRef.current

        if (!point || !lastPoint || !ctx) return

        const midPoint: Point = {
          x: (lastPoint.x + point.x) / 2,
          y: (lastPoint.y + point.y) / 2,
        }

        ctx.beginPath()
        ctx.strokeStyle = penColor
        ctx.lineWidth = penWidth
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.moveTo(lastPoint.x, lastPoint.y)
        ctx.quadraticCurveTo(midPoint.x, midPoint.y, point.x, point.y)
        ctx.stroke()

        lastPointRef.current = point
      },
      [getCoordinates, penColor, penWidth]
    )

    const endDraw = useCallback(
      (e?: React.MouseEvent | React.TouchEvent) => {
        if (e) e.preventDefault()
        if (!isDrawingRef.current) return

        isDrawingRef.current = false
        lastPointRef.current = null

        if (onSave) {
          const dataUrl = toDataURLInternal()
          onSave(dataUrl)
        }
      },
      [onSave]
    )

    const toDataURLInternal = useCallback(
      (type?: string, quality?: number): string => {
        const canvas = canvasRef.current
        if (!canvas) return ''

        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = canvas.width
        tempCanvas.height = canvas.height
        const tempCtx = tempCanvas.getContext('2d')
        if (!tempCtx) return canvas.toDataURL(type, quality)

        tempCtx.fillStyle = '#ffffff'
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
        tempCtx.drawImage(canvas, 0, 0)

        return tempCanvas.toDataURL(type, quality)
      },
      []
    )

    const clear = useCallback(() => {
      const canvas = canvasRef.current
      const ctx = ctxRef.current
      if (!canvas || !ctx) return

      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      strokeHistoryRef.current = []
      forceUpdate((n) => n + 1)

      if (onSave) {
        onSave('')
      }
    }, [onSave])

    const undo = useCallback(() => {
      const canvas = canvasRef.current
      const ctx = ctxRef.current
      if (!canvas || !ctx || strokeHistoryRef.current.length === 0) return

      const imageData = strokeHistoryRef.current.pop()!
      ctx.putImageData(imageData, 0, 0)
      forceUpdate((n) => n + 1)

      if (onSave) {
        const dataUrl = toDataURLInternal()
        onSave(dataUrl)
      }
    }, [onSave, toDataURLInternal])

    useImperativeHandle(
      ref,
      () => ({
        clear,
        undo,
        toDataURL: toDataURLInternal,
      }),
      [clear, undo, toDataURLInternal]
    )

    useEffect(() => {
      const updateWidth = () => {
        if (width) {
          setCanvasWidth(width)
        } else if (containerRef.current) {
          setCanvasWidth(containerRef.current.clientWidth)
        }
      }

      updateWidth()
      if (!width) {
        window.addEventListener('resize', updateWidth)
        return () => window.removeEventListener('resize', updateWidth)
      }
    }, [width])

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas || canvasWidth === 0) return

      const dpr = window.devicePixelRatio || 1
      canvas.width = canvasWidth * dpr
      canvas.height = height * dpr
      canvas.style.width = `${canvasWidth}px`
      canvas.style.height = `${height}px`

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.scale(dpr, dpr)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = penColor
      ctx.lineWidth = penWidth
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvasWidth, height)

      ctxRef.current = ctx
      strokeHistoryRef.current = []

      if (value) {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvasWidth, height)
        }
        img.src = value
      }
    }, [canvasWidth, height, penColor, penWidth, value])

    const canUndo = strokeHistoryRef.current.length > 0

    return (
      <div className="w-full" ref={containerRef}>
        <div className="relative rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500 border border-gray-300 bg-white">
          <div className="absolute top-2 left-2 text-xs text-gray-200 select-none pointer-events-none z-10">
            签名区域
          </div>
          <div className="absolute top-2 right-2 text-xs text-gray-200 select-none pointer-events-none z-10">
            签名区域
          </div>
          <div className="absolute bottom-2 left-2 text-xs text-gray-200 select-none pointer-events-none z-10">
            签名区域
          </div>
          <div className="absolute bottom-2 right-2 text-xs text-gray-200 select-none pointer-events-none z-10">
            签名区域
          </div>
          <canvas
            ref={canvasRef}
            className={cn(
              'block w-full touch-none cursor-crosshair bg-white',
              `h-[${height}px]`
            )}
            style={{ height: `${height}px` }}
            onMouseDown={beginDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={beginDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
        </div>
        <div className="flex items-center justify-end gap-2 mt-2">
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white'
            )}
          >
            <Undo2 className="h-4 w-4" />
            撤销
          </button>
          <button
            type="button"
            onClick={clear}
            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Eraser className="h-4 w-4" />
            清除
          </button>
        </div>
      </div>
    )
  }
)

SignaturePad.displayName = 'SignaturePad'

export default SignaturePad
