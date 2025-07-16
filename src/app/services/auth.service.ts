import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError, of, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, tap, finalize, map } from 'rxjs/operators';
import { NzMessageService } from 'ng-zorro-antd/message';
import { User, UserRole, ROLES, LoginCredentials, RegisterData, AuthResponse } from '../models/user.types';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'https://api.escuelajs.co/api/v1';
  private readonly AUTH_URL = 'https://api.escuelajs.co/api/v1/auth';

  // Métodos de autorización
  
  // Señal para el usuario actual
  private currentUserSignal = signal<User | null>(null);
  private _isAuthenticatedSignal = signal<boolean>(false);
  private tokenExpirationTimer: any = null;
  private isLoading = signal<boolean>(false);
  private _currentUser$ = new BehaviorSubject<User | null>(null);

  // Exponer señales de solo lectura
  user = this.currentUserSignal.asReadonly();
  loggedIn = computed(() => this._isAuthenticatedSignal());
  
  // Observable público para suscripciones a cambios de usuario
  get currentUser$() {
    return this._currentUser$.asObservable();
  }

  // Métodos de verificación de roles
  hasRole(role: string | UserRole): boolean {
    const user = this.currentUserSignal();
    return user?.role === role;
  }

  hasAnyRole(roles: (string | UserRole)[]): boolean {
    if (!roles || roles.length === 0) return true;
    const user = this.currentUserSignal();
    return user ? roles.some(role => user.role === role) : false;
  }

  hasAllRoles(roles: (string | UserRole)[]): boolean {
    if (!roles || roles.length === 0) return true;
    const user = this.currentUserSignal();
    return user ? roles.every(role => user.role === role) : false;
  }

  isAdmin(): boolean {
    return this.hasRole(ROLES.ADMIN);
  }

  isEditor(): boolean {
    return this.hasRole(ROLES.EDITOR);
  }

  isViewer(): boolean {
    return this.hasRole(ROLES.VIEWER);
  }

  isCustomer(): boolean {
    return this.hasRole(ROLES.CUSTOMER);
  }

  private message = inject(NzMessageService);
  private http = inject(HttpClient);
  private router = inject(Router);
  private isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

  // Propiedad para acceder al usuario actual de forma síncrona
  get currentUser(): User | null {
    return this.currentUserSignal();
  }

  // Obtener el token de acceso del almacenamiento local
  getAccessToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem('token');
  }

  // Obtener el token de actualización del almacenamiento local
  getRefreshToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem('refreshToken');
  }

  // Establecer ambos tokens en el almacenamiento local
  setTokens(accessToken: string, refreshToken: string): void {
    if (!this.isBrowser) return;
    
    localStorage.setItem('token', accessToken);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    
    // Actualizar el estado de autenticación
    this.setAuthenticated(!!accessToken);
    
    // Si hay un token, verificar el estado de autenticación
    if (accessToken) {
      this.checkAuthStatus().subscribe({
        error: (error: Error) => console.error('Error al verificar el estado de autenticación:', error)
      });
    }
  }

  // Renovar el token de acceso usando el token de actualización
  refreshToken(): Promise<{ accessToken: string; refreshToken: string }> {
    return new Promise((resolve, reject) => {
      const refreshToken = this.getRefreshToken();
      
      if (!refreshToken) {
        this.logout();
        return reject(new Error('No hay token de actualización disponible'));
      }
      
      this.http.post<AuthResponse>(`${this.AUTH_URL}/refresh-token`, { refreshToken })
        .pipe(
          catchError(error => {
            this.logout();
            return throwError(() => error);
          })
        )
        .subscribe({
          next: (response) => {
            if (response.access_token) {
              // Guardar los nuevos tokens
              this.setTokens(response.access_token, response.refresh_token || '');
              resolve({
                accessToken: response.access_token,
                refreshToken: response.refresh_token || ''
              });
            } else {
              reject(new Error('No se pudo renovar el token'));
            }
          },
          error: (error) => {
            console.error('Error al renovar el token:', error);
            this.logout();
            reject(error);
          }
        });
    });
  }
  
  // Método para verificar autenticación (para usar en guards)
  isAuthenticated(): boolean {
    return this._isAuthenticatedSignal();
  }
  
  // Método para establecer el estado de autenticación
  private setAuthenticated(value: boolean): void {
    this._isAuthenticatedSignal.set(value);
    if (!value) {
      this.currentUserSignal.set(null);
      this._currentUser$.next(null);
    }
  }

  constructor() {
    // No verificar la sesión automáticamente al iniciar
    // La verificación se hará cuando se intente acceder a rutas protegidas
    if (this.isBrowser) {
      const token = localStorage.getItem('token');
      if (token) {
        // Si hay token, verificar si es válido
        this.checkAuthStatus();
      } else {
        // Si no hay token, asegurarse de que el usuario esté deslogueado
        this.logout();
      }
    }
  }

  login(email: string, password: string): Observable<User> {
    this.isLoading.set(true);
    
    // Configurar los headers para la petición
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
    
    // Datos para el login según la documentación de la API
    const loginData = {
      email: email,
      password: password
    };
    
    return this.http.post<AuthResponse>(
      `${this.AUTH_URL}/login`, 
      loginData,
      { headers }
    ).pipe(
      switchMap(response => {
        if (!response.access_token) {
          throw new Error('No se recibió un token de acceso válido');
        }
        
        // Obtener el token de acceso actual
        const token = response.access_token;
        
        // Guardar el token en el almacenamiento local
        if (this.isBrowser) {
          localStorage.setItem('token', token);
          if (response.refresh_token) {
            localStorage.setItem('refreshToken', response.refresh_token);
          }
        }
        
        // Configurar los headers para las siguientes peticiones
        const authHeaders = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        
        // Obtener el perfil del usuario
        return this.http.get<User>(`${this.API_URL}/auth/profile`, { 
          headers: authHeaders 
        }).pipe(
          tap(user => {
            // Combinar la información del perfil con el token
            const authenticatedUser: User = {
              ...user,
              accessToken: token,
              refreshToken: response.refresh_token
            };
            
            // Guardar el usuario autenticado
            this.setAuthUser(authenticatedUser);
          })
        );
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Login error:', error);
        let errorMessage = 'Error al iniciar sesión';
        
        if (error.status === 401) {
          errorMessage = 'Credenciales inválidas';
        } else if (error.status === 0) {
          errorMessage = 'No se pudo conectar con el servidor';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        this.message.error(errorMessage);
        return throwError(() => new Error(errorMessage));
      }),
      finalize(() => this.isLoading.set(false))
    );
  }

  // Guardar el usuario autenticado
  private setAuthUser(user: User): void {
    if (!this.isBrowser) return;
    
    try {
      // Extraer solo los datos necesarios para evitar problemas de serialización
      const { accessToken, refreshToken, ...userWithoutTokens } = user;
      
      // Asegurarse de que el rol esté definido
      const userToStore = {
        ...userWithoutTokens,
        role: user.role || 'user' // Asignar 'user' como rol por defecto si no está definido
      };
      
      console.log('Guardando usuario con rol:', userToStore.role); // Debug
      
      // Guardar en localStorage
      localStorage.setItem('user', JSON.stringify(userToStore));
      
      if (accessToken) {
        localStorage.setItem('token', accessToken);
      }
      
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      
      // Actualizar las señales
      this.currentUserSignal.set({
        ...userToStore,
        accessToken,
        refreshToken
      });
      
      this.setAuthenticated(true);
      
      // Configurar el temporizador de cierre de sesión automático
      this.setAutoLogout();
      
      // Redirigir al dashboard
      this.router.navigate(['/welcome']);
    } catch (error) {
      console.error('Error al guardar la sesión del usuario:', error);
    }
  }

  // Verificar el estado de autenticación al cargar la aplicación
  private checkAuthStatus(): Observable<void> {
    return new Observable(subscriber => {
      if (!this.isBrowser) {
        subscriber.error(new Error('Navegador no disponible'));
        return;
      }
      
      const token = localStorage.getItem('token');
      const userJson = localStorage.getItem('user');
      
      if (!token || !userJson) {
        this.logout();
        subscriber.error(new Error('No hay token o usuario almacenado'));
        return;
      }
      
      try {
        const user = JSON.parse(userJson);
        const refreshToken = localStorage.getItem('refreshToken');
        
        // Asegurarse de que el rol esté definido
        const userWithRole = {
          ...user,
          role: user.role || 'user' // Asignar 'user' como rol por defecto si no está definido
        };
        
        // Verificar si el token es válido con una petición al perfil
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        
        this.http.get<User>(`${this.API_URL}/auth/profile`, { headers }).subscribe({
          next: (profile) => {
            // Si llegamos aquí, el token es válido
            console.log('Token válido para el usuario con rol:', userWithRole.role); // Debug
            this.currentUserSignal.set({
              ...userWithRole,
              accessToken: token,
              refreshToken: refreshToken || undefined
            });
            this.setAuthenticated(true);
            this.setAutoLogout();
            subscriber.next();
            subscriber.complete();
          },
          error: (error: any) => {
            console.error('Error al verificar el token:', error);
            this.logout();
            subscriber.error(error);
          }
        });
        
      } catch (error) {
        console.error('Error al verificar la autenticación:', error);
        this.logout();
        subscriber.error(error);
      }
  });
}

  // Configurar el temporizador de cierre de sesión automático
  private setAutoLogout(): void {
    if (!this.isBrowser) return;
    
    // Limpiar el temporizador existente si lo hay
    this.clearLogoutTimer();
    
    // Configurar un nuevo temporizador (24 horas por defecto)
    const expiresIn = 24 * 60 * 60 * 1000; // 24 horas en milisegundos
    this.tokenExpirationTimer = setTimeout(() => {
      this.logout();
      this.message.warning('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
    }, expiresIn);
  }

  // Limpiar el temporizador de cierre de sesión
  private clearLogoutTimer(): void {
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
      this.tokenExpirationTimer = null;
    }
  }

  // Cerrar sesión
  logout(): void {
    if (!this.isBrowser) return;
    
    // Limpiar el estado local
    this.currentUserSignal.set(null);
    this.setAuthenticated(false);
    
    // Limpiar el almacenamiento local
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    
    // Limpiar el temporizador
    this.clearLogoutTimer();
    
    // Redirigir al login
    this.router.navigate(['/auth/login']);
  }

  // Obtener el token de acceso actual
  getToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem('token');
  }



  // Registrar un nuevo usuario
  register(userData: Omit<RegisterData, 'role'> & { role?: UserRole }): Observable<User> {
    this.isLoading.set(true);
    
    const registerData = {
      ...userData,
      role: userData.role || 'customer',
      avatar: userData.avatar || 'https://api.lorem.space/image/face?w=150&h=150'
    } as const;
    
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
    
    return this.http.post<User>(
      `${this.API_URL}/users`, 
      registerData,
      { headers }
    ).pipe(
      tap(() => {
        this.message.success('¡Registro exitoso! Por favor inicia sesión.');
        this.router.navigate(['/regitro']);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error en el registro:', error);
        let errorMessage = 'Error al registrar el usuario';
        
        if (error.status === 400) {
          errorMessage = 'El correo electrónico ya está en uso';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        this.message.error(errorMessage);
        return throwError(() => new Error(errorMessage));
      }),
      finalize(() => this.isLoading.set(false))
    );
  }
  // Método para actualizar el perfil de cualquier usuario por ID
  updateProfile(userId: number, updates: Omit<Partial<User>, 'id' | 'role'> & { password?: string }): Observable<User> {
    this.isLoading.set(true);
    
    if (!userId) {
      this.isLoading.set(false);
      return throwError(() => new Error('ID de usuario no proporcionado'));
    }

    // Crear un objeto con solo los campos que se van a actualizar
    const updateData: Partial<Omit<User, 'id' | 'role'>> & { password?: string } = {};
    
    // Solo incluir los campos que tienen valor y se permiten actualizar
    if (updates.name) updateData.name = updates.name;
    if (updates.avatar) updateData.avatar = updates.avatar;
    // Manejar la contraseña por separado ya que no está en el tipo User
    if ('password' in updates) {
      updateData.password = updates.password;
    }

    const token = this.getToken();
    if (!token) {
      this.isLoading.set(false);
      return throwError(() => new Error('No autenticado'));
    }
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.put<User>(`${this.API_URL}/users/${userId}`, updateData, { headers }).pipe(
      tap(updatedUser => {
        // Si es el perfil del usuario actual, actualizar el estado local
        const currentUser = this.currentUser;
        if (currentUser?.id === userId) {
          const updatedUserWithTokens: User = { 
            ...updatedUser,
            accessToken: currentUser.accessToken,
            refreshToken: currentUser.refreshToken
          };
          this.currentUserSignal.set(updatedUserWithTokens);
          
          // Actualizar en localStorage (sin incluir los tokens)
          const { accessToken, refreshToken, ...userWithoutTokens } = updatedUserWithTokens;
          localStorage.setItem('user', JSON.stringify(userWithoutTokens));
        }
        this.message.success('Perfil actualizado correctamente');
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error al actualizar perfil:', error);
        let errorMessage = 'Error al actualizar el perfil';
        
        if (error.status === 400) {
          errorMessage = 'Datos inválidos';
        } else if (error.status === 401) {
          errorMessage = 'No autorizado';
        } else if (error.status === 0) {
          errorMessage = 'No se pudo conectar al servidor';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        this.message.error(errorMessage);
        return throwError(() => new Error(errorMessage));
      }),
      finalize(() => this.isLoading.set(false))
    );
  }
}