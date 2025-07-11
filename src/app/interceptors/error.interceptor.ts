import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
  HttpStatusCode
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private message: NzMessageService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'Ocurrió un error inesperado. Por favor, intente nuevamente.';
        
        if (error.error instanceof ErrorEvent) {
          // Error del lado del cliente
          console.error('Error del cliente:', error.error.message);
          errorMessage = `Error: ${error.error.message}`;
        } else {
          // Error del servidor
          console.error(`Código de error: ${error.status}, Mensaje: ${error.message}`);
          
          switch (error.status) {
            case 0:
              errorMessage = 'No se pudo conectar al servidor. Verifica tu conexión a Internet.';
              break;
            case HttpStatusCode.Unauthorized:
              errorMessage = 'No autorizado. Por favor, inicia sesión nuevamente.';
              // Redirigir al login
              this.router.navigate(['/login']);
              break;
            case HttpStatusCode.Forbidden:
              errorMessage = 'No tienes permisos para realizar esta acción.';
              break;
            case HttpStatusCode.NotFound:
              errorMessage = 'El recurso solicitado no fue encontrado.';
              break;
            case HttpStatusCode.InternalServerError:
              errorMessage = 'Error interno del servidor. Por favor, intente más tarde.';
              break;
            case HttpStatusCode.ServiceUnavailable:
              errorMessage = 'El servicio no está disponible en este momento. Por favor, intente más tarde.';
              break;
            default:
              // Intentar obtener el mensaje de error del backend
              if (error.error && error.error.message) {
                errorMessage = error.error.message;
              } else if (error.statusText) {
                errorMessage = error.statusText;
              }
              break;
          }
        }
        
        // Mostrar mensaje de error al usuario
        this.message.error(errorMessage, { nzDuration: 5000 });
        
        // Propagar el error para que los servicios puedan manejarlo también
        return throwError(() => error);
      })
    );
  }
}
