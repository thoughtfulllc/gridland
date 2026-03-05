// Browser-compatible EventEmitter shim.
// Replaces the 'events' npm package to avoid CJS/ESM issues in Vite.

type Listener = (...args: any[]) => void

export class EventEmitter {
  private _listeners = new Map<string | symbol, Listener[]>()

  on(event: string | symbol, listener: Listener): this {
    const list = this._listeners.get(event) ?? []
    list.push(listener)
    this._listeners.set(event, list)
    return this
  }

  addListener(event: string | symbol, listener: Listener): this {
    return this.on(event, listener)
  }

  off(event: string | symbol, listener: Listener): this {
    return this.removeListener(event, listener)
  }

  removeListener(event: string | symbol, listener: Listener): this {
    const list = this._listeners.get(event)
    if (list) {
      const idx = list.indexOf(listener)
      if (idx !== -1) list.splice(idx, 1)
      if (list.length === 0) this._listeners.delete(event)
    }
    return this
  }

  removeAllListeners(event?: string | symbol): this {
    if (event) {
      this._listeners.delete(event)
    } else {
      this._listeners.clear()
    }
    return this
  }

  emit(event: string | symbol, ...args: any[]): boolean {
    const list = this._listeners.get(event)
    if (!list || list.length === 0) return false
    for (const listener of [...list]) {
      listener(...args)
    }
    return true
  }

  once(event: string | symbol, listener: Listener): this {
    const wrapper = (...args: any[]) => {
      this.removeListener(event, wrapper)
      listener(...args)
    }
    return this.on(event, wrapper)
  }

  listenerCount(event: string | symbol): number {
    return this._listeners.get(event)?.length ?? 0
  }

  listeners(event: string | symbol): Listener[] {
    return [...(this._listeners.get(event) ?? [])]
  }

  eventNames(): (string | symbol)[] {
    return [...this._listeners.keys()]
  }

  setMaxListeners(_n: number): this {
    return this // no-op in browser
  }

  getMaxListeners(): number {
    return Infinity
  }
}

export default EventEmitter
