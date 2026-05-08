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