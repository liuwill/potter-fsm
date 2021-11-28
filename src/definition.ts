export interface StateContext {
  previous: string
  current: string
  payload: any
}

export type StateFunc = (ctx: StateContext) => any

export interface AbstractState {
  stateId(): string
  // 进入
  enter: StateFunc
  // 到达状态
  achieve: StateFunc
  // 退出
  quit: StateFunc
}

export function buildNewState(
  id: string,
  enter: StateFunc,
  achieve: StateFunc,
  quit: StateFunc
): AbstractState {
  return {
    stateId: () => {
      return id
    },
    enter,
    achieve,
    quit,
  }
}

export interface StateAction {
  type: string
  payload?: any
}

export function buildNewAction(type: string, payload?: any): StateAction {
  return {
    type,
    payload,
  }
}

export interface StateMachine {
  trigger(act: StateAction): Error | void
}
