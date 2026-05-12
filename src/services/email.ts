import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_FROM = process.env.EMAIL_FROM!;
const EMAIL_ADMINS = (process.env.EMAIL_ADMINS || '')
  .split(',')
  .map(email => email.trim())
  .filter(Boolean);

export interface LeadData {
  nombre: string;
  descripcion: string;
  whatsapp: string;
}

export async function sendLeadEmail(lead: LeadData): Promise<boolean> {
  try {
    if (EMAIL_ADMINS.length === 0) {
      console.error('[EMAIL] No hay admins configurados en EMAIL_ADMINS');
      return false;
    }

    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: EMAIL_ADMINS,
      subject: `🚀 Nuevo lead desde WhatsApp: ${lead.nombre}`,
      html: buildEmailHtml(lead),
    });

    if (error) {
      console.error('[EMAIL] Error de Resend:', error);
      return false;
    }

    console.log(`[EMAIL] Correo enviado correctamente. ID: ${data?.id}`);
    return true;
  } catch (error) {
    console.error('[EMAIL] Error al enviar correo:', error);
    return false;
  }
}

function buildEmailHtml(lead: LeadData): string {
  const whatsappLink = `https://wa.me/${lead.whatsapp}`;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #2d3748;">🚀 Nuevo lead desde WhatsApp</h2>
      <p>Un cliente quiere ser contactado por el equipo de Symmetrical Code.</p>

      <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>👤 Nombre:</strong> ${lead.nombre}</p>
        <p><strong>📱 WhatsApp:</strong>
          <a href="${whatsappLink}" style="color: #4299e1;">+${lead.whatsapp}</a>
        </p>
        <p><strong>📝 Descripción del proyecto:</strong></p>
        <p style="background: white; padding: 10px; border-left: 4px solid #4299e1;">
          ${lead.descripcion}
        </p>
      </div>

      <a href="${whatsappLink}"
         style="display:inline-block; background:#25D366; color:white; padding:12px 24px; text-decoration:none; border-radius:6px;">
        💬 Contactar por WhatsApp
      </a>

      <p style="color: #718096; font-size: 12px; margin-top: 30px;">
        Este correo se generó automáticamente desde el chatbot de WhatsApp.<br>
        El equipo se encargará de profundizar en funcionalidades, plazos y presupuesto con el cliente.
      </p>
    </div>
  `;
}

/**
 * Datos del formulario de contacto del sitio web.
 */
export interface ContactFormData {
  nombre: string;
  email: string;
  mensaje: string;
}

/**
 * Envía un correo cuando alguien llena el formulario de contacto en la web.
 * A diferencia del lead de WhatsApp, aquí SÍ tenemos el email del cliente
 * (porque lo escribió él).
 */
export async function sendContactEmail(form: ContactFormData): Promise<boolean> {
  try {
    if (EMAIL_ADMINS.length === 0) {
      console.error('[EMAIL] No hay admins configurados en EMAIL_ADMINS');
      return false;
    }

    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: EMAIL_ADMINS,
      replyTo: form.email, // 👈 al responder, va directo al cliente
      subject: `📬 Nuevo mensaje desde la web: ${form.nombre}`,
      html: buildContactHtml(form),
    });

    if (error) {
      console.error('[EMAIL] Error de Resend:', error);
      return false;
    }

    console.log(`[EMAIL] Mensaje de contacto enviado. ID: ${data?.id}`);
    return true;
  } catch (error) {
    console.error('[EMAIL] Error al enviar mensaje de contacto:', error);
    return false;
  }
}

function buildContactHtml(form: ContactFormData): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #2d3748;">📬 Nuevo mensaje desde el sitio web</h2>
      <p>Alguien se contactó a través del formulario de Symmetrical Code.</p>

      <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>👤 Nombre:</strong> ${form.nombre}</p>
        <p><strong>📧 Email:</strong>
          <a href="mailto:${form.email}" style="color: #4299e1;">${form.email}</a>
        </p>
        <p><strong>💬 Mensaje:</strong></p>
        <p style="background: white; padding: 15px; border-left: 4px solid #4299e1; white-space: pre-wrap;">
${form.mensaje}
        </p>
      </div>

      <a href="mailto:${form.email}"
         style="display:inline-block; background:#4299e1; color:white; padding:12px 24px; text-decoration:none; border-radius:6px;">
        ✉️ Responder al cliente
      </a>

      <p style="color: #718096; font-size: 12px; margin-top: 30px;">
        Este correo se generó desde el formulario de contacto del sitio web.<br>
        Tip: usa "Responder" en tu cliente de correo para responderle directamente.
      </p>
    </div>
  `;
}