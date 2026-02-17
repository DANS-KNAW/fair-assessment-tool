import type { Child } from "hono/jsx";
import type { AdminUser } from "../../types.js";
import { MobileSidebar } from "./MobileSidebar.js";
import { MobileTopBar } from "./MobileTopBar.js";
import { Sidebar } from "./Sidebar.js";

interface AdminLayoutProps {
  title: string;
  user: AdminUser;
  currentPath: string;
  children: Child;
}

export function AdminLayout({
  title,
  user,
  currentPath,
  children,
}: AdminLayoutProps) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title} - FAIR-Aware Admin</title>
        <link rel="stylesheet" href="/css/admin.css" />
      </head>
      <body class="h-full bg-gray-50">
        <MobileSidebar user={user} currentPath={currentPath} />

        {/* Desktop sidebar */}
        <div class="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
          <Sidebar user={user} currentPath={currentPath} />
        </div>

        <div class="lg:pl-64">
          <MobileTopBar />
          <main class="py-10">
            <div class="px-4 sm:px-6 lg:px-8">{children}</div>
          </main>
        </div>

        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var container = document.getElementById('mobile-sidebar-container');
                var openBtn = document.getElementById('mobile-sidebar-open');
                var closeBtn = document.getElementById('mobile-sidebar-close');
                var backdrop = document.getElementById('mobile-sidebar-backdrop');
                function open() { container.classList.remove('hidden'); }
                function close() { container.classList.add('hidden'); }
                if (openBtn) openBtn.addEventListener('click', open);
                if (closeBtn) closeBtn.addEventListener('click', close);
                if (backdrop) backdrop.addEventListener('click', close);
              })();

              (function() {
                var channel = typeof BroadcastChannel !== 'undefined'
                  ? new BroadcastChannel('admin_session') : null;

                function logout() { window.location.href = '/admin/login'; }

                if (channel) channel.onmessage = function(e) {
                  if (e.data === 'logout') logout();
                };

                function checkSession() {
                  fetch('/admin/api/session').then(function(r) {
                    if (!r.ok) {
                      if (channel) channel.postMessage('logout');
                      logout();
                    }
                  }).catch(function() {});
                }

                var timer;
                function startPolling() {
                  stopPolling();
                  checkSession();
                  timer = setInterval(checkSession, 60000);
                }
                function stopPolling() { clearInterval(timer); }

                document.addEventListener('visibilitychange', function() {
                  document.hidden ? stopPolling() : startPolling();
                });

                if (!document.hidden) startPolling();
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
