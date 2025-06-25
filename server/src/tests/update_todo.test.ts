
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type UpdateTodoInput, type CreateTodoInput } from '../schema';
import { updateTodo } from '../handlers/update_todo';
import { eq } from 'drizzle-orm';

// Test inputs
const createTestTodo = async (): Promise<number> => {
  const result = await db.insert(todosTable)
    .values({
      title: 'Original Todo',
      completed: false
    })
    .returning()
    .execute();
  
  return result[0].id;
};

describe('updateTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update todo title only', async () => {
    const todoId = await createTestTodo();
    
    const updateInput: UpdateTodoInput = {
      id: todoId,
      title: 'Updated Todo Title'
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(todoId);
    expect(result.title).toEqual('Updated Todo Title');
    expect(result.completed).toEqual(false); // Should remain unchanged
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update todo completed status only', async () => {
    const todoId = await createTestTodo();
    
    const updateInput: UpdateTodoInput = {
      id: todoId,
      completed: true
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(todoId);
    expect(result.title).toEqual('Original Todo'); // Should remain unchanged
    expect(result.completed).toEqual(true);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update both title and completed status', async () => {
    const todoId = await createTestTodo();
    
    const updateInput: UpdateTodoInput = {
      id: todoId,
      title: 'Completely Updated Todo',
      completed: true
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(todoId);
    expect(result.title).toEqual('Completely Updated Todo');
    expect(result.completed).toEqual(true);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save updated todo to database', async () => {
    const todoId = await createTestTodo();
    
    const updateInput: UpdateTodoInput = {
      id: todoId,
      title: 'Database Updated Todo',
      completed: true
    };

    await updateTodo(updateInput);

    // Verify the update was persisted
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todoId))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].title).toEqual('Database Updated Todo');
    expect(todos[0].completed).toEqual(true);
    expect(todos[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent todo', async () => {
    const updateInput: UpdateTodoInput = {
      id: 99999, // Non-existent ID
      title: 'This should fail'
    };

    await expect(updateTodo(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should preserve created_at timestamp when updating', async () => {
    const todoId = await createTestTodo();
    
    // Get original created_at
    const originalTodo = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todoId))
      .execute();
    
    const originalCreatedAt = originalTodo[0].created_at;

    // Update the todo
    const updateInput: UpdateTodoInput = {
      id: todoId,
      title: 'Updated Title'
    };

    const result = await updateTodo(updateInput);

    // created_at should remain the same
    expect(result.created_at.getTime()).toEqual(originalCreatedAt.getTime());
  });
});
