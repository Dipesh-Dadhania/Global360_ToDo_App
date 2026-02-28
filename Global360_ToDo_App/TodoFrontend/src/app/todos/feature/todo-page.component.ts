import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { TodoApiService } from '../data-access/todo-api.service';
import { Todo } from '../models/todo';

@Component({
  selector: 'app-todo-page',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './todo-page.component.html',
  styleUrl: './todo-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TodoPageComponent {
  private readonly todoApiService = inject(TodoApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly titleControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(200)],
  });

  readonly todoForm = new FormGroup({
    title: this.titleControl,
  });

  readonly todos = signal<Todo[]>([]);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly deletingTodoIds = signal<Set<string>>(new Set());
  readonly updatingTodoIds = signal<Set<string>>(new Set());
  readonly errorMessage = signal('');
  readonly hasSubmitted = signal(false);

  ngOnInit(): void {
    this.loadTodos();
  }

  addTodo(): void {
    this.hasSubmitted.set(true);

    if (this.todoForm.invalid || this.isSaving()) {
      this.titleControl.markAsTouched();
      return;
    }

    const title = this.titleControl.value.trim();
    if (!title) {
      this.titleControl.setErrors({ required: true });
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');

    this.todoApiService
      .addTodo({ title })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSaving.set(false)),
      )
      .subscribe({
        next: (createdTodo) => {
          this.todos.update((currentTodos) => this.sortTodos([createdTodo, ...currentTodos]));
          this.todoForm.reset({ title: '' });
          this.hasSubmitted.set(false);
        },
        error: () => {
          this.errorMessage.set('Unable to add todo item. Please try again.');
        },
      });
  }

  deleteTodo(event: Event, id: string): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.deletingTodoIds().has(id)) {
      return;
    }

    this.errorMessage.set('');
    this.deletingTodoIds.update((currentSet) => new Set(currentSet).add(id));

    this.todoApiService
      .deleteTodo(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.deletingTodoIds.update((currentSet) => {
            const nextSet = new Set(currentSet);
            nextSet.delete(id);
            return nextSet;
          });
        }),
      )
      .subscribe({
        next: () => {
          this.todos.update((currentTodos) => currentTodos.filter((todo) => todo.id !== id));
        },
        error: () => {
          this.errorMessage.set('Unable to delete todo item. Please try again.');
        },
      });
  }

  setTodoCompleted(id: string, isCompleted: boolean): void {
    if (this.updatingTodoIds().has(id)) {
      return;
    }

    const todo = this.todos().find((item) => item.id === id);
    if (!todo || todo.isCompleted === isCompleted) {
      return;
    }

    this.errorMessage.set('');
    this.updatingTodoIds.update((currentSet) => new Set(currentSet).add(id));

    this.todoApiService
      .markAsCompleted(id, isCompleted)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.updatingTodoIds.update((currentSet) => {
            const nextSet = new Set(currentSet);
            nextSet.delete(id);
            return nextSet;
          });
        }),
      )
      .subscribe({
        next: (updatedTodo) => {
          this.todos.update((currentTodos) =>
            this.sortTodos(
              currentTodos.map((currentTodo) =>
                currentTodo.id === updatedTodo.id ? updatedTodo : currentTodo,
              ),
            ),
          );
        },
        error: () => {
          this.errorMessage.set('Unable to update todo item. Please try again.');
        },
      });
  }

  getCheckedState(event: Event): boolean {
    return (event.target as HTMLInputElement).checked;
  }

  trackById(index: number, todo: Todo): string {
    return todo.id;
  }

  private loadTodos(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.todoApiService
      .getTodos()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (todos) => {
          this.todos.set(this.sortTodos(todos));
        },
        error: () => {
          this.errorMessage.set('Unable to load todo items. Please ensure the API is running.');
        },
      });
  }

  private sortTodos(todos: Todo[]): Todo[] {
    return [...todos].sort((first, second) => {
      if (first.isCompleted !== second.isCompleted) {
        return first.isCompleted ? 1 : -1;
      }

      return second.createdAt.localeCompare(first.createdAt);
    });
  }
}
