using TodoApi.Models;

namespace TodoApi.Repositories;

public class InMemoryTodoRepository : ITodoRepository
{
    private readonly List<TodoItem> _todos = new();
    private readonly object _lock = new();

    public Task<List<TodoItem>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (_lock)
            return Task.FromResult(new List<TodoItem>(_todos));
    }

    public Task<TodoItem> AddAsync(TodoItem item, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (_lock)
        {
            _todos.Add(item);
            return Task.FromResult(item);
        }
    }

    public Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (_lock)
        {
            var index = _todos.FindIndex(x => x.Id == id);
            if (index < 0)
                return Task.FromResult(false);
            _todos.RemoveAt(index);
            return Task.FromResult(true);
        }
    }

    public Task<TodoItem?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (_lock)
            return Task.FromResult(_todos.FirstOrDefault(x => x.Id == id));
    }
}