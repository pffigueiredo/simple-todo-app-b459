
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type GetTodoInput } from '../schema';
import { getTodo } from '../handlers/get_todo';

describe('getTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a todo when it exists', async () => {
    // Create a test todo
    const testTodo = await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        completed: false
      })
      .returning()
      .execute();

    const input: GetTodoInput = {
      id: testTodo[0].id
    };

    const result = await getTodo(input);

    expect(result).not.toBeNull();
    expect(result?.id).toEqual(testTodo[0].id);
    expect(result?.title).toEqual('Test Todo');
    expect(result?.completed).toEqual(false);
    expect(result?.created_at).toBeInstanceOf(Date);
  });

  it('should return null when todo does not exist', async () => {
    const input: GetTodoInput = {
      id: 999 // Non-existent ID
    };

    const result = await getTodo(input);

    expect(result).toBeNull();
  });

  it('should return correct todo when multiple todos exist', async () => {
    // Create multiple test todos
    const todo1 = await db.insert(todosTable)
      .values({
        title: 'First Todo',
        completed: false
      })
      .returning()
      .execute();

    const todo2 = await db.insert(todosTable)
      .values({
        title: 'Second Todo',
        completed: true
      })
      .returning()
      .execute();

    const input: GetTodoInput = {
      id: todo2[0].id
    };

    const result = await getTodo(input);

    expect(result).not.toBeNull();
    expect(result?.id).toEqual(todo2[0].id);
    expect(result?.title).toEqual('Second Todo');
    expect(result?.completed).toEqual(true);
  });
});
