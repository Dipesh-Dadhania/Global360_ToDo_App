using TodoApi.Models;

namespace TodoApi.Repositories;

public interface ITodoRepository
{
    Task<List<TodoItem>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<TodoItem> AddAsync(TodoItem item, CancellationToken cancellationToken = default);
    Task<TodoItem?> UpdateTitleAsync(Guid id, string title, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<TodoItem?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<TodoItem?> MarkAsCompletedAsync(Guid id, bool isCompleted, CancellationToken cancellationToken = default);
}