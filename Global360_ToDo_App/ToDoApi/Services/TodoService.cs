using TodoApi.DTOs;
using TodoApi.Models;
using TodoApi.Repositories;

namespace TodoApi.Services;

public class TodoService : ITodoService
{
    private readonly ITodoRepository _repository;

    public TodoService(ITodoRepository repository)
    {
        _repository = repository;
    }

    public async Task<IReadOnlyList<TodoResponse>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var items = await _repository.GetAllAsync(cancellationToken);
        return items.Select(MapToResponse).ToList();
    }

    public async Task<TodoResponse?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var item = await _repository.GetByIdAsync(id, cancellationToken);
        return item is null ? null : MapToResponse(item);
    }

    public async Task<TodoResponse> CreateAsync(CreateTodoRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            throw new ArgumentException("Title cannot be empty.", nameof(request));

        var item = new TodoItem
        {
            Title = request.Title.Trim()
        };

        var created = await _repository.AddAsync(item, cancellationToken);
        return MapToResponse(created);
    }

    public async Task<TodoResponse?> UpdateAsync(Guid id, UpdateTodoRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            throw new ArgumentException("Title cannot be empty.", nameof(request));

        var updated = await _repository.UpdateTitleAsync(id, request.Title.Trim(), cancellationToken);
        return updated is null ? null : MapToResponse(updated);
    }

    public async Task<TodoResponse?> MarkAsCompletedAsync(Guid id, bool isCompleted, CancellationToken cancellationToken = default)
    {
        var updated = await _repository.MarkAsCompletedAsync(id, isCompleted, cancellationToken);
        return updated is null ? null : MapToResponse(updated);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _repository.DeleteAsync(id, cancellationToken);
    }

    private static TodoResponse MapToResponse(TodoItem item) => new()
    {
        Id = item.Id,
        Title = item.Title,
        IsCompleted = item.IsCompleted,
        CreatedAt = item.CreatedAt
    };
}