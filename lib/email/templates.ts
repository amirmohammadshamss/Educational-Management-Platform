/**
 * Email template utilities and templates
 * All templates include both HTML and plain text versions
 */

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// Platform branding colors
const BRAND_COLOR = '#2563eb'; // Blue
const BRAND_COLOR_DARK = '#1e40af';

/**
 * Base HTML wrapper for all email templates
 */
function wrapEmailTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Educational Management Platform</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      padding: 20px;
    }
    .header {
      background-color: ${BRAND_COLOR};
      color: #ffffff;
      padding: 20px;
      text-align: center;
      border-radius: 5px 5px 0 0;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      padding: 30px 20px;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background-color: ${BRAND_COLOR};
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
      font-weight: bold;
    }
    .button:hover {
      background-color: ${BRAND_COLOR_DARK};
    }
    .footer {
      text-align: center;
      padding: 20px;
      font-size: 12px;
      color: #666;
      border-top: 1px solid #e0e0e0;
    }
    .info-box {
      background-color: #f8f9fa;
      border-left: 4px solid ${BRAND_COLOR};
      padding: 15px;
      margin: 20px 0;
    }
    .warning-box {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
    }
    @media only screen and (max-width: 600px) {
      .container {
        width: 100% !important;
        padding: 10px !important;
      }
      .content {
        padding: 20px 10px !important;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Educational Management Platform</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Educational Management Platform. Tous droits réservés.</p>
      <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Welcome email for new users
 */
export function welcomeEmail(userName: string, userRole: string): EmailTemplate {
  const roleNames: Record<string, string> = {
    ADMIN: 'Administrateur',
    TEACHER: 'Enseignant',
    STUDENT: 'Étudiant',
    SUPER_ADMIN: 'Super Administrateur',
  };

  const roleName = roleNames[userRole] || userRole;

  const html = wrapEmailTemplate(`
    <h2>Bienvenue ${userName} !</h2>
    <p>Votre compte a été créé avec succès sur la plateforme de gestion éducative.</p>
    <div class="info-box">
      <p><strong>Rôle :</strong> ${roleName}</p>
    </div>
    <p>Vous pouvez maintenant vous connecter à la plateforme pour accéder à vos fonctionnalités.</p>
    <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login" class="button">Se connecter</a>
    <p>Si vous avez des questions, n'hésitez pas à contacter l'administration.</p>
  `);

  const text = `
Bienvenue ${userName} !

Votre compte a été créé avec succès sur la plateforme de gestion éducative.

Rôle : ${roleName}

Vous pouvez maintenant vous connecter à la plateforme pour accéder à vos fonctionnalités.

Lien de connexion : ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login

Si vous avez des questions, n'hésitez pas à contacter l'administration.

© ${new Date().getFullYear()} Educational Management Platform. Tous droits réservés.
  `;

  return {
    subject: 'Bienvenue sur la plateforme - Educational Management Platform',
    html,
    text: text.trim(),
  };
}

/**
 * Password reset email
 */
export function passwordResetEmail(userName: string, resetLink: string): EmailTemplate {
  const html = wrapEmailTemplate(`
    <h2>Réinitialisation de mot de passe</h2>
    <p>Bonjour ${userName},</p>
    <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
    <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
    <a href="${resetLink}" class="button">Réinitialiser mon mot de passe</a>
    <p>Ce lien est valide pendant 24 heures.</p>
    <div class="warning-box">
      <p><strong>Attention :</strong> Si vous n'avez pas demandé cette réinitialisation, ignorez cet email. Votre mot de passe actuel reste inchangé.</p>
    </div>
  `);

  const text = `
Réinitialisation de mot de passe

Bonjour ${userName},

Vous avez demandé la réinitialisation de votre mot de passe.

Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :
${resetLink}

Ce lien est valide pendant 24 heures.

ATTENTION : Si vous n'avez pas demandé cette réinitialisation, ignorez cet email. Votre mot de passe actuel reste inchangé.

© ${new Date().getFullYear()} Educational Management Platform. Tous droits réservés.
  `;

  return {
    subject: 'Réinitialisation de votre mot de passe',
    html,
    text: text.trim(),
  };
}

/**
 * Homework reviewed notification email
 */
export function homeworkReviewedEmail(
  studentName: string,
  teacherName: string,
  status: string,
  feedback?: string
): EmailTemplate {
  const statusLabels: Record<string, { label: string; color: string }> = {
    APPROVED: { label: 'Approuvé', color: '#10b981' },
    REJECTED: { label: 'Rejeté', color: '#ef4444' },
    NEEDS_REVISION: { label: 'À réviser', color: '#f59e0b' },
  };

  const statusInfo = statusLabels[status] || { label: status, color: BRAND_COLOR };

  const html = wrapEmailTemplate(`
    <h2>Votre devoir a été évalué</h2>
    <p>Bonjour ${studentName},</p>
    <p>${teacherName} a évalué votre devoir.</p>
    <div class="info-box" style="border-left-color: ${statusInfo.color};">
      <p><strong>Statut :</strong> ${statusInfo.label}</p>
      ${feedback ? `<p><strong>Commentaire :</strong></p><p>${feedback}</p>` : ''}
    </div>
    <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/student/homework" class="button">Voir mes devoirs</a>
  `);

  const text = `
Votre devoir a été évalué

Bonjour ${studentName},

${teacherName} a évalué votre devoir.

Statut : ${statusInfo.label}
${feedback ? `\nCommentaire :\n${feedback}` : ''}

Voir mes devoirs : ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/student/homework

© ${new Date().getFullYear()} Educational Management Platform. Tous droits réservés.
  `;

  return {
    subject: 'Votre devoir a été évalué',
    html,
    text: text.trim(),
  };
}

/**
 * Class reminder email
 */
export function classReminderEmail(
  studentName: string,
  teacherName: string,
  date: string,
  time: string
): EmailTemplate {
  const html = wrapEmailTemplate(`
    <h2>Rappel de cours</h2>
    <p>Bonjour ${studentName},</p>
    <p>Ceci est un rappel pour votre prochain cours.</p>
    <div class="info-box">
      <p><strong>Enseignant :</strong> ${teacherName}</p>
      <p><strong>Date :</strong> ${date}</p>
      <p><strong>Heure :</strong> ${time}</p>
    </div>
    <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/student/schedule" class="button">Voir mon emploi du temps</a>
  `);

  const text = `
Rappel de cours

Bonjour ${studentName},

Ceci est un rappel pour votre prochain cours.

Enseignant : ${teacherName}
Date : ${date}
Heure : ${time}

Voir mon emploi du temps : ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/student/schedule

© ${new Date().getFullYear()} Educational Management Platform. Tous droits réservés.
  `;

  return {
    subject: `Rappel de cours - ${date}`,
    html,
    text: text.trim(),
  };
}

/**
 * Low hours warning email
 */
export function lowHoursWarningEmail(studentName: string, remainingHours: number): EmailTemplate {
  const html = wrapEmailTemplate(`
    <h2>Alerte heures de formation</h2>
    <p>Bonjour ${studentName},</p>
    <div class="warning-box">
      <p><strong>Attention :</strong> Il vous reste seulement <strong>${remainingHours} heures</strong> de formation autorisées.</p>
    </div>
    <p>Nous vous recommandons de planifier vos prochains cours en conséquence.</p>
    <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/student/schedule" class="button">Voir mon emploi du temps</a>
  `);

  const text = `
Alerte heures de formation

Bonjour ${studentName},

ATTENTION : Il vous reste seulement ${remainingHours} heures de formation autorisées.

Nous vous recommandons de planifier vos prochains cours en conséquence.

Voir mon emploi du temps : ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/student/schedule

© ${new Date().getFullYear()} Educational Management Platform. Tous droits réservés.
  `;

  return {
    subject: 'Alerte : Heures de formation restantes faibles',
    html,
    text: text.trim(),
  };
}

/**
 * Assignment notification email for students
 */
export function assignmentNotificationEmail(studentName: string, teacherName: string): EmailTemplate {
  const html = wrapEmailTemplate(`
    <h2>Nouveau devoir à soumettre</h2>
    <p>Bonjour ${studentName},</p>
    <p>${teacherName} vous a assigné un nouveau devoir.</p>
    <p>Veuillez consulter votre espace étudiant pour plus de détails et soumettre votre travail.</p>
    <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/student/homework" class="button">Voir mes devoirs</a>
  `);

  const text = `
Nouveau devoir à soumettre

Bonjour ${studentName},

${teacherName} vous a assigné un nouveau devoir.

Veuillez consulter votre espace étudiant pour plus de détails et soumettre votre travail.

Voir mes devoirs : ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/student/homework

© ${new Date().getFullYear()} Educational Management Platform. Tous droits réservés.
  `;

  return {
    subject: 'Nouveau devoir assigné',
    html,
    text: text.trim(),
  };
}
