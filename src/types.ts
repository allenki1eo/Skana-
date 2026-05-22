export type FilterPreset = 'original' | 'enhanced' | 'bw' | 'dark'

export interface Point {
  x: number
  y: number
}

export interface Corners {
  tl: Point
  tr: Point
  br: Point
  bl: Point
}

export interface ScannedPage {
  id: string
  rawDataUrl: string
  warpedDataUrl: string
  finalDataUrl: string
  corners: Corners
  filter: FilterPreset
  brightness: number
  contrast: number
}

export type Step = 'camera' | 'edge' | 'filter' | 'pages' | 'export'

export interface PendingPage {
  rawDataUrl: string
  corners: Corners
  warpedDataUrl: string | null
}

export interface AppState {
  step: Step
  pages: ScannedPage[]
  pending: PendingPage | null
}

export type AppAction =
  | { type: 'CAPTURE'; rawDataUrl: string; corners: Corners }
  | { type: 'UPDATE_CORNERS'; corners: Corners }
  | { type: 'CONFIRM_WARP'; warpedDataUrl: string }
  | { type: 'ADD_FINAL_PAGE'; page: ScannedPage }
  | { type: 'DELETE_PAGE'; id: string }
  | { type: 'MOVE_PAGE'; from: number; to: number }
  | { type: 'SET_STEP'; step: Step }
  | { type: 'RESET' }
