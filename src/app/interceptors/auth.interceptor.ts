import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private message: NzMessageService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Obtener el token del localStorage
    const token = localStorage.getItem('authToken');
    
    // Clonar la solicitud y agregar el token de autenticación si existe
    if (token) {
      request = request.clone({
        setHeaders: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Manejar errores de autenticación
        if (error.status === 401) {
          this.message.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
          localStorage.removeItem('authToken');
          this.router.navigate(['/auth/login']);
        }
        return throwError(() => error);
      })
    );
  }
}
