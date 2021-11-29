import {
  StateMachine,
  AbstractState,
  StateAction,
  buildNewAction,
  buildNewState,
} from './definition'

export interface MachineSchemaItem {
  action: string
  source: string[]
  destination: string
}

export interface StateMachineOption {
  initState?: string
  schema: MachineSchemaItem[]
  states: { [key: string]: AbstractState }
}

export const machineStatus = {
  pending: 'pending',
  ready: 'ready',
  quit_previous: 'quit',
  enter_next: 'enter',
  achieve_next: 'achieve',
  terminate: 'terminate',
}
export default class PotterStateMachine<T> implements StateMachine {
  static StateBegin = 'begin'
  static StateEnd = 'end'

  static NewAction = buildNewAction
  static NewState = buildNewState

  private currentState: string
  private machineStatus: string
  private options: StateMachineOption
  private biz?: T
  private schema: { [key: string]: MachineSchemaItem }

  static New<B>(opt: StateMachineOption, biz?: B): PotterStateMachine<B> {
    const machineOpt = {
      ...opt,
    }
    if (!machineOpt.schema) {
      machineOpt.schema = []
    }
    if (!machineOpt.states) {
      machineOpt.states = {}
    }

    return new PotterStateMachine(machineOpt, biz)
  }

  constructor(opt: StateMachineOption, biz?: T) {
    this.options = opt
    this.currentState = ''
    this.machineStatus = machineStatus.pending
    this.biz = biz

    if (opt.initState && opt.initState !== '') {
      const err = this.bootstrap(opt.initState)
      if (err) {
        throw err
      }
    }

    const schema: { [key: string]: MachineSchemaItem } = {}
    for (const item of opt.schema) {
      schema[item.action] = item
    }
    this.schema = schema
  }

  loadBiz(): T {
    return this.biz
  }

  bootstrap(stateId: string): Error | void {
    if (this.currentState !== '') {
      return new Error('machine is started')
    }

    if (this.machineStatus !== machineStatus.pending) {
      return new Error('machine status error')
    }

    if (
      !this.options.states[stateId] &&
      stateId !== PotterStateMachine.StateBegin
    ) {
      return new Error('state not exist')
    }

    this.currentState = stateId
    this.machineStatus = machineStatus.ready
  }

  isEnd(): boolean {
    return this.currentState === PotterStateMachine.StateEnd
  }

  trigger(act: StateAction): Error | void {
    if (!this.schema[act.type]) {
      console.log(act.type, this.schema)
      return new Error('action not found')
    }

    const item = this.schema[act.type]
    if (!item.source.includes(this.currentState)) {
      return new Error('action not reachable')
    }
    if (
      !this.options.states[item.destination] &&
      item.destination !== PotterStateMachine.StateEnd
    ) {
      return new Error('target state not found')
    }

    return this.transform(this.currentState, item.destination, act)
  }

  private transform(
    oldState: string,
    newState: string,
    act: StateAction
  ): Error | void {
    if (oldState !== PotterStateMachine.StateBegin) {
      this.options.states[this.currentState].quit({
        previous: '',
        current: this.currentState,
        payload: act.payload,
      })
      this.machineStatus = machineStatus.quit_previous
    }

    if (newState === PotterStateMachine.StateEnd) {
      this.currentState = newState
      this.machineStatus = machineStatus.terminate
      return
    }

    this.currentState = newState
    const nextState = this.options.states[newState]

    nextState.enter({
      previous: oldState,
      current: newState,
      payload: act.payload,
    })
    this.machineStatus = machineStatus.enter_next

    nextState.achieve({
      previous: oldState,
      current: newState,
      payload: act.payload,
    })
    this.machineStatus = machineStatus.achieve_next
  }
}
