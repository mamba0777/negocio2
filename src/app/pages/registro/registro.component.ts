import { Component, OnInit, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService, NzMessageModule } from 'ng-zorro-antd/message';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

interface ApiUser {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar: string;
  creationAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-registro',
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    FormsModule,
    NzFormModule, 
    NzInputModule, 
    NzButtonModule, 
    NzCardModule,
    NzIconModule,
    NzTableModule,
    NzTagModule,
    NzDividerModule,
    NzSelectModule,
    NzToolTipModule,
    RouterModule,
    NzModalModule,
    NzMessageModule
  ],
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.scss']
})
export class RegistroComponent implements OnInit {
  private fb = inject(FormBuilder);
  private modal = inject(NzModalService);
  private message = inject(NzMessageService);
  private router = inject(Router);
  private http = inject(HttpClient);
  authService = inject(AuthService); // Hacerlo público para usarlo en la plantilla

  // Estado del componente
  modo = signal<'lista' | 'formulario'>('lista');
  cargando = signal(false);
  passwordVisible = false;
  confirmarPasswordVisible = false;
  editandoUsuario = signal<ApiUser | null>(null);
  private formSubmitted = false;
  private isNavigatingAway = false;

  // Formulario reactivo
  form!: FormGroup;


  // Estado para la tabla de usuarios
  listOfData: ApiUser[] = [];
  loading = signal(false);

  // Computed properties
  esLista = computed(() => this.modo() === 'lista');
  esRegistro = computed(() => this.modo() === 'formulario' && !this.editandoUsuario());
  titulo = computed(() => this.esLista() ? 'Gestión de Usuarios' : (this.editandoUsuario() ? 'Editar Usuario' : 'Nuevo Usuario'));
  textoBoton = computed(() => this.editandoUsuario() ? 'Actualizar' : 'Registrar');

  ngOnInit(): void {
    this.inicializarFormulario();
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.loading.set(true);
    this.http.get<ApiUser[]>('https://api.escuelajs.co/api/v1/users')
      .subscribe({
        next: (usuarios) => {
          this.listOfData = usuarios;
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error al cargar usuarios:', error);
          this.message.error('Error al cargar la lista de usuarios');
          this.loading.set(false);
        }
      });
  }
  
  // Métodos para la tabla de usuarios
  mostrarFormularioNuevo(): void {
    this.editandoUsuario.set(null);
    this.modo.set('formulario');
    
    // Si el usuario actual es administrador, permitir seleccionar el rol
    // De lo contrario, establecer el rol como 'customer' por defecto
    const defaultRole = this.authService.isAdmin() ? 'customer' : 'customer';
    
    this.form.reset({
      avatar: 'https://api.lorem.space/image/face?w=150&h=150',
      role: defaultRole
    });
  }

  volverALista(): void {
    // Si el formulario no ha sido enviado y tiene cambios, mostrar confirmación
    if (this.form.dirty && !this.formSubmitted) {
      this.modal.confirm({
        nzTitle: '¿Estás seguro?',
        nzContent: 'Tienes cambios sin guardar. ¿Estás seguro de que deseas salir?',
        nzOkText: 'Sí, salir',
        nzOkType: 'primary',
        nzOkDanger: true,
        nzOnOk: () => {
          this.isNavigatingAway = true;
          this.resetFormAndGoToList();
          return Promise.resolve();
        },
        nzCancelText: 'Cancelar',
        nzOnCancel: () => Promise.resolve()
      });
    } else {
      this.resetFormAndGoToList();
    }
  }

  private resetFormAndGoToList(): void {
    this.modo.set('lista');
    this.editandoUsuario.set(null);
    this.form.reset();
    this.formSubmitted = false;
    this.isNavigatingAway = false;
  }

  editarUsuario(event: Event, usuario: ApiUser): void {
    event.preventDefault();
    event.stopPropagation();
    
    // Verificar si el usuario actual es administrador
    if (!this.authService.isAdmin()) {
      this.message.warning('No tienes permisos para editar usuarios');
      return;
    }
    
    this.editandoUsuario.set(usuario);
    this.modo.set('formulario');
    
    // Si el usuario no es administrador, forzar el rol a 'customer'
    const userRole = this.authService.isAdmin() ? usuario.role : 'customer';
    
    this.form.patchValue({
      id: usuario.id, // Incluimos el ID
      name: usuario.name,
      email: usuario.email,
      role: userRole,
      avatar: usuario.avatar || 'https://api.lorem.space/image/face?w=150&h=150',
      password: '', // Inicializamos la contraseña vacía
      confirmarPassword: '' // Inicializamos la confirmación de contraseña vacía
    });
  }

  eliminarUsuario(event: Event, id: number): void {
    event.preventDefault();
    event.stopPropagation();
    
    // Verificar si el usuario actual es administrador
    if (!this.authService.isAdmin()) {
      this.message.warning('No tienes permisos para eliminar usuarios');
      return;
    }
    
    // Mostrar confirmación antes de eliminar
    this.modal.confirm({
      nzTitle: '¿Estás seguro de eliminar este usuario?',
      nzContent: 'Esta acción no se puede deshacer',
      nzOkText: 'Sí, eliminar',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => this.eliminarUsuarioConfirmado(id),
      nzCancelText: 'Cancelar'
    });
  }

