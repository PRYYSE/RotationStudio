export type Spot = { x: number; z: number }
export type Point = Spot & { y: number }
export type ServeOwner = 'they' | 'us'
export type OpponentAttack = 'left' | 'right'
export type FirstTouch = 'normal' | 'harry'
export type AlternateKey = 'right' | 'harry' | 'harryRight'
export type ReceiveZone = {
  player: string
  center: Spot
  radiusX: number
  radiusZ: number
  duty: 'primary' | 'assist' | 'compact'
  label: string
}
export type Tactics = {
  opponentAttack: OpponentAttack
  firstTouch: FirstTouch
  fallbackSetter: string
  nextSetter: string
  receiveZones: ReceiveZone[]
  coachNote: string
}
export type RotationView = 'front' | 'side' | 'orbit' | 'top'
export type Role = 'start' | 'serve' | 'receive' | 'pass' | 'set' | 'attack' | 'block' | 'help' | 'defend' | 'recover'
export type PlanStatus = 'TRAINING DEMO / UNAPPROVED' | 'DRAFT' | 'APPROVED'
export type Team = {
  schemaVersion: 1
  status: PlanStatus
  players: { id: string; name: string; setter: boolean; color: string }[]
  initialOrder: string[] // P1, P2, P3, P4, P5, P6
}
export type Keyframe = Spot & {
  time: number
  role: Role
  facing?: number // radians about Y
  via?: Spot[] // waypoints FROM the preceding keyframe
  aboveNet?: boolean
  takeoffZ?: number
}
export type Phase = { label: string; time: number; cue: string; section: 'Receive' | 'Attack' | 'Defend' }
export type BallSegment = {
  kind: 'serve' | 'return' | 'pass' | 'set' | 'attack'
  start: number
  end: number
  from: Point
  to: Point
  height: number // apex height in metres
}
export type Scenario = {
  rotation: number
  serve: ServeOwner
  duration: number
  phases: Phase[]
  tracks: Record<string, Keyframe[]>
  setterTarget: Spot
  firstContact: { player: string; time: number }
  secondContact: { player: string; time: number }
  ball: BallSegment[]
  tactics?: Tactics
  alternates?: Record<AlternateKey, Omit<Scenario, 'alternates'>>
}
export type Plans = {
  schemaVersion: 1
  status: PlanStatus
  netHeight: number
  scenarios: Scenario[]
}
export type Bundle = { team: Team; plans: Plans }
