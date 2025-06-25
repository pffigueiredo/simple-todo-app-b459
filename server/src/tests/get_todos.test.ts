
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { getTodos } from '../handlers/get_todos';

describe('getTodos', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no todos exist', async () => {
    const result = await getTodos();
    
    expect(result).toEqual([]);
  });

  it('should return all todos from database', async () => {
    // Create test todos
    await db.insert(todosTable)
      .values([
        { title: 'First todo', completed: false },
        { title: 'Second todo', completed: true },
        { title: 'Third todo', completed: false }
      ])
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(3);
    
    // Verify first todo
    expect(result[0].title).toEqual('First todo');
    expect(result[0].completed).toEqual(false);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    
    // Verify second todo
    expect(result[1].title).toEqual('Second todo');
    expect(result[1].completed).toEqual(true);
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
    
    // Verify third todo
    expect(result[2].title).toEqual('Third todo');
    expect(result[2].completed).toEqual(false);
    expect(result[2].id).toBeDefined();
    expect(result[2].created_at).toBeInstanceOf(Date);
  });

  it('should return todos in insertion order', async () => {
    // Insert todos with specific titles to verify order
    await db.insert(todosTable)
      .values({ title: 'Alpha todo', completed: false })
      .execute();
    
    await db.insert(todosTable)
      .values({ title: 'Beta todo', completed: true })
      .execute();
    
    await db.insert(todosTable)
      .values({ title: 'Gamma todo', completed: false })
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(3);
    expect(result[0].title).toEqual('Alpha todo');
    expect(result[1].title).toEqual('Beta todo');
    expect(result[2].title).toEqual('Gamma todo');
  });
});
