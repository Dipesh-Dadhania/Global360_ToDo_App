import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateTodoRequest, ToDo, UpdateTodoRequest } from '../models/todo';

@Injectable({
  providedIn: 'root',
})
export class TodoApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/todos`;

  getTodos(): Observable<ToDo[]> {
    return this.http.get<ToDo[]>(this.baseUrl);
  }

  addTodo(request: CreateTodoRequest): Observable<ToDo> {
    return this.http.post<ToDo>(this.baseUrl, request);
  }

  updateTodo(id: string, request: UpdateTodoRequest): Observable<ToDo> {
    return this.http.put<ToDo>(`${this.baseUrl}/${id}`, request);
  }

  markAsCompleted(id: string, isCompleted: boolean): Observable<ToDo> {
    return this.http.put<ToDo>(`${this.baseUrl}/${id}/mark-as-completed?isCompleted=${isCompleted}`, {});
  }

  deleteTodo(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
