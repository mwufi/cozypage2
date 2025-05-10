'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Define a type for our Todo items
interface Todo {
    id: number;
    title: string;
    description: string | null;
    completed: boolean;
    created_at: string; // Assuming string from backend, can be Date
    updated_at: string; // Assuming string from backend, can be Date
}

export default function TodosPage() {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [newTodoTitle, setNewTodoTitle] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // const API_URL = 'http://localhost:8000/todos'; // Old backend API URL
    const NEXT_API_GET_TODOS_URL = '/api/todos/GET';
    const NEXT_API_POST_TODOS_URL = '/api/todos/POST';

    // Fetch todos
    const fetchTodos = async () => {
        setIsLoading(true);
        setError(null);
        // Token handling is now done by the Next.js API route

        try {
            const response = await fetch(NEXT_API_GET_TODOS_URL, {
                // credentials: 'include', // No longer needed, cookie sent automatically to same-origin Next.js API route
                // headers: {}, // No manual auth header
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || errorData.detail || 'Failed to fetch todos'); // Use .error from Next API route
            }
            const data: Todo[] = await response.json();
            setTodos(data);
        } catch (err: any) {
            setError(err.message || 'An error occurred while fetching todos.');
        }
        setIsLoading(false);
    };

    // Add a new todo
    const handleAddTodo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTodoTitle.trim()) return;

        setIsLoading(true);
        setError(null);
        // Token handling is now done by the Next.js API route

        try {
            const response = await fetch(NEXT_API_POST_TODOS_URL, {
                method: 'POST',
                // credentials: 'include', // No longer needed
                headers: {
                    'Content-Type': 'application/json',
                    // No manual auth header
                },
                body: JSON.stringify({ title: newTodoTitle, description: '' }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || errorData.detail || 'Failed to add todo'); // Use .error from Next API route
            }
            setNewTodoTitle('');
            fetchTodos(); // Refetch todos to see the new one and its completed status from backend logic
        } catch (err: any) {
            setError(err.message || 'An error occurred while adding the todo.');
        }
        setIsLoading(false);
    };

    // Fetch todos on component mount
    useEffect(() => {
        fetchTodos();
    }, []);

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">My Todos</h1>

            <form onSubmit={handleAddTodo} className="mb-6 flex gap-2">
                <Input
                    type="text"
                    value={newTodoTitle}
                    onChange={(e) => setNewTodoTitle(e.target.value)}
                    placeholder="What needs to be done?"
                    className="flex-grow"
                    disabled={isLoading}
                />
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Adding...' : 'Add Todo'}
                </Button>
            </form>

            {error && <p className="text-red-500 mb-4">Error: {error}</p>}

            {isLoading && todos.length === 0 && <p>Loading todos...</p>}

            {todos.length === 0 && !isLoading && !error && (
                <p>No todos yet. Add one above!</p>
            )}

            <ul className="space-y-2">
                {todos.map((todo) => (
                    <li
                        key={todo.id}
                        className={`p-3 rounded-md shadow ${todo.completed ? 'bg-green-100 line-through text-gray-500' : 'bg-white'
                            }`}
                    >
                        <h3 className="font-semibold">{todo.title}</h3>
                        {todo.description && <p className="text-sm text-gray-600">{todo.description}</p>}
                        <p className="text-xs text-gray-400 mt-1">
                            Created: {new Date(todo.created_at).toLocaleString()} | Completed: {todo.completed ? 'Yes' : 'No'}
                        </p>
                    </li>
                ))}
            </ul>
        </div>
    );
} 