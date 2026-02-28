using TodoApi.Models;
using TodoApi.Repositories;
using Xunit;

namespace TodoApi.Tests.Repositories;

public class InMemoryTodoRepositoryTests
{
    private readonly InMemoryTodoRepository _repository = new();

    [Fact]
    public async Task GetAllAsync_Initially_ReturnsEmpty()
    {
        var result = await _repository.GetAllAsync();
        Assert.Empty(result);
    }

    [Fact]
    public async Task AddAsync_AddsItem_GetAllReturnsIt()
    {
        var item = new TodoItem { Title = "Test", Id = Guid.NewGuid(), CreatedAt = DateTime.UtcNow };
        await _repository.AddAsync(item);
        var all = await _repository.GetAllAsync();
        Assert.Single(all);
        Assert.Equal(item.Id, all[0].Id);
        Assert.Equal("Test", all[0].Title);
    }

    [Fact]
    public async Task GetByIdAsync_WhenExists_ReturnsItem()
    {
        var item = new TodoItem { Title = "Test", Id = Guid.NewGuid(), CreatedAt = DateTime.UtcNow };
        await _repository.AddAsync(item);
        var found = await _repository.GetByIdAsync(item.Id);
        Assert.NotNull(found);
        Assert.Equal(item.Id, found.Id);
    }

    [Fact]
    public async Task GetByIdAsync_WhenNotExists_ReturnsNull()
    {
        var found = await _repository.GetByIdAsync(Guid.NewGuid());
        Assert.Null(found);
    }

    [Fact]
    public async Task DeleteAsync_WhenExists_ReturnsTrue_AndItemRemoved()
    {
        var item = new TodoItem { Title = "To delete", Id = Guid.NewGuid(), CreatedAt = DateTime.UtcNow };
        await _repository.AddAsync(item);
        var deleted = await _repository.DeleteAsync(item.Id);
        Assert.True(deleted);
        var all = await _repository.GetAllAsync();
        Assert.Empty(all);
    }

    [Fact]
    public async Task DeleteAsync_WhenNotExists_ReturnsFalse()
    {
        var deleted = await _repository.DeleteAsync(Guid.NewGuid());
        Assert.False(deleted);
    }

    [Fact]
    public async Task UpdateTitleAsync_WhenExists_UpdatesTitleOnly()
    {
        var item = new TodoItem
        {
            Title = "Old title",
            Id = Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow,
            IsCompleted = true
        };
        await _repository.AddAsync(item);

        var updated = await _repository.UpdateTitleAsync(item.Id, "New title");

        Assert.NotNull(updated);
        Assert.Equal("New title", updated!.Title);
        Assert.True(updated.IsCompleted);
    }

    [Fact]
    public async Task UpdateTitleAsync_WhenNotExists_ReturnsNull()
    {
        var updated = await _repository.UpdateTitleAsync(Guid.NewGuid(), "Any title");

        Assert.Null(updated);
    }

    [Fact]
    public async Task MarkAsCompletedAsync_WhenExists_UpdatesCompletionOnly()
    {
        var item = new TodoItem { Title = "Old", Id = Guid.NewGuid(), CreatedAt = DateTime.UtcNow, IsCompleted = false };
        await _repository.AddAsync(item);

        var updated = await _repository.MarkAsCompletedAsync(item.Id, true);

        Assert.NotNull(updated);
        Assert.Equal("Old", updated!.Title);
        Assert.True(updated.IsCompleted);
    }
}
