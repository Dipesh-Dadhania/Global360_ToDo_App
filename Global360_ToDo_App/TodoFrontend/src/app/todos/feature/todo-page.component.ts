import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TodoApiService } from '../data-access/todo-api.service';
import { ToDo } from '../models/todo';

@Component({
  selector: 'app-todo-page',
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './todo-page.component.html',
  styleUrl: './todo-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TodoPageComponent {
  private readonly todoApiService = inject(TodoApiService);
  private readonly destroyRef = inject(DestroyRef);
  private successTimeoutId: ReturnType<typeof setTimeout> | null = null;

  readonly titleControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(200)],
  });
  readonly descriptionControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.maxLength(500)],
  });

  readonly todoForm = new FormGroup({
    title: this.titleControl,
    description: this.descriptionControl,
  });

  readonly todos = signal<ToDo[]>([]);
  readonly searchText = signal('');
  readonly hasTodos = computed(() => this.todos().length > 0);
  readonly hasSearchQuery = computed(() => this.searchText().trim().length > 0);
  readonly filteredTodos = computed(() => {
    const search = this.searchText().trim().toLowerCase();
    if (!search) {
      return this.todos();
    }

    return this.todos().filter((todo) =>
      `${todo.title} ${todo.description}`
        .toLowerCase()
        .split(/\s+/)
        .some((word) => word.startsWith(search)),
    );
  });
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly deletingTodoIds = signal<Set<string>>(new Set());
  readonly updatingTodoIds = signal<Set<string>>(new Set());
  readonly expandedTodoIds = signal<Set<string>>(new Set());
  readonly editingTodoId = signal<string | null>(null);
  readonly isUpdatingTitle = signal(false);
  readonly editTitleControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(200)],
  });
  readonly editDescriptionControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.maxLength(500)],
  });
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
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

    const description = this.descriptionControl.value.trim();

    this.todoApiService
      .addTodo({ title, description })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSaving.set(false)),
      )
      .subscribe({
        next: (createdTodo) => {
          const normalizedCreatedTodo = this.normalizeTodo(createdTodo, description);
          this.todos.update((currentTodos) => this.sortTodos([normalizedCreatedTodo, ...currentTodos]));
          this.todoForm.reset({ title: '', description: '' });
          this.hasSubmitted.set(false);
        },
        error: () => {
          this.errorMessage.set('Unable to add To-Do item. Please try again.');
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
          this.todos.update((currentTodos) => {
            const nextTodos = currentTodos.filter((todo) => todo.id !== id);
            if (nextTodos.length === 0) {
              this.clearSearch();
            }

            return nextTodos;
          });
          this.expandedTodoIds.update((currentSet) => {
            const nextSet = new Set(currentSet);
            nextSet.delete(id);
            return nextSet;
          });
          this.showSuccess('To-Do item successfully deleted.');
        },
        error: () => {
          this.errorMessage.set('Unable to delete To-Do item. Please try again.');
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
                currentTodo.id === updatedTodo.id
                  ? this.normalizeTodo(updatedTodo, currentTodo.description)
                  : currentTodo,
              ),
            ),
          );
        },
        error: () => {
          this.errorMessage.set('Unable to update To-Do item. Please try again.');
        },
      });
  }

  startEditing(todo: ToDo): void {
    if (this.isUpdatingTitle()) {
      return;
    }

    this.editingTodoId.set(todo.id);
    this.editTitleControl.setValue(todo.title);
    this.editDescriptionControl.setValue(todo.description ?? '');
    this.editTitleControl.markAsPristine();
    this.editTitleControl.markAsUntouched();
    this.editDescriptionControl.markAsPristine();
    this.editDescriptionControl.markAsUntouched();
  }

  cancelEditing(): void {
    this.editingTodoId.set(null);
    this.editTitleControl.reset('', { emitEvent: false });
    this.editDescriptionControl.reset('', { emitEvent: false });
  }

  saveEditedTodo(id: string): void {
    if (this.isUpdatingTitle()) {
      return;
    }

    const todo = this.todos().find((item) => item.id === id);
    if (!todo) {
      this.cancelEditing();
      return;
    }

    if (this.editTitleControl.invalid) {
      this.editTitleControl.markAsTouched();
      return;
    }

    const title = this.editTitleControl.value.trim();
    const description = this.editDescriptionControl.value.trim();
    if (!title) {
      this.editTitleControl.setErrors({ required: true });
      this.editTitleControl.markAsTouched();
      return;
    }

    if (title === todo.title && description === (todo.description ?? '')) {
      this.cancelEditing();
      return;
    }

    this.errorMessage.set('');
    this.isUpdatingTitle.set(true);

    this.todoApiService
      .updateTodo(id, { title, description })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isUpdatingTitle.set(false)),
      )
      .subscribe({
        next: (updatedTodo) => {
          const normalizedUpdatedTodo = this.normalizeTodo(updatedTodo, description);
          this.todos.update((currentTodos) =>
            this.sortTodos(
              currentTodos.map((currentTodo) =>
                currentTodo.id === normalizedUpdatedTodo.id ? normalizedUpdatedTodo : currentTodo,
              ),
            ),
          );
          this.cancelEditing();
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 404 || error.status === 405) {
            this.errorMessage.set('Edit endpoint not available. Please restart ToDoApi and try again.');
            return;
          }

          this.errorMessage.set('Unable to edit To-Do item. Please try again.');
        },
      });
  }

  isEditing(todoId: string): boolean {
    return this.editingTodoId() === todoId;
  }

  toggleDescription(id: string): void {
    this.expandedTodoIds.update((currentSet) => {
      const nextSet = new Set(currentSet);
      if (nextSet.has(id)) {
        nextSet.delete(id);
      } else {
        nextSet.add(id);
      }

      return nextSet;
    });
  }

  isDescriptionExpanded(id: string): boolean {
    return this.expandedTodoIds().has(id);
  }

  getCheckedState(event: Event): boolean {
    return (event.target as HTMLInputElement).checked;
  }

  trackById(index: number, todo: ToDo): string {
    return todo.id;
  }

  onSearchInput(event: Event): void {
    this.searchText.set((event.target as HTMLInputElement).value);
  }

  clearSearch(): void {
    this.searchText.set('');
  }

  getHighlightedText(value: string): string {
    const search = this.searchText().trim();
    if (!search) {
      return this.escapeHtml(value);
    }

    const pattern = new RegExp(`\\b${this.escapeRegExp(search)}`, 'gi');
    let result = '';
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    match = pattern.exec(value);
    while (match) {
      const start = match.index;
      const end = start + match[0].length;

      result += this.escapeHtml(value.slice(lastIndex, start));
      result += `<mark class="todo-highlight">${this.escapeHtml(value.slice(start, end))}</mark>`;

      lastIndex = end;
      if (pattern.lastIndex === match.index) {
        pattern.lastIndex++;
      }

      match = pattern.exec(value);
    }

    result += this.escapeHtml(value.slice(lastIndex));
    return result;
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
          this.todos.set(this.sortTodos(todos.map((todo) => this.normalizeTodo(todo))));
          if (todos.length === 0) {
            this.clearSearch();
          }
        },
        error: () => {
          this.errorMessage.set('Unable to load To-Do items. Please ensure the API is running.');
        },
      });
  }

  private sortTodos(todos: ToDo[]): ToDo[] {
    return [...todos].sort((first, second) => {
      if (first.isCompleted !== second.isCompleted) {
        return first.isCompleted ? 1 : -1;
      }

      return second.createdAt.localeCompare(first.createdAt);
    });
  }

  private showSuccess(message: string): void {
    if (this.successTimeoutId) {
      clearTimeout(this.successTimeoutId);
    }

    this.successMessage.set(message);
    this.successTimeoutId = setTimeout(() => {
      this.successMessage.set('');
      this.successTimeoutId = null;
    }, 3000);
  }

  private normalizeTodo(todo: ToDo, fallbackDescription: string = ''): ToDo {
    return {
      ...todo,
      description: (todo.description ?? fallbackDescription).trim(),
    };
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
