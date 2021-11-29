import PotterStateMachine, { StateContext, AbstractState } from '../src/main'

// import chalk from 'chalk'
interface BankAccount {
  balance: number
}

function buildPrintState(state: string): AbstractState {
  return PotterStateMachine.NewState(
    state,
    (ctx) => {
      console.log(`Enter ${state}`)
    },
    (ctx) => {
      console.log(`Achieve ${state}`)
    },
    (ctx) => {
      console.log(`Quit ${state}`)
    }
  )
}

function main() {
  const account: BankAccount = { balance: 1000 }
  const machine = PotterStateMachine.New(
    {
      schema: [
        {
          action: 'need_manual',
          source: [PotterStateMachine.StateBegin],
          destination: 'manual_audit',
        },
        {
          action: 'not_need_manual',
          source: [PotterStateMachine.StateBegin],
          destination: 'transfer',
        },
        {
          action: 'manual_audit_pass',
          source: ['manual_audit'],
          destination: 'transfer',
        },
        {
          action: 'transfer_success',
          source: ['transfer'],
          destination: PotterStateMachine.StateEnd,
        },
        {
          action: 'transfer_fail',
          source: ['transfer'],
          destination: 'transfer_await',
        },
        {
          action: 'transfer_retry',
          source: ['transfer_await'],
          destination: 'transfer',
        },
        {
          action: 'transfer_not_retry',
          source: ['transfer_await'],
          destination: 'mark_error',
        },
        {
          action: 'manual_audit_fail',
          source: ['manual_audit'],
          destination: 'refund',
        },
        {
          action: 'refund_success',
          source: ['refund'],
          destination: PotterStateMachine.StateEnd,
        },
        {
          action: 'refund_fail',
          source: ['refund'],
          destination: 'refund_await',
        },
        {
          action: 'refund_retry',
          source: ['refund_await'],
          destination: 'refund',
        },
        {
          action: 'refund_not_retry',
          source: ['refund_await'],
          destination: 'mark_error',
        },
        {
          action: 'question_marked',
          source: ['mark_error'],
          destination: PotterStateMachine.StateEnd,
        },
      ],
      states: {
        manual_audit: buildPrintState('manual_audit'),
        transfer: buildPrintState('transfer'),
        transfer_await: buildPrintState('transfer_await'),
        mark_error: buildPrintState('mark_error'),
        refund_await: buildPrintState('refund_await'),
        refund: buildPrintState('refund'),
      },
      initState: PotterStateMachine.StateBegin,
    },
    account
  )

  const actionList = [
    'need_manual',
    'manual_audit_pass',
    'transfer_fail',
    'transfer_retry',
    'transfer_success',
  ]
  for (const act of actionList) {
    if (machine.isEnd()) {
      console.log('Exit Machine End')
      break
    }

    console.log('do action:', act)
    const err = machine.trigger({ type: act })
    if (err && err instanceof Error) {
      throw err
    }
  }

  console.log('All Action Executed In:', actionList)
}

try {
  main()
} catch (error) {
  console.log('Error', error)
}
