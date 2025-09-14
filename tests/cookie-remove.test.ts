import { test } from 'node:test';
import assert from 'node:assert/strict';

test('remove merges name and options into single argument', () => {
  const calls: any[] = [];
  const cookieStore = {
    delete: (...args: any[]) => calls.push(args),
  };

  const remove = (name: string, options: any) => {
    cookieStore.delete({ name, ...options });
  };

  remove('token', { path: '/' });

  assert.deepStrictEqual(calls, [[{ name: 'token', path: '/' }]]);
});