  private eliminarUsuarioConfirmado(id: number): void {
    // Aquí iría la lógica para eliminar el usuario
    this.message.success('Usuario eliminado correctamente');
    // Recargar la lista de usuarios
    this.cargarUsuarios();
  }

  getRoleColor(role: string): string {
    const roles: { [key: string]: string } = {
      'admin': 'red',
      'customer': 'blue',
      'user': 'green',
      'customer_service': 'orange'
    };
    return roles[role.toLowerCase()] || 'default';
  }

  private inicializarFormulario(): void {
    // Establecer el rol por defecto según el usuario actual
    const defaultRole = this.authService.isAdmin() ? 'customer' : 'customer';
    
    this.form = this.fb.group({
      id: [null], // Campo para el ID del usuario
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required, 
        Validators.minLength(6)
      ]],
      confirmarPassword: ['', [Validators.required]],
      role: [defaultRole, [Validators.required]],
      avatar: ['https://api.lorem.space/image/face?w=150&h=150'] // Avatar por defecto
    }, { validators: this.passwordMatchValidator() });
  }

  private passwordStrengthValidator(): any {
    return (control: AbstractControl): ValidationErrors | null => {
      const password = control.value;
      
      // Solo verificamos que tenga al menos 6 caracteres
      if (password && password.length < 6) {
        return { minlength: { requiredLength: 6, actualLength: password.length } };
      }

      return null;
    };
  }

  private passwordMatchValidator() {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const password = formGroup.get('password');
      const confirmarPassword = formGroup.get('confirmarPassword');

      if (!password || !confirmarPassword) {
        return null;
      }

      const passwordValue = password.value;
      const confirmarPasswordValue = confirmarPassword.value;

      // Si estamos editando un usuario y ambos campos de contraseña están vacíos, no mostrar error
      if (this.editandoUsuario() && !passwordValue && !confirmarPasswordValue) {
        return null;
      }

      // Si las contraseñas no coinciden
      if (passwordValue !== confirmarPasswordValue) {
        confirmarPassword.setErrors({ mismatch: true });
        return { mismatch: true };
      } else {
        // Limpiar errores si las contraseñas coinciden
        if (confirmarPassword.hasError('mismatch')) {
          confirmarPassword.setErrors(null);
        }
        return null;
      }
    };
  }

  onSubmit(event?: Event): void {
    // Prevenir el comportamiento por defecto del formulario
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Si ya se está procesando el formulario, no hacer nada
    if (this.cargando()) {
      return;
    }
    
    // Marcar todos los controles como touched para mostrar errores
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    this.cargando.set(true);
    this.formSubmitted = true;

    if (this.editandoUsuario()) {
      this.actualizarUsuario();
    } else {
      this.registrarUsuario();
    }
  }

  private actualizarUsuario(): void {
    const userId = this.editandoUsuario()?.id;
    if (!userId) {
      this.message.error('No se puede actualizar el usuario: ID no válido');
      this.cargando.set(false);
      return;
    }

    const { confirmPassword, ...userData } = this.form.value;

    this.authService.updateProfile(userId, userData).subscribe({
      next: (usuario) => {
        this.message.success('¡Usuario actualizado exitosamente!');
        this.volverALista();
        this.cargarUsuarios();
      },
      error: (error: any) => {
        console.error('Error al actualizar usuario:', error);
        const errorMessage = error.error?.message || error.message || 'Error al actualizar el usuario';
        this.message.error(errorMessage);
        this.cargando.set(false);
      }
    });
  }


  private registrarUsuario(): void {
    const { confirmPassword, ...userData } = this.form.value;
    
    this.authService.register(userData).subscribe({
      next: (usuario) => {
        this.message.success('¡Registro exitoso! Por favor inicia sesión.');
        this.router.navigate(['/registro']);
      },
      error: (error) => {
        console.error('Error en el registro:', error);
        const errorMessage = error.error?.message || error.message || 'Error al registrar el usuario';
        this.message.error(errorMessage);
        this.cargando.set(false);
      },
      complete: () => {
        this.cargando.set(false);
      }
    });
  }

  private actualizarPerfil(): void {
    const { confirmPassword, ...updates } = this.form.value;
    
    // Si estamos editando un usuario, usar su ID
    const userId = this.editandoUsuario()?.id;
    if (!userId) {
      this.message.error('No se puede actualizar el perfil: ID de usuario no válido');
      this.cargando.set(false);
      return;
    }
    
    this.cargando.set(true);
    this.authService.updateProfile(userId, updates).subscribe({
      next: () => {
        this.message.success('Perfil actualizado correctamente');
        this.volverALista();
        this.cargarUsuarios();
      },
      error: (error: any) => {
        console.error('Error al actualizar perfil:', error);
        const errorMessage = error.error?.message || error.message || 'Error al actualizar el perfil';
        this.message.error(errorMessage);
        this.cargando.set(false);
      },
      complete: () => {
        this.cargando.set(false);
      }
    });
  }

  // Método para cerrar sesión
  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
