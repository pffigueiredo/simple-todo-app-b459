
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type DeleteTodoInput } from '../schema';
import { deleteTodo } from '../handlers/delete_todo';
import { eq } from 'drizzle-orm';

describe('deleteTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing todo', async () => {
    // Create a test todo first
    const insertResult = await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        completed: false
      })
      .returning()
      .execute();

    const todoId = insertResult[0].id;

    const deleteInput: DeleteTodoInput = {
      id: todoId
    };

    const result = await deleteTodo(deleteInput);

    // Should return success
    expect(result.success).toBe(true);

    // Verify todo was actually deleted from database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todoId))
      .execute();

    expect(todos).toHaveLength(0);
  });

  it('should return false when deleting non-existent todo', async () => {
    const deleteInput: DeleteTodoInput = {
      id: 99999 // Non-existent ID
    };

    const result = await deleteTodo(deleteInput);

    // Should return false since no todo was deleted
    expect(result.success).toBe(false);
  });

  it('should not affect other todos when deleting specific todo', async () => {
    // Create multiple test todos
    const insertResult = await db.insert(todosTable)
      .values([
        { title: 'Todo 1', completed: false },
        { title: 'Todo 2', completed: true },
        { title: 'Todo 3', completed: false }
      ])
      .returning()
      .execute();

    const todoToDelete = insertResult[1]; // Delete the middle one

    const deleteInput: DeleteTodoInput = {
      id: todoToDelete.id
    };

    const result = await deleteTodo(deleteInput);

    expect(result.success).toBe(true);

    // Verify only the target todo was deleted
    const remainingTodos = await db.select()
      .from(todosTable)
      .execute();

    expect(remainingTodos).toHaveLength(2);
    expect(remainingTodos.some(todo => todo.id === todoToDelete.id)).toBe(false);
    expect(remainingTodos.some(todo => todo.title === 'Todo 1')).toBe(true);
    expect(remainingTodos.some(todo => todo.title === 'Todo 3')).toBe(true);
  });
});
