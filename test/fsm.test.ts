import test from 'ava'
import PotterStateMachine from '../src/main'

interface AccountSeed {
  balance: number
  name: string
}

class Account {
  balance: number
  name: string

  static New(seed: AccountSeed): Account {
    return new Account(seed)
  }

  constructor(seed: AccountSeed) {
    this.balance = seed.balance
    this.name = seed.name
  }

  reduce(amt: number): boolean {
    if (this.balance < amt) {
      return false
    }

    this.balance -= amt
    return true
  }

  add(amt: number): boolean {
    this.balance += amt
    return true
  }

  getBalance(): number {
    return this.balance
  }
}

interface AccountTransferParam {
  amount: number
  from: Account
  to: Account
}

test('State should read id', (t) => {
  const stateId = 'new_id'
  const createdState = PotterStateMachine.NewState(
    stateId,
    (ctx) => {
      console.log('enter')
    },
    (ctx) => {
      console.log('archive')
    },
    (ctx) => {
      console.log('quit')
    }
  )
  t.is(createdState.stateId(), stateId)
})

test('Machine should trigger with error', (t) => {
  const machine = PotterStateMachine.New({
    schema: [
      {
        action: 'break',
        source: ['missing_source'],
        destination: 'missing_target',
      },
      {
        action: 'unreachable',
        source: [PotterStateMachine.StateBegin],
        destination: 'unreachable_target',
      },
    ],
    states: {},
  })

  const stateNotExist = machine.bootstrap('not_exist')
  t.false(!stateNotExist)
  t.true(stateNotExist instanceof Error)

  const actionList = ['not_exit', 'unreachable', 'break']
  for (const act of actionList) {
    const err = machine.trigger(PotterStateMachine.NewAction(act))
    t.false(!err)
    t.true(err instanceof Error)
  }
})

test('State will switch as schema', (t) => {
  const transferAmt = 10
  const fromAmount = 1000
  const fromAccount: Account = Account.New({
    balance: fromAmount,
    name: 'will',
  })
  const toAccount: Account = Account.New({ balance: 0, name: 'seller' })
  const machine = PotterStateMachine.New({
    schema: [
      {
        action: 'transfer_money',
        source: [PotterStateMachine.StateBegin],
        destination: 'transfer',
      },
      {
        action: 'transfer_success',
        source: ['transfer'],
        destination: PotterStateMachine.StateEnd,
      },
    ],
    states: {
      transfer: PotterStateMachine.NewState(
        'transfer',
        (ctx) => {
          console.log(
            `Start transfer from [${ctx.payload.from.name}] to [${ctx.payload.to.name}]`
          )
        },
        (ctx) => {
          const param: AccountTransferParam = ctx.payload

          param.from.reduce(param.amount)
          param.to.add(param.amount)
        },
        (ctx) => {
          console.log(`Quit transfer`)
        }
      ),
    },
    initState: PotterStateMachine.StateBegin,
  })

  machine.trigger(
    PotterStateMachine.NewAction('transfer_money', {
      amount: transferAmt,
      from: fromAccount,
      to: toAccount,
    })
  )
  t.is(fromAccount.getBalance(), fromAmount - transferAmt)

  machine.trigger({
    type: 'transfer_success',
  })
  t.is(machine.isEnd(), true)
})
