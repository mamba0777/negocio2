import { Injectable, inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
  HttpStatusCode,
  HttpEventType
} from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AuthService } from '../services/auth.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private authService = inject(AuthService);
  private message = inject(NzMessageService);
  private router = inject(Router);
  
  // URLs que no deben mostrar mensajes de error
  private silentErrorUrls = [
    '/auth/check-email',
    '/auth/check-username'
  ];

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Verificar si la URL actual debe tener errores silenciosos
    const isSilentError = this.silentErrorUrls.some(url => request.url.includes(url));
    
    return next.handle(request).pipe(
      tap(event => {
        // Opcional: Aquí puedes manejar respuestas exitosas si es necesario
        if (event.type === HttpEventType.Response) {
          // Por ejemplo, podrías loguear respuestas exitosas
        }
      }),
      catchError((error: HttpErrorResponse) => {
        // Si es un error silencioso, simplemente lo propagamos sin mostrar mensaje
        if (isSilentError) {
          return throwError(() => error);
        }

        // Determinar el mensaje de error basado en el tipo de error
        const errorMessage = this.getErrorMessage(error);
        
        // Mostrar mensaje de error al usuario (excepto para ciertos códigos de estado)
        if (!this.shouldSkipErrorNotification(error.status)) {
          this.showErrorMessage(errorMessage, error.status);
        }
        
        // Manejar errores específicos
        this.handleSpecificErrors(error);
        
        // Propagar el error para que los servicios puedan manejarlo también
        return throwError(() => error);
      })
    );
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    // Si el error es una instancia de ErrorEvent, es un error del lado del cliente
    if (error.error instanceof ErrorEvent) {
      console.error('Error del cliente:', error.error.message);
      return `Error: ${error.error.message}`;
    }
    
    // Error del servidor
    console.error(`Error del servidor: ${error.status} - ${error.message}`, error.error);
    
    // Intentar obtener el mensaje de error del backend
    const serverError = this.getServerErrorMessage(error);
    if (serverError) return serverError;
    
    // Mensajes predeterminados basados en el código de estado HTTP
    switch (error.status) {
      case 0:
        return 'No se pudo conectar al servidor. Verifica tu conexión a Internet o inténtalo más tarde.';
      case HttpStatusCode.BadRequest:
        return 'Solicitud incorrecta. Verifica los datos e inténtalo de nuevo.';
      case HttpStatusCode.Unauthorized:
        return 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
      case HttpStatusCode.Forbidden:
        return 'No tienes permisos para realizar esta acción.';
      case HttpStatusCode.NotFound:
        return 'El recurso solicitado no fue encontrado.';
      case HttpStatusCode.Conflict:
        return 'Conflicto: El recurso ya existe o hay un problema con los datos.';
      case HttpStatusCode.TooManyRequests:
        return 'Demasiadas solicitudes. Por favor, espera un momento antes de intentar de nuevo.';
      case HttpStatusCode.InternalServerError:
        return 'Error interno del servidor. Por favor, inténtalo más tarde.';
      case HttpStatusCode.ServiceUnavailable:
        return 'El servicio no está disponible en este momento. Por favor, inténtalo más tarde.';
      case HttpStatusCode.GatewayTimeout:
        return 'El servidor está tardando demasiado en responder. Por favor, inténtalo más tarde.';
      default:
        return error.message || 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.';
    }
  }

  private getServerErrorMessage(error: HttpErrorResponse): string | null {
    // Intentar obtener el mensaje de error del backend
    if (!error.error) return null;
    
    // Si el error es un string, devolverlo directamente
    if (typeof error.error === 'string') {
      return error.error;
    }
    
    // Si el error tiene una propiedad 'message'
    if (error.error.message) {
      return error.error.message;
    }
    
    // Si el error tiene una propiedad 'error' que es un string
    if (typeof error.error.error === 'string') {
      return error.error.error;
    }
    
    // Si el error es un array de errores de validación
    if (Array.isArray(error.error.errors)) {
      return error.error.errors.map((e: any) => e.msg || e.message || e).join('\n');
    }
    
    // Si no se pudo determinar un mensaje de error específico
    return null;
  }

  private shouldSkipErrorNotification(status: number): boolean {
    // No mostrar notificación para estos códigos de estado
    const skipStatuses = [
      HttpStatusCode.Unauthorized, // Ya se maneja en el interceptor de autenticación
      HttpStatusCode.NotFound,     // Puede ser molesto para el usuario
      HttpStatusCode.Forbidden     // Ya se maneja en el interceptor de autenticación
    ];
    
    return skipStatuses.includes(status);
  }

  private showErrorMessage(message: string, status?: number): void {
    // Mostrar mensaje de error con duración basada en la gravedad
    const duration = status && status >= 500 ? 10000 : 5000;
    
    this.message.error(message, { 
      nzDuration: duration,
      nzPauseOnHover: true
    });
  }

  private handleSpecificErrors(error: HttpErrorResponse): void {
    switch (error.status) {
      case HttpStatusCode.Unauthorized:
        // El interceptor de autenticación ya maneja el cierre de sesión
        break;
        
      case HttpStatusCode.Forbidden:
        // Opcional: Redirigir a una página de acceso denegado
        // this.router.navigate(['/access-denied']);
        break;
        
      case HttpStatusCode.NotFound:
        // Opcional: Redirigir a una página 404 personalizada
        // this.router.navigate(['/not-found']);
        break;
        
      case HttpStatusCode.InternalServerError:
        // Opcional: Reportar el error a un servicio de monitoreo
        // this.reportErrorToMonitoringService(error);
        break;
    }
  }
}
