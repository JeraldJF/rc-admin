import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation object
const translations = {
  en: {
    // Navigation
    'nav.my_claims': 'My Claims',
    'nav.students_list': 'Students List',
    'nav.teachers_list': 'Teachers List',
    'nav.pending_claims': 'Pending Claims',
    'nav.approved_claims': 'Approved Claims',
    'nav.logout': 'Logout',
    'nav.certificates': 'Certificates',
    
    // Page titles
    'title.claim_requests': 'Claim Requests',
    'title.pending_claims': 'Pending Claims',
    'title.approved_claims': 'Approved Claims',
    'title.student_management': 'Student Management',
    'title.teacher_management': 'Teacher Management',
    'title.registry': 'Registry',
    
    // Buttons
    'btn.request_claim': 'Request For Claim',
    'btn.approve': 'Approve',
    'btn.reject': 'Reject',
    'btn.view': 'View',
    'btn.edit': 'Edit',
    'btn.delete': 'Delete',
    'btn.download': 'Download Certificate',
    'btn.add_entity': 'Add',
    'btn.login': 'Login',
    'btn.save': 'Save',
    'btn.cancel': 'Cancel',
    'btn.confirm': 'Confirm',
    'btn.close': 'Close',
    'btn.back': 'Back',
    'btn.add_teacher': 'Add Teacher',
    'btn.add_student': 'Add Student',
    'btn.save_changes': 'Save Changes',
    'btn.confirm_request': 'Confirm Request',
    'btn.back_to_registry': 'Back to Registry',
    
    // Status
    'status.approved': 'Approved',
    'status.pending': 'Pending',
    'status.rejected': 'Rejected',
    'status.open': 'Open',
    'status.closed': 'Closed',
    
    // Table headers
    'table.student_name': 'Student Name',
    'table.institute_name': 'Institute Name',
    'table.name': 'Name',
    'table.email': 'Email',
    'table.mobile': 'Mobile',
    'table.created': 'Created',
    'table.updated': 'Updated',
    'table.created_on': 'CREATED ON',
    'table.updated_on': 'UPDATED ON',
    'table.pending_since': 'PENDING SINCE',
    'table.time_approved': 'TIME APPROVED',
    'table.pending_time': 'PENDING TIME',
    'table.claim_id': 'Claim ID',
    'table.status': 'Status',
    'table.actions': 'Actions',
    
    // Messages
    'msg.no_claims': 'No claims found. Click "Request For Claim" to submit a new request.',
    'msg.no_entities': 'No entities found.',
    'msg.logged_out': 'You have been successfully logged out.',
    'msg.approving': 'Approving...',
    'msg.rejecting': 'Rejecting...',
    
    // Login
    'login.title': 'Welcome Back',
    'login.subtitle': 'Enter your credentials to access your account',
    'login.email': 'Email',
    'login.password': 'Password',
    'login.role': 'Role',
    'login.show_password': 'Show password',
    'login.hide_password': 'Hide password',
    'login.admin': 'Admin',
    'login.teacher': 'Teacher',
    'login.student': 'Student',
    
    // Profile
    'profile.view_profile': 'View Profile',
    'profile.username': 'Username',
    'profile.email': 'Email Address',
    'profile.role': 'Role',
    
    // Languages
    'lang.english': 'English',
    'lang.spanish': 'Spanish',
    
    // Search
    'search.teachers': 'Search for teachers...',
    'search.students': 'Search for students...',
    'search.claims': 'Search for claims...',
    'search.default': 'Search...',
    
    // Forms
    'form.name': 'Name',
    'form.full_name': 'Full Name',
    'form.gender': 'Gender',
    'form.date_of_birth': 'Date of Birth',
    'form.subject': 'Subject',
    'form.male': 'Male',
    'form.female': 'Female',
    'form.other': 'Other',
    'form.email': 'Email ID',
    'form.mobile': 'Mobile number',
    'form.mobile_number': 'Mobile number',
    'form.institute_name': 'Institute Name',
    'form.pick_date': 'Pick a date',
    'form.enter_name': 'Enter name',
    'form.enter_full_name': 'Enter full name',
    'form.enter_email': 'Enter email address',
    'form.enter_mobile': 'Enter mobile number',
    'form.enter_institute': 'Enter institute name',
    'form.select_gender': 'Select gender',
    'form.select_subject': 'Select subject',
    
    // Tooltips
    'tooltip.download': 'Download Certificate',
    'tooltip.view': 'View Details',
    'tooltip.edit': 'Edit Entity',
    'tooltip.delete': 'Delete Entity',
    
    // Pagination
    'pagination.previous': 'Previous',
    'pagination.next': 'Next',
    'pagination.showing': 'Showing {start} to {end} of {total} entries',
    
    // Confirmation
    'confirm.title': 'Confirm Action',
    'confirm.delete_title': 'Delete Entity',
    'confirm.delete_message': 'Are you sure you want to delete this entity? This action cannot be undone.',
    'confirm.request_claim': 'Request Claim Confirmation',
    'confirm.request_claim_desc': 'Are you sure you want to submit a claim request for:',
    'confirm.success': 'Success',
    'confirm.requesting': 'Requesting Claim',
    'confirm.sending_request': 'Sending request for claim...',
    'confirm.are_you_sure': 'Are you sure?',
    'confirm.delete_warning': 'This action cannot be undone. This will permanently delete the record.',
    'confirm.request_submitted_successfully': 'Request for claim submitted successfully!',
    'confirm.delete_claim_request': 'Delete Claim Request?',
    'confirm.delete_claim_warning': 'Are you sure you want to delete this claim request? This action cannot be undone.',
    
    // Page titles and headings
    'heading.add_teacher': 'Add Teacher Details',
    'heading.add_student': 'Add Student Details', 
    'heading.edit_teacher': 'Edit Teacher Details',
    'heading.edit_student': 'Edit Student Details',
    'heading.view_teacher': 'View Teacher Details',
    'heading.view_student': 'View Student Details',
    'heading.personal_info': 'Personal Information',
    'heading.contact_info': 'Contact Information',
    'heading.academic_info': 'Academic Information',
    'heading.profile_settings': 'Profile Settings',
    
    // Common actions
    'action.back': 'Back',
    'action.loading': 'Loading...',
    'action.saving': 'Saving...',
    'action.updating': 'Updating...',
    'action.deleting': 'Deleting...',
    'action.processing': 'Processing...',
    'action.view': 'View',
    'action.edit': 'Edit',
    'action.delete': 'Delete',
    'action.clear_filters': 'Clear Filters',
    'action.approving': 'Approving...',
    
    // Toast messages
    'toast.login_success': 'Login successful',
    'toast.welcome_back': 'Welcome back!',
    'toast.login_failed': 'Login failed',
    'toast.invalid_credentials': 'Invalid credentials. Please try again.',
    'toast.teacher_added': 'Teacher added successfully',
    'toast.teacher_added_desc': 'The teacher record has been created.',
    'toast.student_added': 'Student added successfully',
    'toast.student_added_desc': 'The student record has been created.',
    'toast.teacher_updated': 'Teacher updated successfully',
    'toast.teacher_updated_desc': 'The teacher record has been updated.',
    'toast.student_updated': 'Student updated successfully',
    'toast.student_updated_desc': 'The student record has been updated.',
    'toast.profile_updated': 'Profile updated successfully',
    'toast.profile_updated_desc': 'Your profile has been saved.',
    'toast.claim_approved': 'Claim approved',
    'toast.claim_approved_desc': 'The claim has been successfully approved.',
    'toast.claim_rejected': 'Claim rejected',
    'toast.claim_rejected_desc': 'The claim has been rejected.',
    'toast.failed_add': 'Failed to add record',
    'toast.failed_add_desc': 'Could not create the record',
    'toast.failed_update': 'Failed to update record',
    'toast.failed_update_desc': 'Could not update the record',
    'toast.failed_load_profile': 'Failed to load profile',
    'toast.failed_load_teachers': 'Failed to load teachers',
    'toast.failed_load_students': 'Failed to load students',
    'toast.failed_load_claims': 'Failed to load claims',
    'toast.failed_approve': 'Failed to approve claim',
    'toast.failed_approve_desc': 'Could not approve the claim',
    'toast.could_not_fetch': 'Could not fetch',
    'toast.could_not_fetch_teachers': 'Could not fetch teachers',
    'toast.could_not_fetch_students': 'Could not fetch students',
    'toast.could_not_fetch_pending_claims': 'Could not fetch pending claims',
    'toast.entity_deleted': 'Entity deleted successfully',
    'toast.record_removed': 'The record has been removed from the system.',
    'toast.cannot_submit_request': 'Cannot submit request',
    'toast.existing_claim_message': 'You already have a claim for this institute that is',
    'toast.wait_for_processing': 'Please wait for it to be processed.',
    'toast.failed_request_claim': 'Failed to submit claim request',
    'toast.could_not_submit_request': 'Could not submit the claim request',
    'toast.claim_deleted': 'Claim request deleted',
    'toast.claim_removed': 'The claim request has been removed.',
    'toast.certificate_downloaded': 'Certificate downloaded',
    'toast.certificate_download_success': 'Your certificate has been downloaded successfully.',
    'toast.download_failed': 'Download failed',
    'toast.could_not_download': 'Could not download the certificate',
    'toast.could_not_fetch_claims': 'Could not fetch claims',
    
    // Form validation
    'validation.required': 'This field is required',
    'validation.name_required': 'Name is required',
    'validation.full_name_required': 'Full Name is required',
    'validation.email_required': 'Email is required',
    'validation.mobile_required': 'Mobile number is required',
    'validation.institute_required': 'Institute Name is required',
    'validation.dob_required': 'Date of Birth is required',
    'validation.gender_required': 'Gender is required',
    'validation.subject_required': 'Subject is required',
    'validation.username_required': 'Username is required',
    'validation.password_required': 'Password is required',
    
    // No data messages
    'no_data.claims': 'No claims found. Click "Request For Claim" to submit a new request.',
    'no_data.entities': 'No entities found.',
    'no_data.teachers': 'No teachers found.',
    'no_data.students': 'No students found.',
    'no_data.no_records': 'No Records Found',
    'no_data.no_match_criteria': 'No entities match your search criteria',
    'no_data.no_entities_available': 'No entities available in the system',
    'no_data.no_claims_found': 'No claims found. Click "Request For Claim" to submit a new request.',
    
    // Error messages
    'error.entity_not_found': 'Entity not found',
    'error.failed_load_data': 'Failed to load data',
    
    // Loading messages
    'loading.claims': 'Loading claims...',
    'loading.data': 'Loading...',
    
    // Placeholders
    'placeholder.search_teachers': 'Search teachers...',
    'placeholder.search_students': 'Search students...',
  },
  es: {
    // Navigation
    'nav.my_claims': 'Mis Reclamos',
    'nav.students_list': 'Lista de Estudiantes',
    'nav.teachers_list': 'Lista de Profesores',
    'nav.pending_claims': 'Reclamos Pendientes',
    'nav.approved_claims': 'Reclamos Aprobados',
    'nav.logout': 'Cerrar Sesión',
    'nav.certificates': 'Certificados',
    
    // Page titles
    'title.claim_requests': 'Solicitudes de Reclamos',
    'title.pending_claims': 'Reclamos Pendientes',
    'title.approved_claims': 'Reclamos Aprobados',
    'title.student_management': 'Gestión de Estudiantes',
    'title.teacher_management': 'Gestión de Profesores',
    'title.registry': 'Registro',
    
    // Buttons
    'btn.request_claim': 'Solicitar Reclamo',
    'btn.approve': 'Aprobar',
    'btn.reject': 'Rechazar',
    'btn.view': 'Ver',
    'btn.edit': 'Editar',
    'btn.delete': 'Eliminar',
    'btn.download': 'Descargar Certificado',
    'btn.add_entity': 'Agregar',
    'btn.login': 'Iniciar Sesión',
    'btn.save': 'Guardar',
    'btn.cancel': 'Cancelar',
    'btn.confirm': 'Confirmar',
    'btn.close': 'Cerrar',
    'btn.back': 'Volver',
    'btn.add_teacher': 'Agregar Profesor',
    'btn.add_student': 'Agregar Estudiante',
    'btn.save_changes': 'Guardar Cambios',
    'btn.confirm_request': 'Confirmar Solicitud',
    'btn.back_to_registry': 'Volver al Registro',
    
    // Status
    'status.approved': 'Aprobado',
    'status.pending': 'Pendiente',
    'status.rejected': 'Rechazado',
    'status.open': 'Abierto',
    'status.closed': 'Cerrado',
    
    // Table headers
    'table.student_name': 'Nombre del estudiante',
    'table.institute_name': 'Nombre del instituto',
    'table.name': 'Nombre',
    'table.email': 'Correo electrónico',
    'table.mobile': 'Móvil',
    'table.created': 'Creado',
    'table.updated': 'Actualizado',
    'table.created_on': 'CREADO EN',
    'table.updated_on': 'ACTUALIZADO EN',
    'table.pending_since': 'PENDIENTE DESDE',
    'table.time_approved': 'TIEMPO DE APROBACIÓN',
    'table.pending_time': 'TIEMPO PENDIENTE',
    'table.claim_id': 'ID del reclamo',
    'table.status': 'Estado',
    'table.actions': 'Acciones',
    
    // Messages
    'msg.no_claims': 'No se encontraron reclamos. Haz clic en "Solicitar Reclamo" para enviar una nueva solicitud.',
    'msg.no_entities': 'No se encontraron entidades.',
    'msg.logged_out': 'Has cerrado sesión exitosamente.',
    'msg.approving': 'Aprobando...',
    'msg.rejecting': 'Rechazando...',
    
    // Login
    'login.title': 'Bienvenido de Nuevo',
    'login.subtitle': 'Ingresa tus credenciales para acceder a tu cuenta',
    'login.email': 'Correo Electrónico',
    'login.password': 'Contraseña',
    'login.role': 'Rol',
    'login.show_password': 'Mostrar contraseña',
    'login.hide_password': 'Ocultar contraseña',
    'login.admin': 'Administrador',
    'login.teacher': 'Profesor',
    'login.student': 'Estudiante',
    
    // Profile
    'profile.view_profile': 'Ver Perfil',
    'profile.username': 'Nombre de Usuario',
    'profile.email': 'Dirección de Correo',
    'profile.role': 'Rol',
    
    // Languages
    'lang.english': 'Inglés',
    'lang.spanish': 'Español',
    
    // Search
    'search.teachers': 'Buscar profesores...',
    'search.students': 'Buscar estudiantes...',
    'search.claims': 'Buscar reclamos...',
    'search.default': 'Buscar...',
    
    // Forms
    'form.name': 'Nombre',
    'form.full_name': 'Nombre completo',
    'form.gender': 'Género',
    'form.date_of_birth': 'Fecha de nacimiento',
    'form.subject': 'Materia',
    'form.male': 'Masculino',
    'form.female': 'Femenino',
    'form.other': 'Otro',
    'form.email': 'Correo electrónico',
    'form.mobile': 'Número móvil',
    'form.mobile_number': 'Número móvil',
    'form.institute_name': 'Nombre del instituto',
    'form.pick_date': 'Seleccionar fecha',
    'form.enter_name': 'Ingresa el nombre',
    'form.enter_full_name': 'Ingresa el nombre completo',
    'form.enter_email': 'Ingresa la dirección de correo',
    'form.enter_mobile': 'Ingresa el número móvil',
    'form.enter_institute': 'Ingresa el nombre del instituto',
    'form.select_gender': 'Selecciona el género',
    'form.select_subject': 'Selecciona la materia',
    
    // Tooltips
    'tooltip.download': 'Descargar Certificado',
    'tooltip.view': 'Ver Detalles',
    'tooltip.edit': 'Editar Entidad',
    'tooltip.delete': 'Eliminar Entidad',
    
    // Pagination
    'pagination.previous': 'Anterior',
    'pagination.next': 'Siguiente',
    'pagination.showing': 'Mostrando {start} a {end} de {total} entradas',
    
    // Confirmation
    'confirm.title': 'Confirmar Acción',
    'confirm.delete_title': 'Eliminar Entidad',
    'confirm.delete_message': '¿Estás seguro de que quieres eliminar esta entidad? Esta acción no se puede deshacer.',
    'confirm.request_claim': 'Confirmación de Solicitud de Reclamo',
    'confirm.request_claim_desc': '¿Estás seguro de que quieres enviar una solicitud de reclamo para:',
    'confirm.success': 'Éxito',
    'confirm.requesting': 'Solicitando Reclamo',
    'confirm.sending_request': 'Enviando solicitud de reclamo...',
    'confirm.are_you_sure': '¿Estás seguro?',
    'confirm.delete_warning': 'Esta acción no se puede deshacer. Esto eliminará permanentemente el registro.',
    'confirm.request_submitted_successfully': '¡Solicitud de reclamo enviada exitosamente!',
    'confirm.delete_claim_request': '¿Eliminar Solicitud de Reclamo?',
    'confirm.delete_claim_warning': '¿Estás seguro de que quieres eliminar esta solicitud de reclamo? Esta acción no se puede deshacer.',
    
    // Page titles and headings
    'heading.add_teacher': 'Agregar Detalles del Profesor',
    'heading.add_student': 'Agregar Detalles del Estudiante',
    'heading.edit_teacher': 'Editar Detalles del Profesor',
    'heading.edit_student': 'Editar Detalles del Estudiante',
    'heading.view_teacher': 'Ver Detalles del Profesor',
    'heading.view_student': 'Ver Detalles del Estudiante',
    'heading.personal_info': 'Información Personal',
    'heading.contact_info': 'Información de Contacto',
    'heading.academic_info': 'Información Académica',
    'heading.profile_settings': 'Configuración del Perfil',
    
    // Common actions
    'action.back': 'Atrás',
    'action.loading': 'Cargando...',
    'action.saving': 'Guardando...',
    'action.updating': 'Actualizando...',
    'action.deleting': 'Eliminando...',
    'action.processing': 'Procesando...',
    'action.view': 'Ver',
    'action.edit': 'Editar',
    'action.delete': 'Eliminar',
    'action.clear_filters': 'Limpiar Filtros',
    'action.approving': 'Aprobando...',
    
    // Toast messages
    'toast.login_success': 'Inicio de sesión exitoso',
    'toast.welcome_back': '¡Bienvenido de nuevo!',
    'toast.login_failed': 'Falló el inicio de sesión',
    'toast.invalid_credentials': 'Credenciales inválidas. Por favor, inténtalo de nuevo.',
    'toast.teacher_added': 'Profesor agregado exitosamente',
    'toast.teacher_added_desc': 'El registro del profesor ha sido creado.',
    'toast.student_added': 'Estudiante agregado exitosamente',
    'toast.student_added_desc': 'El registro del estudiante ha sido creado.',
    'toast.teacher_updated': 'Profesor actualizado exitosamente',
    'toast.teacher_updated_desc': 'El registro del profesor ha sido actualizado.',
    'toast.student_updated': 'Estudiante actualizado exitosamente',
    'toast.student_updated_desc': 'El registro del estudiante ha sido actualizado.',
    'toast.profile_updated': 'Perfil actualizado exitosamente',
    'toast.profile_updated_desc': 'Tu perfil ha sido guardado.',
    'toast.claim_approved': 'Reclamo aprobado',
    'toast.claim_approved_desc': 'El reclamo ha sido aprobado exitosamente.',
    'toast.claim_rejected': 'Reclamo rechazado',
    'toast.claim_rejected_desc': 'El reclamo ha sido rechazado.',
    'toast.failed_add': 'Falló al agregar registro',
    'toast.failed_add_desc': 'No se pudo crear el registro',
    'toast.failed_update': 'Falló al actualizar registro',
    'toast.failed_update_desc': 'No se pudo actualizar el registro',
    'toast.failed_load_profile': 'Falló al cargar perfil',
    'toast.failed_load_teachers': 'Falló al cargar profesores',
    'toast.failed_load_students': 'Falló al cargar estudiantes',
    'toast.failed_load_claims': 'Falló al cargar reclamos',
    'toast.failed_approve': 'Falló al aprobar reclamo',
    'toast.failed_approve_desc': 'No se pudo aprobar el reclamo',
    'toast.could_not_fetch': 'No se pudo obtener',
    'toast.could_not_fetch_teachers': 'No se pudieron obtener profesores',
    'toast.could_not_fetch_students': 'No se pudieron obtener estudiantes',
    'toast.could_not_fetch_pending_claims': 'No se pudieron obtener reclamos pendientes',
    'toast.entity_deleted': 'Entidad eliminada exitosamente',
    'toast.record_removed': 'El registro ha sido eliminado del sistema.',
    'toast.cannot_submit_request': 'No se puede enviar solicitud',
    'toast.existing_claim_message': 'Ya tienes un reclamo para este instituto que está',
    'toast.wait_for_processing': 'Por favor espera a que sea procesado.',
    'toast.failed_request_claim': 'Falló al enviar solicitud de reclamo',
    'toast.could_not_submit_request': 'No se pudo enviar la solicitud de reclamo',
    'toast.claim_deleted': 'Solicitud de reclamo eliminada',
    'toast.claim_removed': 'La solicitud de reclamo ha sido eliminada.',
    'toast.certificate_downloaded': 'Certificado descargado',
    'toast.certificate_download_success': 'Tu certificado ha sido descargado exitosamente.',
    'toast.download_failed': 'Falló la descarga',
    'toast.could_not_download': 'No se pudo descargar el certificado',
    'toast.could_not_fetch_claims': 'No se pudieron obtener reclamos',
    
    // Form validation
    'validation.required': 'Este campo es requerido',
    'validation.name_required': 'El nombre es requerido',
    'validation.full_name_required': 'El nombre completo es requerido',
    'validation.email_required': 'El correo electrónico es requerido',
    'validation.mobile_required': 'El número móvil es requerido',
    'validation.institute_required': 'El nombre del instituto es requerido',
    'validation.dob_required': 'La fecha de nacimiento es requerida',
    'validation.gender_required': 'El género es requerido',
    'validation.subject_required': 'La materia es requerida',
    'validation.username_required': 'El nombre de usuario es requerido',
    'validation.password_required': 'La contraseña es requerida',
    
    // No data messages
    'no_data.claims': 'No se encontraron reclamos. Haz clic en "Solicitar Reclamo" para enviar una nueva solicitud.',
    'no_data.entities': 'No se encontraron entidades.',
    'no_data.teachers': 'No se encontraron profesores.',
    'no_data.students': 'No se encontraron estudiantes.',
    'no_data.no_records': 'No se Encontraron Registros',
    'no_data.no_match_criteria': 'Ninguna entidad coincide con tus criterios de búsqueda',
    'no_data.no_entities_available': 'No hay entidades disponibles en el sistema',
    'no_data.no_claims_found': 'No se encontraron reclamos. Haz clic en "Solicitar Reclamo" para enviar una nueva solicitud.',
    
    // Error messages
    'error.entity_not_found': 'Entidad no encontrada',
    'error.failed_load_data': 'Falló al cargar datos',
    
    // Loading messages
    'loading.claims': 'Cargando reclamos...',
    'loading.data': 'Cargando...',
    
    // Placeholders
    'placeholder.search_teachers': 'Buscar profesores...',
    'placeholder.search_students': 'Buscar estudiantes...',
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const stored = localStorage.getItem('language');
    return (stored as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};