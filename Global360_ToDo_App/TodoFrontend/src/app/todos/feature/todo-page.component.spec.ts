import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { TodoApiService } from '../data-access/todo-api.service';
import { TodoPageComponent } from './todo-page.component';
import { CreateTodoRequest, ToDo } from '../models/todo';

class TodoApiServiceMock {
  getTodos() {
    return of<ToDo[]>([
      {
        id: '1',
        title: 'First',
        description: 'First description',
        isCompleted: false,
        createdAt: '2026-02-28T10:00:00Z',
      },
    ]);
  }

  addTodo(request: CreateTodoRequest) {
    return of<ToDo>({
      id: '2',
      title: request.title,
      description: request.description,
      isCompleted: false,
      createdAt: '2026-02-28T11:00:00Z',
    });
  }

  deleteTodo(_id: string) {
    return of(void 0);
  }
}

describe('TodoPageComponent', () => {
  let fixture: ComponentFixture<TodoPageComponent>;
  let component: TodoPageComponent;
  let service: TodoApiService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TodoPageComponent],
      providers: [{ provide: TodoApiService, useClass: TodoApiServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(TodoPageComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(TodoApiService);
    fixture.detectChanges();
  });

  it('loads and renders todo items', () => {
    const listItems = fixture.debugElement.queryAll(By.css('.todo-list li'));
    expect(listItems.length).toBe(1);
    expect(listItems[0].nativeElement.textContent).toContain('First');
  });

  it('adds a todo item', () => {
    component.titleControl.setValue('Second');
    component.descriptionControl.setValue('Second description');
    fixture.debugElement.query(By.css('form')).triggerEventHandler('ngSubmit');
    fixture.detectChanges();

    const listItems = fixture.debugElement.queryAll(By.css('.todo-list li'));
    expect(listItems.length).toBe(2);
    expect(listItems[0].nativeElement.textContent).toContain('Second');
  });

  it('deletes a todo item', () => {
    const deleteSpy = vi.spyOn(service, 'deleteTodo');
    const event = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as Event;

    component.deleteTodo(event, '1');
    fixture.detectChanges();

    expect(deleteSpy).toHaveBeenCalledWith('1');
    const emptyStateHeading = fixture.debugElement.query(By.css('.empty-thinking h2'));
    expect(emptyStateHeading.nativeElement.textContent).toContain('Nothing here yet');
  });

  it('separates active and checked todos', () => {
    component.todos.set([
      {
        id: '1',
        title: 'Active',
        description: 'Active description',
        isCompleted: false,
        createdAt: '2026-03-01T09:00:00Z',
      },
      {
        id: '2',
        title: 'Checked',
        description: 'Checked description',
        isCompleted: true,
        createdAt: '2026-03-01T08:00:00Z',
      },
    ]);
    fixture.detectChanges();

    expect(component.filteredUncheckedTodos().length).toBe(1);
    expect(component.filteredCheckedTodos().length).toBe(1);
  });

  it('paginates active todos with page size 5', () => {
    const items: ToDo[] = Array.from({ length: 7 }, (_, index) => ({
      id: `${index + 1}`,
      title: `Task ${index + 1}`,
      description: `Description ${index + 1}`,
      isCompleted: false,
      createdAt: `2026-03-01T0${index}:00:00Z`,
    }));

    component.todos.set(items);
    fixture.detectChanges();

    expect(component.activeTotalPages()).toBe(2);
    expect(component.pagedUncheckedTodos().length).toBe(5);

    component.goToNextActivePage();

    expect(component.activePageNumber()).toBe(2);
    expect(component.pagedUncheckedTodos().length).toBe(2);
  });
});
