import { create } from 'zustand'

interface SequenceState {
  playing: boolean
  intervalMs: number
  loop: boolean
  start: () => void
  stop: () => void
  toggle: () => void
  setIntervalMs: (ms: number) => void
  setLoop: (loop: boolean) => void
}

export const useSequenceStore = create<SequenceState>((set) => ({
  playing: false,
  intervalMs: 2000,
  loop: true,
  start: () => set({ playing: true }),
  stop: () => set({ playing: false }),
  toggle: () => set((state) => ({ playing: !state.playing })),
  setIntervalMs: (ms) => set({ intervalMs: ms }),
  setLoop: (loop) => set({ loop }),
}))
