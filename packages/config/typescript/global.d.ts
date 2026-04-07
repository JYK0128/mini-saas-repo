export { };

declare global {
  type Key = string | number | symbol;
  type Numberable = string | number | bigint;
  type Primitive = string | number | bigint | boolean;
  type Literal<T> = T extends string ? string extends T ? never : T : never;
  type Tuple<T> = T extends [] ? [] : T extends [infer First, ...infer Rest] ? [First, ...Tuple<Rest>] : never;
  type Nullish<T> = T | undefined | null;
  type Nullable<T> = T | null;
  type Maybe<T> = T | undefined;
  type Mutable<T> = {
    -readonly [P in keyof T]: T[P]
  };
  type ValueOf<T, R extends keyof T = keyof T> = {
    [K in keyof T]: T[K]
  }[R];
  type KeyOf<T, V = unknown> = {
    [K in keyof T]: T[K] extends V ? K : never;
  }[Extract<keyof T, string>];

  type Setter<T> = T | ((old: T) => T);
  type Awaitable<T> = T | Promise<T>;
  type Task<T = void> = () => Awaitable<T>;
  type Resolvable<T = void> = Awaitable<T> | Task<T>;

  type Prettify<T> = {
    [P in keyof T]: T[P];
  } & {};
  type Mandatory<T, K extends keyof T = keyof T>
    = Prettify<Required<Pick<T, K>> & Partial<Omit<T, K>>>;
  type Optional<T, K extends keyof T = keyof T>
    = Prettify<Partial<Pick<T, K>> & Omit<T, K>>;
}
