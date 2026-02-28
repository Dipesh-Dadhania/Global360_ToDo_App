import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { TodoApiService } from './todo-api.service';
import { ToDo } from '../models/todo';

describe('TodoApiService', () => {
  let service: TodoApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(TodoApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('fetches todos', () => {
    const response: ToDo[] = [
      {
        id: '0f6f808d-b95a-49a7-ae79-916267f73e7f',
        title: 'Test item',
        description: 'Test description',
        isCompleted: false,
        createdAt: '2026-02-28T10:00:00Z',
      },
    ];

    service.getTodos().subscribe((todos) => {
      expect(todos).toEqual(response);
    });

    const request = httpTestingController.expectOne('/api/todos');
    expect(request.request.method).toBe('GET');
    request.flush(response);
  });

  it('creates a todo', () => {
    const response: ToDo = {
      id: '0f6f808d-b95a-49a7-ae79-916267f73e7f',
      title: 'New task',
      description: 'New description',
      isCompleted: false,
      createdAt: '2026-02-28T10:00:00Z',
    };

    service.addTodo({ title: 'New task', description: 'New description' }).subscribe((todo) => {
      expect(todo).toEqual(response);
    });

    const request = httpTestingController.expectOne('/api/todos');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ title: 'New task', description: 'New description' });
    request.flush(response);
  });

  it('deletes a todo', () => {
    service.deleteTodo('0f6f808d-b95a-49a7-ae79-916267f73e7f').subscribe(() => {
      expect(true).toBe(true);
    });

    const request = httpTestingController.expectOne('/api/todos/0f6f808d-b95a-49a7-ae79-916267f73e7f');
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });
  });
});
