/**
 * Admin Email Templates for Security Notifications and Daily Digests
 * Handles account lockouts, failed login spikes, new device logins,
 * overdue books digest, and pending borrow requests digest
 */

const DEFAULT_LIBRARY_NAME = 'LibraAI Library';
const DEFAULT_SUPPORT_EMAIL = 'support@example.com';

function escapeHTML(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(str) {
  return String(str ?? '').replace(/"/g, '&quot;');
}

/**
 * Build email for account lockout notification
 * @param {Object} input
 * @param {string} input.adminEmail - Admin's email
 * @param {string} input.lockedEmail - Locked account email
 * @param {string} input.role - Account role (student/admin)
 * @param {number} input.attempts - Number of failed attempts
 * @param {number} input.lockWindowMinutes - Lock duration in minutes
 * @param {string} input.unlockUrl - URL to security dashboard
 * @param {string} input.libraryName - Library name
 */
export function buildAccountLockoutEmail(input) {
  const {
    adminEmail,
    lockedEmail,
    role = 'user',
    attempts = 5,
    lockWindowMinutes = 15,
    unlockUrl,
    libraryName = DEFAULT_LIBRARY_NAME,
  } = input || {};

  const subject = `[Security] Account locked after failed logins`;

  const templateParams = {
    to_email: adminEmail,
    locked_email: lockedEmail,
    role: role,
    attempts: attempts,
    lock_window: lockWindowMinutes,
    unlock_url: unlockUrl || '',
    library_name: libraryName,
  };

  const html = `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;color:#111827;max-width:640px;margin:0 auto;padding:24px;">
    <h2 style="margin:0 0 4px;color:#dc2626;">🔒 Account Locked</h2>
    <p style="margin:0 0 16px;color:#6b7280">${escapeHTML(libraryName)} Security Alert</p>

    <p style="margin-top:0;">An account has been temporarily locked due to multiple failed login attempts.</p>
    
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="margin:0 0 8px;color:#991b1b;"><strong>Account:</strong> ${escapeHTML(lockedEmail)}</p>
      <p style="margin:0 0 8px;color:#991b1b;"><strong>Role:</strong> ${escapeHTML(role)}</p>
      <p style="margin:0 0 8px;color:#991b1b;"><strong>Failed Attempts:</strong> ${escapeHTML(attempts)}</p>
      <p style="margin:0;color:#991b1b;"><strong>Lock Duration:</strong> ${escapeHTML(lockWindowMinutes)} minutes</p>
    </div>

    ${unlockUrl ? `<div style="margin:16px 0;">
      <a href="${escapeAttr(unlockUrl)}" style="background:#dc2626;color:#fff;padding:10px 14px;border-radius:6px;text-decoration:none;display:inline-block;">View Security Dashboard</a>
    </div>` : ''}

    <p style="color:#374151;">The account will automatically unlock after ${escapeHTML(lockWindowMinutes)} minutes, or you can manually unlock it from the security dashboard.</p>
    
    <p style="color:#374151;"><strong>Action Required:</strong></p>
    <ul style="color:#374151;">
      <li>Review the security dashboard for suspicious activity</li>
      <li>Contact the user if this appears to be a legitimate lockout</li>
      <li>Monitor for repeated lockouts from the same account</li>
    </ul>

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
    <p style="margin:0;color:#9ca3af;font-size:12px;">This is an automated security notification. You're receiving this because you're an administrator.</p>
  </div>
  `;

  const text = [
    `${libraryName} — Account Locked`,
    ``,
    `An account has been temporarily locked due to multiple failed login attempts.`,
    ``,
    `Account: ${lockedEmail}`,
    `Role: ${role}`,
    `Failed Attempts: ${attempts}`,
    `Lock Duration: ${lockWindowMinutes} minutes`,
    ``,
    unlockUrl ? `Security Dashboard: ${unlockUrl}` : null,
    ``,
    `The account will automatically unlock after ${lockWindowMinutes} minutes, or you can manually unlock it from the security dashboard.`,
    ``,
    `Action Required:`,
    `- Review the security dashboard for suspicious activity`,
    `- Contact the user if this appears to be a legitimate lockout`,
    `- Monitor for repeated lockouts from the same account`,
  ].filter(Boolean).join('\n');

  return { subject, html, text, templateParams };
}

/**
 * Build email for failed login spike notification
 * @param {Object} input
 * @param {string} input.adminEmail - Admin's email
 * @param {number} input.failedCount - Number of failed logins
 * @param {string} input.timeWindow - Time window (e.g., "1 hour")
 * @param {Array} input.topAccounts - Top targeted accounts
 * @param {Array} input.topIPs - Top source IPs
 * @param {string} input.dashboardUrl - URL to security dashboard
 * @param {string} input.libraryName - Library name
 */
export function buildFailedLoginSpikeEmail(input) {
  const {
    adminEmail,
    failedCount = 0,
    timeWindow = '1 hour',
    topAccounts = [],
    topIPs = [],
    dashboardUrl,
    libraryName = DEFAULT_LIBRARY_NAME,
  } = input || {};

  const subject = `[Security] Spike in failed logins (${failedCount}/${timeWindow})`;

  const templateParams = {
    to_email: adminEmail,
    failed_count: failedCount,
    time_window: timeWindow,
    top_accounts: topAccounts.join(', '),
    top_ips: topIPs.join(', '),
    dashboard_url: dashboardUrl || '',
    library_name: libraryName,
  };

  const accountsList = topAccounts.length > 0
    ? topAccounts.map(acc => `<li style="color:#991b1b;">${escapeHTML(acc)}</li>`).join('')
    : '<li style="color:#6b7280;">No specific accounts targeted</li>';

  const ipsList = topIPs.length > 0
    ? topIPs.map(ip => `<li style="color:#991b1b;">${escapeHTML(ip)}</li>`).join('')
    : '<li style="color:#6b7280;">No IP data available</li>';

  const html = `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;color:#111827;max-width:640px;margin:0 auto;padding:24px;">
    <h2 style="margin:0 0 4px;color:#ea580c;">⚠️ Failed Login Spike Detected</h2>
    <p style="margin:0 0 16px;color:#6b7280">${escapeHTML(libraryName)} Security Alert</p>

    <p style="margin-top:0;">An unusual spike in failed login attempts has been detected.</p>
    
    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="margin:0 0 8px;color:#9a3412;"><strong>Failed Attempts:</strong> ${escapeHTML(failedCount)}</p>
      <p style="margin:0;color:#9a3412;"><strong>Time Window:</strong> ${escapeHTML(timeWindow)}</p>
    </div>

    <div style="margin:16px 0;">
      <p style="margin:0 0 8px;color:#374151;"><strong>Top Targeted Accounts:</strong></p>
      <ul style="margin:0;padding-left:20px;">
        ${accountsList}
      </ul>
    </div>

    <div style="margin:16px 0;">
      <p style="margin:0 0 8px;color:#374151;"><strong>Top Source IPs:</strong></p>
      <ul style="margin:0;padding-left:20px;">
        ${ipsList}
      </ul>
    </div>

    ${dashboardUrl ? `<div style="margin:16px 0;">
      <a href="${escapeAttr(dashboardUrl)}" style="background:#ea580c;color:#fff;padding:10px 14px;border-radius:6px;text-decoration:none;display:inline-block;">View Security Dashboard</a>
    </div>` : ''}

    <p style="color:#374151;"><strong>Recommended Actions:</strong></p>
    <ul style="color:#374151;">
      <li>Review the security dashboard for attack patterns</li>
      <li>Consider blocking suspicious IP addresses</li>
      <li>Monitor for continued attack attempts</li>
      <li>Verify that legitimate users are not affected</li>
    </ul>

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
    <p style="margin:0;color:#9ca3af;font-size:12px;">This is an automated security notification. You're receiving this because you're an administrator.</p>
  </div>
  `;

  const text = [
    `${libraryName} — Failed Login Spike Detected`,
    ``,
    `An unusual spike in failed login attempts has been detected.`,
    ``,
    `Failed Attempts: ${failedCount}`,
    `Time Window: ${timeWindow}`,
    ``,
    `Top Targeted Accounts:`,
    ...topAccounts.map(acc => `- ${acc}`),
    ``,
    `Top Source IPs:`,
    ...topIPs.map(ip => `- ${ip}`),
    ``,
    dashboardUrl ? `Security Dashboard: ${dashboardUrl}` : null,
    ``,
    `Recommended Actions:`,
    `- Review the security dashboard for attack patterns`,
    `- Consider blocking suspicious IP addresses`,
    `- Monitor for continued attack attempts`,
    `- Verify that legitimate users are not affected`,
  ].filter(Boolean).join('\n');

  return { subject, html, text, templateParams };
}

/**
 * Build email for new admin login environment
 * @param {Object} input
 * @param {string} input.adminEmail - Admin's email (recipient)
 * @param {string} input.loginEmail - Email that logged in
 * @param {string} input.ipAddress - IP address
 * @param {string} input.userAgent - User agent string
 * @param {string} input.location - Approximate location
 * @param {string} input.timestamp - Login timestamp
 * @param {string} input.approveUrl - URL to approve device
 * @param {string} input.reportUrl - URL to report suspicious activity
 * @param {string} input.libraryName - Library name
 */
export function buildNewAdminLoginEmail(input) {
  const {
    adminEmail,
    loginEmail,
    ipAddress = 'Unknown',
    userAgent = 'Unknown',
    location = 'Unknown',
    timestamp,
    approveUrl,
    reportUrl,
    libraryName = DEFAULT_LIBRARY_NAME,
  } = input || {};

  const subject = `[Security] New admin login environment detected`;

  const templateParams = {
    to_email: adminEmail,
    login_email: loginEmail,
    ip_address: ipAddress,
    user_agent: userAgent,
    location: location,
    timestamp: timestamp,
    approve_url: approveUrl || '',
    report_url: reportUrl || '',
    library_name: libraryName,
  };

  // Parse user agent for display
  const browserInfo = userAgent.includes('Chrome') ? 'Chrome' :
                     userAgent.includes('Firefox') ? 'Firefox' :
                     userAgent.includes('Safari') ? 'Safari' :
                     userAgent.includes('Edge') ? 'Edge' : 'Unknown Browser';

  const osInfo = userAgent.includes('Windows') ? 'Windows' :
                userAgent.includes('Mac') ? 'macOS' :
                userAgent.includes('Linux') ? 'Linux' :
                userAgent.includes('Android') ? 'Android' :
                userAgent.includes('iOS') ? 'iOS' : 'Unknown OS';

  const html = `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;color:#111827;max-width:640px;margin:0 auto;padding:24px;">
    <h2 style="margin:0 0 4px;color:#2563eb;">🔐 New Admin Login Detected</h2>
    <p style="margin:0 0 16px;color:#6b7280">${escapeHTML(libraryName)} Security Alert</p>

    <p style="margin-top:0;">A new admin login was detected from an unrecognized device or location.</p>
    
    <div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="margin:0 0 8px;color:#1e40af;"><strong>Account:</strong> ${escapeHTML(loginEmail)}</p>
      <p style="margin:0 0 8px;color:#1e40af;"><strong>Time:</strong> ${escapeHTML(timestamp)}</p>
      <p style="margin:0 0 8px;color:#1e40af;"><strong>IP Address:</strong> ${escapeHTML(ipAddress)}</p>
      <p style="margin:0 0 8px;color:#1e40af;"><strong>Location:</strong> ${escapeHTML(location)}</p>
      <p style="margin:0 0 8px;color:#1e40af;"><strong>Browser:</strong> ${escapeHTML(browserInfo)}</p>
      <p style="margin:0;color:#1e40af;"><strong>Operating System:</strong> ${escapeHTML(osInfo)}</p>
    </div>

    <p style="color:#374151;">If this wasn't you, please take immediate action:</p>
    <ul style="color:#374151;">
      <li>Change your password immediately</li>
      <li>Contact support if you suspect unauthorized access</li>
    </ul>

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
    <p style="margin:0;color:#9ca3af;font-size:12px;">This is an automated security notification. You're receiving this because an admin account was accessed from a new environment.</p>
  </div>
  `;

  const text = [
    `${libraryName} — New Admin Login Detected`,
    ``,
    `A new admin login was detected from an unrecognized device or location.`,
    ``,
    `Account: ${loginEmail}`,
    `Time: ${timestamp}`,
    `IP Address: ${ipAddress}`,
    `Location: ${location}`,
    `Browser: ${browserInfo}`,
    `Operating System: ${osInfo}`,
    ``,
    `If this wasn't you, please take immediate action:`,
    `- Change your password immediately`,
    `- Contact support if you suspect unauthorized access`,
  ].filter(Boolean).join('\n');

  return { subject, html, text, templateParams };
}

/**
 * Build email for overdue books daily digest
 * @param {Object} input
 * @param {string} input.adminEmail - Admin's email
 * @param {Array} input.overdueBooks - Array of overdue book objects
 * @param {string} input.dashboardUrl - URL to transactions dashboard
 * @param {string} input.libraryName - Library name
 */
export function buildOverdueBooksDigestEmail(input) {
  const {
    adminEmail,
    overdueBooks = [],
    dashboardUrl,
    libraryName = DEFAULT_LIBRARY_NAME,
  } = input || {};

  const count = overdueBooks.length;
  const subject = count === 0 
    ? `[Daily Digest] No overdue books` 
    : `[Daily Digest] ${count} overdue book${count === 1 ? '' : 's'}`;

  const templateParams = {
    to_email: adminEmail,
    overdue_count: count,
    dashboard_url: dashboardUrl || '',
    library_name: libraryName,
  };

  // Build HTML list of overdue books
  let booksListHTML = '';
  if (count === 0) {
    booksListHTML = '<p style="color:#166534;background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px;margin:16px 0;">✅ No overdue books at this time. Great job!</p>';
  } else {
    const bookItems = overdueBooks.slice(0, 20).map(book => {
      const daysOverdue = book.daysOverdue || 0;
      const urgencyColor = daysOverdue > 7 ? '#991b1b' : daysOverdue > 3 ? '#9a3412' : '#b91c1c';
      
      return `
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;margin:8px 0;">
          <p style="margin:0 0 4px;color:${urgencyColor};font-weight:600;">${escapeHTML(book.bookTitle)}</p>
          <p style="margin:0 0 4px;color:#6b7280;font-size:14px;">Borrowed by: ${escapeHTML(book.userName)} (${escapeHTML(book.userEmail)})</p>
          <p style="margin:0;color:${urgencyColor};font-size:14px;">
            <strong>${daysOverdue} day${daysOverdue === 1 ? '' : 's'} overdue</strong> • Due: ${escapeHTML(book.dueDate)}
          </p>
        </div>
      `;
    }).join('');

    booksListHTML = `
      <div style="margin:16px 0;">
        ${bookItems}
        ${count > 20 ? `<p style="color:#6b7280;font-size:14px;margin-top:12px;">...and ${count - 20} more. View all in the dashboard.</p>` : ''}
      </div>
    `;
  }

  const html = `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;color:#111827;max-width:640px;margin:0 auto;padding:24px;">
    <h2 style="margin:0 0 4px;color:${count === 0 ? '#16a34a' : '#dc2626'};">📚 Overdue Books Daily Digest</h2>
    <p style="margin:0 0 16px;color:#6b7280">${escapeHTML(libraryName)}</p>

    <p style="margin-top:0;">Your daily summary of overdue books.</p>
    
    <div style="background:${count === 0 ? '#f0fdf4' : '#fef2f2'};border:1px solid ${count === 0 ? '#86efac' : '#fecaca'};border-radius:8px;padding:16px;margin:16px 0;">
      <p style="margin:0;color:${count === 0 ? '#166534' : '#991b1b'};font-size:24px;font-weight:700;">${count}</p>
      <p style="margin:4px 0 0;color:${count === 0 ? '#166534' : '#991b1b'};">Overdue book${count === 1 ? '' : 's'}</p>
    </div>

    ${booksListHTML}

    ${dashboardUrl && count > 0 ? `<div style="margin:16px 0;">
      <a href="${escapeAttr(dashboardUrl)}" style="background:#dc2626;color:#fff;padding:10px 14px;border-radius:6px;text-decoration:none;display:inline-block;">View All Transactions</a>
    </div>` : ''}

    ${count > 0 ? `
    <p style="color:#374151;"><strong>Recommended Actions:</strong></p>
    <ul style="color:#374151;">
      <li>Contact students with overdue books</li>
      <li>Send reminder emails for books overdue more than 3 days</li>
      <li>Review late fee policies if applicable</li>
      <li>Check if books need to be marked as lost</li>
    </ul>
    ` : ''}

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
    <p style="margin:0;color:#9ca3af;font-size:12px;">This is an automated daily digest. You're receiving this because you're an administrator.</p>
  </div>
  `;

  const text = [
    `${libraryName} — Overdue Books Daily Digest`,
    ``,
    `Your daily summary of overdue books.`,
    ``,
    `Overdue Books: ${count}`,
    ``,
    ...(count === 0 
      ? ['✅ No overdue books at this time. Great job!']
      : [
          'Overdue Books:',
          ...overdueBooks.slice(0, 20).map(book => 
            `- "${book.bookTitle}" borrowed by ${book.userName} (${book.userEmail}) - ${book.daysOverdue} day${book.daysOverdue === 1 ? '' : 's'} overdue (Due: ${book.dueDate})`
          ),
          ...(count > 20 ? [`...and ${count - 20} more.`] : []),
        ]
    ),
    ``,
    dashboardUrl ? `View Dashboard: ${dashboardUrl}` : null,
    ``,
    ...(count > 0 ? [
      'Recommended Actions:',
      '- Contact students with overdue books',
      '- Send reminder emails for books overdue more than 3 days',
      '- Review late fee policies if applicable',
      '- Check if books need to be marked as lost',
    ] : []),
  ].filter(Boolean).join('\n');

  return { subject, html, text, templateParams };
}

/**
 * Build email for pending borrow requests daily digest
 * @param {Object} input
 * @param {string} input.adminEmail - Admin's email
 * @param {Array} input.pendingRequests - Array of pending request objects
 * @param {string} input.dashboardUrl - URL to transactions dashboard
 * @param {string} input.libraryName - Library name
 */
export function buildPendingRequestsDigestEmail(input) {
  const {
    adminEmail,
    pendingRequests = [],
    dashboardUrl,
    libraryName = DEFAULT_LIBRARY_NAME,
  } = input || {};

  const count = pendingRequests.length;
  const subject = count === 0 
    ? `[Daily Digest] No pending borrow requests` 
    : `[Daily Digest] ${count} pending borrow request${count === 1 ? '' : 's'}`;

  const templateParams = {
    to_email: adminEmail,
    pending_count: count,
    dashboard_url: dashboardUrl || '',
    library_name: libraryName,
  };

  // Build HTML list of pending requests
  let requestsListHTML = '';
  if (count === 0) {
    requestsListHTML = '<p style="color:#1e40af;background:#eff6ff;border:1px solid #93c5fd;border-radius:8px;padding:16px;margin:16px 0;">✅ No pending borrow requests at this time.</p>';
  } else {
    const requestItems = pendingRequests.slice(0, 20).map(request => {
      const daysWaiting = request.daysWaiting || 0;
      const urgencyColor = daysWaiting > 3 ? '#dc2626' : daysWaiting > 1 ? '#ea580c' : '#2563eb';
      
      return `
        <div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:8px;padding:12px;margin:8px 0;">
          <p style="margin:0 0 4px;color:#1e40af;font-weight:600;">${escapeHTML(request.bookTitle)}</p>
          <p style="margin:0 0 4px;color:#6b7280;font-size:14px;">Requested by: ${escapeHTML(request.userName)} (${escapeHTML(request.userEmail)})</p>
          <p style="margin:0;color:${urgencyColor};font-size:14px;">
            <strong>Waiting ${daysWaiting} day${daysWaiting === 1 ? '' : 's'}</strong> • Requested: ${escapeHTML(request.requestedAt)}
          </p>
        </div>
      `;
    }).join('');

    requestsListHTML = `
      <div style="margin:16px 0;">
        ${requestItems}
        ${count > 20 ? `<p style="color:#6b7280;font-size:14px;margin-top:12px;">...and ${count - 20} more. View all in the dashboard.</p>` : ''}
      </div>
    `;
  }

  const html = `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;color:#111827;max-width:640px;margin:0 auto;padding:24px;">
    <h2 style="margin:0 0 4px;color:${count === 0 ? '#16a34a' : '#2563eb'};">📋 Pending Borrow Requests Digest</h2>
    <p style="margin:0 0 16px;color:#6b7280">${escapeHTML(libraryName)}</p>

    <p style="margin-top:0;">Your daily summary of pending borrow requests awaiting approval.</p>
    
    <div style="background:${count === 0 ? '#f0fdf4' : '#eff6ff'};border:1px solid ${count === 0 ? '#86efac' : '#93c5fd'};border-radius:8px;padding:16px;margin:16px 0;">
      <p style="margin:0;color:${count === 0 ? '#166534' : '#1e40af'};font-size:24px;font-weight:700;">${count}</p>
      <p style="margin:4px 0 0;color:${count === 0 ? '#166534' : '#1e40af'};">Pending request${count === 1 ? '' : 's'}</p>
    </div>

    ${requestsListHTML}

    ${dashboardUrl && count > 0 ? `<div style="margin:16px 0;">
      <a href="${escapeAttr(dashboardUrl)}" style="background:#2563eb;color:#fff;padding:10px 14px;border-radius:6px;text-decoration:none;display:inline-block;">Review & Approve Requests</a>
    </div>` : ''}

    ${count > 0 ? `
    <p style="color:#374151;"><strong>Recommended Actions:</strong></p>
    <ul style="color:#374151;">
      <li>Review and approve/reject pending requests</li>
      <li>Prioritize requests that have been waiting longer</li>
      <li>Check book availability before approving</li>
      <li>Contact students if clarification is needed</li>
    </ul>
    ` : ''}

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
    <p style="margin:0;color:#9ca3af;font-size:12px;">This is an automated daily digest. You're receiving this because you're an administrator.</p>
  </div>
  `;

  const text = [
    `${libraryName} — Pending Borrow Requests Digest`,
    ``,
    `Your daily summary of pending borrow requests awaiting approval.`,
    ``,
    `Pending Requests: ${count}`,
    ``,
    ...(count === 0 
      ? ['✅ No pending borrow requests at this time.']
      : [
          'Pending Requests:',
          ...pendingRequests.slice(0, 20).map(request => 
            `- "${request.bookTitle}" requested by ${request.userName} (${request.userEmail}) - Waiting ${request.daysWaiting} day${request.daysWaiting === 1 ? '' : 's'} (Requested: ${request.requestedAt})`
          ),
          ...(count > 20 ? [`...and ${count - 20} more.`] : []),
        ]
    ),
    ``,
    dashboardUrl ? `Review Requests: ${dashboardUrl}` : null,
    ``,
    ...(count > 0 ? [
      'Recommended Actions:',
      '- Review and approve/reject pending requests',
      '- Prioritize requests that have been waiting longer',
      '- Check book availability before approving',
      '- Contact students if clarification is needed',
    ] : []),
  ].filter(Boolean).join('\n');

  return { subject, html, text, templateParams };
}
