[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / ActionUnion

# Alias de Tipo: ActionUnion\<AM\>

> **ActionUnion**\<`AM`\> = `{ [C in keyof AM]: { [E in keyof AM[C]]: Action<AM, C, E> }[keyof AM[C]] }`\[keyof `AM`\]

Definida en: [types.ts:153](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/types.ts#L153)

Cada `{channel, event, payload }` legal como un tipo de objeto *distinto*.

## Parámetros de Tipo

### AM

`AM` *extiende* [`ActionMapBase`](ActionMapBase.md)
