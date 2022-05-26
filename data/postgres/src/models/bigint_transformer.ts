/** Transform a database string into a JS bigint and vice versa. */
export const bigint_transformer = {
  from: (value?: string): bigint | undefined => {
    if (!value) return undefined;
    return BigInt(value);
  },
  to: (value?: bigint): string | undefined => {
    return value?.toString();
  }
}


declare global {
  interface BigInt {
    toJSON(): string
  }
}
// also make sure this can serialized to JSON
BigInt.prototype.toJSON = function() {
  return this.toString()
}


export default bigint_transformer

