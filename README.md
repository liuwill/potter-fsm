# POTTER-FSM
  [![NPM version][npm-image]][npm-url]

English | [简体中文](./README-zh_CN.md)

## 📦 Install:

```bash
npm install potter-fsm
```

```bash
yarn add potter-fsm
```

## 💻 Development

```bash
$ git clone git@github.com:liuwill/potter-fsm.git
$ cd potter-fsm
$ yarn install
$ yarn test
$ yarn build
$ yarn publish
```

## 🔧 Example:

```js
import PotterStateMachine, { StateContext, AbstractState } from 'potter-fsm'

function buildPrintState(state) {
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

const account = { balance: 1000 }
const machine = PotterStateMachine.New(
  {
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
      transfer: buildPrintState('transfer'),
    },
    initState: PotterStateMachine.StateBegin,
  },
  account
)

const actionList = [
  'transfer_money',
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

```

[npm-image]: https://img.shields.io/npm/v/potter-fsm.svg?style=flat-square
[npm-url]: https://npmjs.org/package/potter-fsm
