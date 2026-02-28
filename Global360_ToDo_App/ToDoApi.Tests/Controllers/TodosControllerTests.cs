using Microsoft.AspNetCore.Mvc;
using Moq;
using TodoApi.Controllers;
using TodoApi.DTOs;
using TodoApi.Services;
using Xunit;

namespace TodoApi.Tests.Controllers;

public class TodosControllerTests
{
    private readonly Mock<ITodoService> _serviceMock;
    private readonly TodosController _controller;

    public TodosControllerTests()
    {
        _serviceMock = new Mock<ITodoService>();
        _controller = new TodosController(_serviceMock.Object);
    }

    [Fact]
    public async Task GetAll_ReturnsOkWithList()
    {
        var list = new List<TodoResponse> { new() { Id = Guid.NewGuid(), Title = "A", CreatedAt = DateTime.UtcNow } };
        _serviceMock.Setup(s => s.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(list);

        var result = await _controller.GetAll(CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result);
        var body = Assert.IsAssignableFrom<IEnumerable<TodoResponse>>(ok.Value);
        Assert.Single(body);
    }

    [Fact]
    public async Task GetById_WhenExists_ReturnsOk()
    {
        var response = new TodoResponse { Id = Guid.NewGuid(), Title = "Item", CreatedAt = DateTime.UtcNow };
        _serviceMock.Setup(s => s.GetByIdAsync(response.Id, It.IsAny<CancellationToken>())).ReturnsAsync(response);

        var result = await _controller.GetById(response.Id, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result);
        var value = Assert.IsType<TodoResponse>(ok.Value);
        Assert.Equal(response.Id, value.Id);
        Assert.Equal(response.Title, value.Title);
    }

    [Fact]
    public async Task GetById_WhenNotExists_ReturnsNotFound()
    {
        var id = Guid.NewGuid();
        _serviceMock.Setup(s => s.GetByIdAsync(id, It.IsAny<CancellationToken>())).ReturnsAsync((TodoResponse?)null);

        var result = await _controller.GetById(id, CancellationToken.None);

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task Create_ReturnsCreatedWithLocation()
    {
        var request = new CreateTodoRequest { Title = "New" };
        var created = new TodoResponse { Id = Guid.NewGuid(), Title = "New", CreatedAt = DateTime.UtcNow };
        _serviceMock.Setup(s => s.CreateAsync(request, It.IsAny<CancellationToken>())).ReturnsAsync(created);

        var result = await _controller.Create(request, CancellationToken.None);

        var createdResult = Assert.IsType<CreatedAtActionResult>(result);
        Assert.Equal(nameof(TodosController.GetById), createdResult.ActionName);
        Assert.Equal(created.Id, (Guid)(createdResult.RouteValues!["id"]!));
        var value = Assert.IsType<TodoResponse>(createdResult.Value);
        Assert.Equal(created.Id, value.Id);
        Assert.Equal(created.Title, value.Title);
    }

    [Fact]
    public async Task Delete_WhenExists_ReturnsNoContent()
    {
        var id = Guid.NewGuid();
        _serviceMock.Setup(s => s.DeleteAsync(id, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var result = await _controller.Delete(id, CancellationToken.None);

        Assert.IsType<NoContentResult>(result);
    }

    [Fact]
    public async Task Delete_WhenNotExists_ReturnsNotFound()
    {
        var id = Guid.NewGuid();
        _serviceMock.Setup(s => s.DeleteAsync(id, It.IsAny<CancellationToken>())).ReturnsAsync(false);

        var result = await _controller.Delete(id, CancellationToken.None);

        Assert.IsType<NotFoundResult>(result);
    }
}
