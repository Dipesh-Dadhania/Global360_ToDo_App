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
        var item = new TodoItem { Title = "Test", Description = "Test description", Id = Guid.NewGuid(), CreatedAt = DateTime.UtcNow };
        await _repository.AddAsync(item);
        var all = await _repository.GetAllAsync();
        Assert.Single(all);
        Assert.Equal(item.Id, all[0].Id);
        Assert.Equal("Test", all[0].Title);
        Assert.Equal("Test description", all[0].Description);
    }

    [Fact]
    public async Task GetByIdAsync_WhenExists_ReturnsItem()
    {
        var item = new TodoItem { Title = "Test", Description = "Desc", Id = Guid.NewGuid(), CreatedAt = DateTime.UtcNow };
        await _repository.AddAsync(item);
        var found = await _repository.GetByIdAsync(item.Id);
        Assert.NotNull(found);
        Assert.Equal(item.Id, found.Id);
        Assert.Equal("Desc", found.Description);
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
        var item = new TodoItem { Title = "To delete", Description = "To delete desc", Id = Guid.NewGuid(), CreatedAt = DateTime.UtcNow };
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
    public async Task UpdateAsync_WhenExists_UpdatesTitleAndDescriptionOnly()
    {
        var item = new TodoItem
        {
            Title = "Old title",
            Description = "Old description",
            Id = Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow,
            IsCompleted = true
        };
        await _repository.AddAsync(item);

        var updated = await _repository.UpdateAsync(item.Id, "New title", "New description");

        Assert.NotNull(updated);
        Assert.Equal("New title", updated!.Title);
        Assert.Equal("New description", updated.Description);
        Assert.True(updated.IsCompleted);
    }

    [Fact]
    public async Task UpdateAsync_WhenNotExists_ReturnsNull()
    {
        var updated = await _repository.UpdateAsync(Guid.NewGuid(), "Any title", "Any description");

        Assert.Null(updated);
    }

    [Fact]
    public async Task MarkAsCompletedAsync_WhenExists_UpdatesCompletionOnly()
    {
        var item = new TodoItem { Title = "Old", Description = "Old desc", Id = Guid.NewGuid(), CreatedAt = DateTime.UtcNow, IsCompleted = false };
        await _repository.AddAsync(item);

        var updated = await _repository.MarkAsCompletedAsync(item.Id, true);

        Assert.NotNull(updated);
        Assert.Equal("Old", updated!.Title);
        Assert.Equal("Old desc", updated.Description);
        Assert.True(updated.IsCompleted);
    }
}
