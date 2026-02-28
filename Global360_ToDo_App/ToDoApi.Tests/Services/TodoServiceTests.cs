using TodoApi.DTOs;
using TodoApi.Models;
using TodoApi.Repositories;
using TodoApi.Services;
using Xunit;

namespace ToDoApi.Tests;

public class TodoServiceTests
{
    [Fact]
    public async Task CreateAsync_WithValidTitle_TrimAndReturnMappedResponse()
    {
        var repository = new FakeTodoRepository();
        var service = new TodoService(repository);

        var request = new CreateTodoRequest { Title = "  Buy milk  " };

        var result = await service.CreateAsync(request);

        Assert.Equal("Buy milk", result.Title);
        Assert.Equal(repository.AddedItems.Single().Id, result.Id);
        Assert.Equal(repository.AddedItems.Single().CreatedAt, result.CreatedAt);
        Assert.False(result.IsCompleted);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task CreateAsync_WithEmptyTitle_ThrowsArgumentException(string title)
    {
        var service = new TodoService(new FakeTodoRepository());

        var action = () => service.CreateAsync(new CreateTodoRequest { Title = title });

        var exception = await Assert.ThrowsAsync<ArgumentException>(action);
        Assert.Equal("request", exception.ParamName);
    }

    [Fact]
    public async Task GetByIdAsync_WhenItemExists_ReturnsMappedResponse()
    {
        var existing = new TodoItem
        {
            Id = Guid.NewGuid(),
            Title = "Read book",
            IsCompleted = true,
            CreatedAt = DateTime.UtcNow.AddHours(-2)
        };

        var repository = new FakeTodoRepository { ItemById = existing };
        var service = new TodoService(repository);

        var result = await service.GetByIdAsync(existing.Id);

        Assert.NotNull(result);
        Assert.Equal(existing.Id, result!.Id);
        Assert.Equal(existing.Title, result.Title);
        Assert.Equal(existing.IsCompleted, result.IsCompleted);
        Assert.Equal(existing.CreatedAt, result.CreatedAt);
    }

    [Fact]
    public async Task DeleteAsync_DelegatesToRepositoryAndReturnsResult()
    {
        var repository = new FakeTodoRepository { DeleteResult = true };
        var service = new TodoService(repository);
        var id = Guid.NewGuid();

        var result = await service.DeleteAsync(id);

        Assert.True(result);
        Assert.Equal(id, repository.LastDeletedId);
    }

    [Fact]
    public async Task GetAllAsync_ReturnsMappedResponses()
    {
        var items = new List<TodoItem>
        {
            new() { Id = Guid.NewGuid(), Title = "A", IsCompleted = false, CreatedAt = DateTime.UtcNow.AddMinutes(-10) },
            new() { Id = Guid.NewGuid(), Title = "B", IsCompleted = true, CreatedAt = DateTime.UtcNow.AddMinutes(-5) }
        };

        var repository = new FakeTodoRepository { AllItems = items };
        var service = new TodoService(repository);

        var result = await service.GetAllAsync();

        Assert.Equal(2, result.Count);
        Assert.Equal(items[0].Id, result[0].Id);
        Assert.Equal(items[0].Title, result[0].Title);
        Assert.Equal(items[1].IsCompleted, result[1].IsCompleted);
    }

    [Fact]
    public async Task GetAllAsync_ForwardsCancellationTokenToRepository()
    {
        using var cts = new CancellationTokenSource();
        var token = cts.Token;
        var repository = new FakeTodoRepository();
        var service = new TodoService(repository);

        await service.GetAllAsync(token);

        Assert.Equal(token, repository.LastGetAllCancellationToken);
    }

    private sealed class FakeTodoRepository : ITodoRepository
    {
        public List<TodoItem> AllItems { get; set; } = new();
        public TodoItem? ItemById { get; set; }
        public bool DeleteResult { get; set; }
        public Guid LastDeletedId { get; private set; }
        public CancellationToken LastGetAllCancellationToken { get; private set; }
        public List<TodoItem> AddedItems { get; } = new();

        public Task<List<TodoItem>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            LastGetAllCancellationToken = cancellationToken;
            return Task.FromResult(AllItems);
        }

        public Task<TodoItem> AddAsync(TodoItem item, CancellationToken cancellationToken = default)
        {
            AddedItems.Add(item);
            return Task.FromResult(item);
        }

        public Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
        {
            LastDeletedId = id;
            return Task.FromResult(DeleteResult);
        }

        public Task<TodoItem?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
            => Task.FromResult(ItemById);
    }
}
