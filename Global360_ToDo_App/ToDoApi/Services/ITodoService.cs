using TodoApi.DTOs;

namespace TodoApi.Services;

public interface ITodoService
{
    Task<IReadOnlyList<TodoResponse>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<TodoResponse?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<TodoResponse> CreateAsync(CreateTodoRequest request, CancellationToken cancellationToken = default);
    Task<TodoResponse?> MarkAsCompletedAsync(Guid id, bool isCompleted, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}