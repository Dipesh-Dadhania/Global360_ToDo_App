import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CreateTodoRequest, Todo, UpdateTodoRequest } from '../models/todo';

@Injectable({
  providedIn: 'root',
})
export class TodoApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/todos`;

  getTodos(): Observable<Todo[]> {
    return this.http.get<Todo[]>(this.baseUrl);
  }

  addTodo(request: CreateTodoRequest): Observable<Todo> {
    return this.http.post<Todo>(this.baseUrl, request);
  }

  updateTodo(id: string, request: UpdateTodoRequest): Observable<Todo> {
    return this.http.put<Todo>(`${this.baseUrl}/${id}`, request);
  }

  markAsCompleted(id: string, isCompleted: boolean): Observable<Todo> {
    return this.http.put<Todo>(`${this.baseUrl}/${id}/mark-as-completed?isCompleted=${isCompleted}`, {});
  }

  deleteTodo(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
