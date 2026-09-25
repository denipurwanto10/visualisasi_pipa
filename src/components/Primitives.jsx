import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react';

export function Field({ label, hint, unit, className = '', as: Element = 'input', ...props }) {
  return (
    <label className={`field ${className}`}>
      <span className="field-label">{label}</span>
      <span className={`input-with-unit ${unit ? '' : 'no-unit'}`}>
        <Element className={Element === 'textarea' ? 'textarea' : 'field-input'} {...props} />
        {unit && <span className="input-unit">{unit}</span>}
      </span>
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export function Section({ icon: Icon, title, description, children, action, className = '' }) {
  return (
    <section className={`surface section ${className}`}>
      <div className="section-heading">
        <div className="section-icon"><Icon size={21} strokeWidth={1.8} /></div>
        <div className="section-heading-text">
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Button({ children, variant = 'primary', icon: Icon, className = '', ...props }) {
  return (
    <button className={`button button-${variant} ${className}`} {...props}>
      {Icon && <Icon size={17} strokeWidth={2} />}
      <span>{children}</span>
    </button>
  );
}

export function EmptyState({ icon: Icon, title, description, children }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon"><Icon size={26} strokeWidth={1.7} /></div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {children}
    </div>
  );
}

const TOAST_ICONS = {
  success: CheckCircle2,
  warning: AlertCircle,
  error: XCircle,
  info: Info,
};

export function Toast({ toast, onClose }) {
  if (!toast) return null;
  const Icon = TOAST_ICONS[toast.type] || Info;
  return (
    <div className={`toast toast-${toast.type || 'info'}`} role="status" aria-live="polite">
      <Icon size={20} />
      <span>{toast.message}</span>
      <button className="icon-button" type="button" onClick={onClose} aria-label="Tutup notifikasi">×</button>
    </div>
  );
}
